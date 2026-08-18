export type MembershipTier = "basic" | "pro" | "premium";

const tierRank: Record<MembershipTier, number> = { basic: 1, pro: 2, premium: 3 };

export function getEffectiveTier(input: { tier: MembershipTier; tierExpiresAt: Date | null }, now = new Date()): MembershipTier {
  if (input.tier !== "basic" && input.tierExpiresAt && input.tierExpiresAt <= now) return "basic";
  return input.tier;
}

export function getMembershipFulfillment(input: { currentTier: MembershipTier; tierExpiresAt: Date | null; targetTier: "pro" | "premium"; membershipMonths: number; now?: Date }) {
  const now = input.now ?? new Date();
  const effectiveTier = getEffectiveTier({ tier: input.currentTier, tierExpiresAt: input.tierExpiresAt }, now);
  const base = input.tierExpiresAt && input.tierExpiresAt > now ? input.tierExpiresAt : now;
  const tierExpiresAt = new Date(base);
  tierExpiresAt.setUTCMonth(tierExpiresAt.getUTCMonth() + input.membershipMonths);
  return { tier: tierRank[input.targetTier] >= tierRank[effectiveTier] ? input.targetTier : effectiveTier, tierExpiresAt };
}
