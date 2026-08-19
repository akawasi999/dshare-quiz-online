// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const mocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  management: { data: {
    permissionCatalog: ["canCreateQuiz", "canUseAi", "canExportData", "canViewAdvancedReports", "canReceivePrioritySupport"],
    plans: [{ id: 1, code: "basic", name: "Basic", tier: "basic", description: "Gói cơ bản", monthlyPrice: 0, promoPrice: null, displayOrder: 1, isActive: true, isSystem: true }],
    groups: [{ id: 10, planId: 1, name: "Basic mặc định", description: "Nhóm mặc định", displayOrder: 1, isSystem: true, memberCount: 4, permissions: [
      { permissionKey: "canCreateQuiz", isAllowed: true }, { permissionKey: "canUseAi", isAllowed: true }, { permissionKey: "canExportData", isAllowed: false }, { permissionKey: "canViewAdvancedReports", isAllowed: false }, { permissionKey: "canReceivePrioritySupport", isAllowed: false },
    ] }],
    memberships: [],
  }, isLoading: false, error: null },
  users: { data: { items: [] }, isLoading: false, error: null },
  savePlan: { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ success: true, planId: 1 }), isPending: false },
  saveGroup: { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ success: true, groupId: 10 }), isPending: false },
  savePermissions: { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ success: true }), isPending: false },
  savePlanPermissions: { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({ success: true, groupCount: 1 }), isPending: false },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      membershipManagement: { useQuery: () => mocks.management },
      users: { useQuery: () => mocks.users },
      saveSubscriptionPlan: { useMutation: () => mocks.savePlan },
      deleteSubscriptionPlan: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      saveUserGroup: { useMutation: () => mocks.saveGroup },
      deleteUserGroup: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      saveCustomGroupPermissions: { useMutation: () => mocks.savePermissions },
      savePlanLinkedGroupPermissions: { useMutation: () => mocks.savePlanPermissions },
      assignUserGroupMember: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      removeUserGroupMember: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
    useUtils: () => ({ admin: { membershipManagement: { invalidate: mocks.invalidate }, users: { invalidate: mocks.invalidate } } }),
  },
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));

import MembershipGroupPermissionsPanel from "../client/src/components/MembershipGroupPermissionsPanel";

describe("MembershipGroupPermissionsPanel", () => {
  beforeEach(() => {
    mocks.invalidate.mockReset();
    mocks.savePlan.mutateAsync.mockClear();
    mocks.saveGroup.mutateAsync.mockClear();
    mocks.savePermissions.mutateAsync.mockClear();
    mocks.savePlanPermissions.mutateAsync.mockClear();
  });
  afterEach(cleanup);

  it("hiển thị menu tạo nhóm và danh sách nhóm với số thành viên", () => {
    render(<MembershipGroupPermissionsPanel />);
    expect(screen.getByRole("heading", { name: "Nhóm người dùng" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tạo nhóm người dùng" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gói đăng ký" })).toBeTruthy();
    expect(screen.getAllByText("Basic mặc định").length).toBeGreaterThan(0);
    expect(screen.getByText("4 thành viên")).toBeTruthy();
  });

  it("mở biểu mẫu cấu hình nhóm khi chọn tên nhóm", async () => {
    const user = userEvent.setup();
    render(<MembershipGroupPermissionsPanel />);
    await user.click(screen.getAllByText("Basic mặc định")[0]);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Cấu hình nhóm người dùng")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getByDisplayValue("Basic mặc định")).toBeTruthy();
    expect(screen.getByText("Các quyền có sẵn")).toBeTruthy();
  });

  it("mở danh sách và cấu hình gói gồm giá khuyến mãi cùng quyền liên kết", async () => {
    const user = userEvent.setup();
    render(<MembershipGroupPermissionsPanel />);
    await user.click(screen.getByRole("button", { name: "Gói đăng ký" }));
    expect(screen.getByText("Danh sách gói")).toBeTruthy();
    await user.click(screen.getAllByText("Basic").find(element => element.tagName === "P")!);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Cấu hình gói đăng ký")).toBeTruthy();
    expect(screen.getByText("Giá khuyến mãi (đ/tháng)")).toBeTruthy();
    expect(screen.getByText("Quyền liên kết với nhóm người dùng")).toBeTruthy();
  });
});
