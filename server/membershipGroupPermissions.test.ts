import { describe, expect, it } from "vitest";
import { defaultMembershipGroupPermissions, membershipPermissionKeys } from "../shared/membershipGroupPermissions";

describe("nhóm người dùng theo gói", () => {
  it("có đúng ba nhóm gói và mỗi nhóm khai báo đủ quyền", () => {
    expect(defaultMembershipGroupPermissions.map(group => group.tier)).toEqual(["basic", "pro", "premium"]);
    for (const group of defaultMembershipGroupPermissions) {
      for (const permission of membershipPermissionKeys) expect(typeof group[permission]).toBe("boolean");
    }
  });

  it("giữ quyền ưu tiên hỗ trợ chỉ cho nhóm Premium theo cấu hình mặc định", () => {
    expect(defaultMembershipGroupPermissions.find(group => group.tier === "basic")?.canReceivePrioritySupport).toBe(false);
    expect(defaultMembershipGroupPermissions.find(group => group.tier === "premium")?.canReceivePrioritySupport).toBe(true);
  });
});
