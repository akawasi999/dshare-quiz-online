import { and, eq, gt, isNull, or } from "drizzle-orm";
import { learnerProfiles, permissionRegistry, subscriptionPlanPermissions, subscriptionPlans, userPermissionOverrides } from "../drizzle/schema";
import { getEffectiveTier } from "./membershipUtils";

type DbExecutor = any;

export type PermissionEntitlement = {
  key: string;
  name: string;
  description: string | null;
  category: string;
  type: "boolean" | "limit" | "quota";
  enabled: boolean;
  limitValue: number | null;
  limitUnit: string | null;
  requiredPlan: string | null;
};

export async function getUserEntitlements(db: DbExecutor, userId: number) {
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, userId)).limit(1);
  if (!profile) throw new Error("Không tìm thấy hồ sơ thành viên.");
  const tier = getEffectiveTier({ tier: profile.tier as "basic" | "pro" | "premium", tierExpiresAt: profile.tierExpiresAt });
  const [plan] = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.tier, tier), eq(subscriptionPlans.isActive, true))).limit(1);
  if (!plan) throw new Error("Không tìm thấy gói quyền đang hoạt động.");
  const now = new Date();
  const rows = await db.select({ permission: permissionRegistry, matrix: subscriptionPlanPermissions, override: userPermissionOverrides })
    .from(permissionRegistry)
    .leftJoin(subscriptionPlanPermissions, and(eq(subscriptionPlanPermissions.permissionId, permissionRegistry.id), eq(subscriptionPlanPermissions.planId, plan.id)))
    .leftJoin(userPermissionOverrides, and(eq(userPermissionOverrides.permissionId, permissionRegistry.id), eq(userPermissionOverrides.userId, userId), or(isNull(userPermissionOverrides.expiresAt), gt(userPermissionOverrides.expiresAt, now))))
    .where(eq(permissionRegistry.isActive, true));
  const entitlements: PermissionEntitlement[] = rows.map((row: any) => ({
    key: row.permission.key,
    name: row.permission.name,
    description: row.permission.description,
    category: row.permission.category,
    type: row.permission.type,
    enabled: row.override ? Boolean(row.override.isEnabled) : Boolean(row.matrix?.isEnabled),
    limitValue: row.override?.limitValue ?? row.matrix?.limitValue ?? null,
    limitUnit: row.matrix?.limitUnit ?? null,
    requiredPlan: plan.code,
  }));
  return { tier, plan: { id: plan.id, code: plan.code, name: plan.name }, entitlements };
}

export async function requirePermission(db: DbExecutor, userId: number, key: string) {
  const data = await getUserEntitlements(db, userId);
  const permission = data.entitlements.find(item => item.key === key);
  if (!permission?.enabled) {
    const error = new Error(`FEATURE_NOT_AVAILABLE:${key}`) as Error & { permission?: string; requiredPlan?: string | null };
    error.permission = key;
    error.requiredPlan = permission?.requiredPlan ?? null;
    throw error;
  }
  return permission;
}
