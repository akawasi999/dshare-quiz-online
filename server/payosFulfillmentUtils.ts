import { getMembershipFulfillment, type MembershipTier } from "./membershipUtils";

export type PayosFulfillmentRecord = {
  id: number;
  itemType: "points" | "membership";
  itemCode: string;
  pointAmount: number | null;
  targetTier: MembershipTier | null;
  membershipMonths: number | null;
};

export type PayosFulfillmentProfile = { tier: MembershipTier; tierExpiresAt: Date | null; pointBalance: number };

export function buildPayosFulfillmentEffects(input: { record: PayosFulfillmentRecord; profile: PayosFulfillmentProfile; now?: Date }) {
  const pointAmount = input.record.pointAmount ?? 0;
  const targetTier = input.record.targetTier === "pro" || input.record.targetTier === "premium" ? input.record.targetTier : null;
  const membership = targetTier && input.record.membershipMonths
    ? getMembershipFulfillment({ currentTier: input.profile.tier, tierExpiresAt: input.profile.tierExpiresAt, targetTier, membershipMonths: input.record.membershipMonths, now: input.now })
    : { tier: input.profile.tier, tierExpiresAt: input.profile.tierExpiresAt };
  const balanceAfter = input.profile.pointBalance + pointAmount;
  return {
    profile: { pointBalance: balanceAfter, tier: membership.tier, tierExpiresAt: membership.tierExpiresAt },
    wallet: pointAmount > 0 ? { type: input.record.itemType === "points" ? "top_up" as const : "plan_upgrade" as const, amount: pointAmount, balanceAfter, description: input.record.itemType === "points" ? `Nạp Point qua PayOS: ${input.record.itemCode}` : `Kích hoạt gói ${targetTier?.toUpperCase() ?? ""} qua PayOS` } : null,
  };
}
