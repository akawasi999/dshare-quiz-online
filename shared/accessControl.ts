export const permissionKeys = [
  "profile.view",
  "profile.edit",
  "quiz.view",
  "quiz.create",
  "quiz.edit",
  "quiz.delete",
  "quiz.publish",
  "quiz.take",
  "quiz.submit",
  "quiz.save",
  "quiz.bookmark",
  "result.view",
  "result.history",
  "learning.view",
  "learning.progress",
  "mission.view",
  "mission.claim",
  "achievement.view",
  "point.view",
  "point.topup",
  "point.spend",
  "account.upgrade",
  "ai.quiz.generate",
  "notification.view",
  "notification.manage",
  "settings.view",
  "settings.edit",
  "payment.view",
  "payment.create",
  "admin.access",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];
export type AccountStatus = "active" | "suspended" | "banned" | "deactivated";
export type AppRole = "user" | "admin";

const userPermissions = new Set<PermissionKey>(permissionKeys.filter(permission => permission !== "admin.access"));

export function hasRolePermission(role: AppRole, permission: PermissionKey) {
  return role === "admin" || userPermissions.has(permission);
}

export function accountStatusMessage(status: Exclude<AccountStatus, "active">) {
  if (status === "suspended") return "Tài khoản của bạn đang tạm ngưng. Vui lòng liên hệ bộ phận hỗ trợ.";
  if (status === "banned") return "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ nếu cần hỗ trợ thêm.";
  return "Tài khoản của bạn đã bị vô hiệu hóa.";
}
