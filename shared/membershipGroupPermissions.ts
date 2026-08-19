export const membershipGroupTiers = ["basic", "pro", "premium"] as const;
export type MembershipGroupTier = typeof membershipGroupTiers[number];
export const membershipPermissionKeys = ["canCreateQuiz", "canUseAi", "canExportData", "canViewAdvancedReports", "canReceivePrioritySupport"] as const;
export type MembershipPermissionKey = typeof membershipPermissionKeys[number];

export const defaultMembershipGroupPermissions: Array<{ tier: MembershipGroupTier } & Record<MembershipPermissionKey, boolean>> = [
  { tier: "basic", canCreateQuiz: true, canUseAi: true, canExportData: false, canViewAdvancedReports: false, canReceivePrioritySupport: false },
  { tier: "pro", canCreateQuiz: true, canUseAi: true, canExportData: true, canViewAdvancedReports: true, canReceivePrioritySupport: false },
  { tier: "premium", canCreateQuiz: true, canUseAi: true, canExportData: true, canViewAdvancedReports: true, canReceivePrioritySupport: true },
];
