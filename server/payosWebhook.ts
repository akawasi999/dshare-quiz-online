import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auditLogs, learnerProfiles, paymentRecords, walletTransactions } from "../drizzle/schema";
import { ensureLearnerProfile, getDb } from "./db";
import { addMembershipMonths, verifyPayosSignature } from "./payosUtils";
import { getPayosWebhookValidationError, isSuccessfulPayosWebhook, type PayosWebhookData } from "./payosWebhookUtils";

const webhookSchema = z.object({
  code: z.string(),
  desc: z.string(),
  success: z.boolean(),
  signature: z.string().min(1),
  data: z.object({
    orderCode: z.number().int().positive(),
    amount: z.number().int().positive(),
    code: z.string(),
    desc: z.string(),
    reference: z.string().optional(),
    currency: z.string().optional(),
    paymentLinkId: z.string().optional(),
  }).passthrough(),
});

const tierRank = { basic: 1, pro: 2, premium: 3 } as const;

async function processPayosWebhook(payload: z.infer<typeof webhookSchema>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const recordRows = await db.select().from(paymentRecords).where(eq(paymentRecords.payosOrderCode, payload.data.orderCode)).limit(1);
  const record = recordRows[0];
  if (!record) throw new Error("Không tìm thấy đơn PayOS tương ứng.");
  if (record.status === "paid") return { idempotent: true, recordId: record.id };

  const validationError = getPayosWebhookValidationError({
    expectedOrderCode: record.payosOrderCode!,
    expectedAmount: record.amount ?? 0,
    payload: { data: payload.data as PayosWebhookData },
  });
  if (validationError) throw new Error(validationError);

  if (!isSuccessfulPayosWebhook({ ...payload, data: payload.data as PayosWebhookData })) {
    await db.update(paymentRecords).set({ status: "failed", webhookPayload: payload, webhookReference: payload.data.reference ?? null }).where(and(eq(paymentRecords.id, record.id), eq(paymentRecords.status, "pending")));
    return { idempotent: false, recordId: record.id, status: "failed" as const };
  }

  await ensureLearnerProfile(record.userId);
  return db.transaction(async tx => {
    const latestRows = await tx.select().from(paymentRecords).where(eq(paymentRecords.id, record.id)).limit(1);
    const latest = latestRows[0];
    if (!latest) throw new Error("Không tìm thấy đơn PayOS tương ứng.");
    if (latest.status === "paid") return { idempotent: true, recordId: latest.id };

    const updated = await tx.update(paymentRecords).set({
      status: "paid",
      payosPaymentLinkId: payload.data.paymentLinkId ?? latest.payosPaymentLinkId,
      webhookReference: payload.data.reference ?? null,
      webhookPayload: payload,
      paidAt: new Date(),
    }).where(and(eq(paymentRecords.id, latest.id), eq(paymentRecords.status, "pending")));
    if (!updated[0].affectedRows) return { idempotent: true, recordId: latest.id };

    const profiles = await tx.select().from(learnerProfiles).where(eq(learnerProfiles.userId, latest.userId)).limit(1);
    const profile = profiles[0];
    if (!profile) throw new Error("Không tìm thấy hồ sơ học viên.");
    const pointAmount = latest.pointAmount ?? 0;
    const balanceAfter = profile.pointBalance + pointAmount;
    const membershipBase = profile.tierExpiresAt && profile.tierExpiresAt > new Date() ? profile.tierExpiresAt : new Date();
    const tierExpiresAt = latest.targetTier && latest.membershipMonths ? addMembershipMonths(membershipBase, latest.membershipMonths) : profile.tierExpiresAt;
    const tier = latest.targetTier && tierRank[latest.targetTier] >= tierRank[profile.tier] ? latest.targetTier : profile.tier;
    await tx.update(learnerProfiles).set({ pointBalance: balanceAfter, tier, tierExpiresAt }).where(eq(learnerProfiles.id, profile.id));

    if (pointAmount > 0) {
      await tx.insert(walletTransactions).values({
        userId: latest.userId,
        type: latest.itemType === "points" ? "top_up" : "plan_upgrade",
        amount: pointAmount,
        balanceAfter,
        description: latest.itemType === "points" ? `Nạp Point qua PayOS: ${latest.itemCode}` : `Kích hoạt gói ${latest.targetTier?.toUpperCase() ?? ""} qua PayOS`,
        referenceType: "payment_record",
        referenceId: latest.id,
      });
    }
    await tx.insert(auditLogs).values({ actorUserId: latest.userId, action: "payos.payment_paid", entityType: "payment_record", entityId: latest.id, metadata: { orderCode: latest.payosOrderCode, amount: latest.amount, itemCode: latest.itemCode } });
    return { idempotent: false, recordId: latest.id, status: "paid" as const };
  });
}

export function registerPayosWebhook(app: Express) {
  app.post("/api/payments/payos/webhook", async (req: Request, res: Response) => {
    const parsed = webhookSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ code: "01", desc: "Webhook payload không hợp lệ." });
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
    if (!checksumKey || !verifyPayosSignature(parsed.data.data, parsed.data.signature, checksumKey)) {
      return res.status(400).json({ code: "01", desc: "Webhook signature không hợp lệ." });
    }
    try {
      await processPayosWebhook(parsed.data);
      return res.status(200).json({ code: "00", desc: "success" });
    } catch (error) {
      console.error("[PayOS] Webhook processing failed:", error);
      return res.status(400).json({ code: "01", desc: error instanceof Error ? error.message : "Không thể xử lý webhook." });
    }
  });
}
