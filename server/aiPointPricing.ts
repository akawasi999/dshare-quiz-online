import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { learnerProfiles, pointPriceRules, walletTransactions } from "../drizzle/schema";

type DbExecutor = any;

export type AiPointQuote = {
  code: string;
  name: string;
  description: string | null;
  pointCost: number;
  balance: number;
  canAfford: boolean;
};

export async function getAiPointQuote(db: DbExecutor, userId: number, code: string): Promise<AiPointQuote> {
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không tìm thấy ví Point của bạn." });
  const [rule] = await db.select().from(pointPriceRules).where(and(eq(pointPriceRules.code, code), eq(pointPriceRules.isActive, true))).limit(1);
  const pointCost = Math.max(0, rule?.pointCost ?? 0);
  return {
    code,
    name: rule?.name ?? "Tính năng AI nâng cao",
    description: rule?.description ?? null,
    pointCost,
    balance: profile.pointBalance,
    canAfford: profile.pointBalance >= pointCost,
  };
}

export async function getAiPointQuotes(db: DbExecutor, userId: number) {
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không tìm thấy ví Point của bạn." });
  const rules = await db.select().from(pointPriceRules).where(and(eq(pointPriceRules.isActive, true), sql`${pointPriceRules.code} like 'ai_%'`));
  return { balance: profile.pointBalance, rules: rules.map((rule: typeof pointPriceRules.$inferSelect) => ({ code: rule.code, name: rule.name, description: rule.description, pointCost: rule.pointCost, canAfford: profile.pointBalance >= rule.pointCost })) };
}

export async function chargeAiPoints(db: DbExecutor, input: { userId: number; code: string; requestKey: string }) {
  const quote = await getAiPointQuote(db, input.userId, input.code);
  if (quote.pointCost === 0) return { ...quote, charged: false, transactionId: null as number | null };
  if (!quote.canAfford) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Số dư Point không đủ cho ${quote.name}. Cần ${quote.pointCost.toLocaleString("vi-VN")} Point, bạn còn ${quote.balance.toLocaleString("vi-VN")} Point.` });
  const dedupeKey = `ai-charge:${input.userId}:${input.requestKey}`.slice(0, 191);
  const existing = await db.select().from(walletTransactions).where(eq(walletTransactions.dedupeKey, dedupeKey)).limit(1);
  if (existing[0]) return { ...quote, balance: existing[0].balanceAfter, charged: true, transactionId: existing[0].id };

  let transactionId: number | null = null;
  let balanceAfter = quote.balance;
  await db.transaction(async (tx: DbExecutor) => {
    const [profile] = await tx.select().from(learnerProfiles).where(eq(learnerProfiles.userId, input.userId)).limit(1);
    if (!profile || profile.pointBalance < quote.pointCost) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Số dư Point không đủ cho ${quote.name}.` });
    balanceAfter = profile.pointBalance - quote.pointCost;
    await tx.update(learnerProfiles).set({ pointBalance: balanceAfter }).where(eq(learnerProfiles.id, profile.id));
    try {
      const created = await tx.insert(walletTransactions).values({ userId: input.userId, type: "premium_feature", amount: -quote.pointCost, balanceBefore: profile.pointBalance, balanceAfter, description: `AI nâng cao: ${quote.name}`, referenceType: "ai_pricing", dedupeKey, metadata: { code: input.code, requestKey: input.requestKey } });
      transactionId = Number(created[0].insertId);
    } catch (error) {
      const duplicate = await tx.select().from(walletTransactions).where(eq(walletTransactions.dedupeKey, dedupeKey)).limit(1);
      if (!duplicate[0]) throw error;
      transactionId = duplicate[0].id;
      balanceAfter = duplicate[0].balanceAfter;
    }
  });
  return { ...quote, balance: balanceAfter, charged: true, transactionId };
}

export async function refundAiPoints(db: DbExecutor, input: { userId: number; charge: Awaited<ReturnType<typeof chargeAiPoints>>; requestKey: string; reason: string }) {
  if (!input.charge.charged || !input.charge.transactionId || input.charge.pointCost <= 0) return;
  const dedupeKey = `ai-refund:${input.userId}:${input.requestKey}`.slice(0, 191);
  const existing = await db.select().from(walletTransactions).where(eq(walletTransactions.dedupeKey, dedupeKey)).limit(1);
  if (existing[0]) return;
  await db.transaction(async (tx: DbExecutor) => {
    const [profile] = await tx.select().from(learnerProfiles).where(eq(learnerProfiles.userId, input.userId)).limit(1);
    if (!profile) return;
    const duplicate = await tx.select().from(walletTransactions).where(eq(walletTransactions.dedupeKey, dedupeKey)).limit(1);
    if (duplicate[0]) return;
    const balanceAfter = profile.pointBalance + input.charge.pointCost;
    await tx.update(learnerProfiles).set({ pointBalance: balanceAfter }).where(eq(learnerProfiles.id, profile.id));
    await tx.insert(walletTransactions).values({ userId: input.userId, type: "refund", amount: input.charge.pointCost, balanceBefore: profile.pointBalance, balanceAfter, description: `Hoàn Point AI: ${input.reason}`.slice(0, 500), referenceType: "ai_pricing", referenceId: input.charge.transactionId, dedupeKey, metadata: { code: input.charge.code, requestKey: input.requestKey } });
  });
}

export async function runWithAiPointCharge<T>(db: DbExecutor, input: { userId: number; code: string; requestKey: string }, execute: () => Promise<T>) {
  const charge = await chargeAiPoints(db, input);
  try {
    const value = await execute();
    return { value, pointCharge: { code: charge.code, name: charge.name, pointCost: charge.pointCost, balanceAfter: charge.balance } };
  } catch (error) {
    await refundAiPoints(db, { userId: input.userId, charge, requestKey: input.requestKey, reason: charge.name });
    throw error;
  }
}
