// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
  permissionMutate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  management: { data: {
    plans: [{ id: 1, code: "basic", name: "Basic", tier: "basic", description: "Gói cơ bản", monthlyPrice: 0, isActive: true, isSystem: true }],
    groups: [{ id: 10, planId: 1, name: "Basic mặc định", description: "Nhóm mặc định", isSystem: true, memberCount: 4, permissions: [
      { permissionKey: "canCreateQuiz", isAllowed: true }, { permissionKey: "canUseAi", isAllowed: true }, { permissionKey: "canExportData", isAllowed: false }, { permissionKey: "canViewAdvancedReports", isAllowed: false }, { permissionKey: "canReceivePrioritySupport", isAllowed: false },
    ] }],
    memberships: [],
  }, isLoading: false, error: null },
  users: { data: [], isLoading: false, error: null },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      membershipManagement: { useQuery: () => mocks.management },
      users: { useQuery: () => mocks.users },
      saveSubscriptionPlan: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      deleteSubscriptionPlan: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      saveUserGroup: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      deleteUserGroup: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      saveCustomGroupPermissions: { useMutation: () => ({ isPending: false, mutate: mocks.permissionMutate }) },
      assignUserGroupMember: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      removeUserGroupMember: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
    useUtils: () => ({ admin: { membershipManagement: { invalidate: mocks.invalidate }, users: { invalidate: mocks.invalidate } } }),
  },
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));

import MembershipGroupPermissionsPanel from "../client/src/components/MembershipGroupPermissionsPanel";

describe("MembershipGroupPermissionsPanel", () => {
  beforeEach(() => { mocks.permissionMutate.mockReset(); mocks.invalidate.mockReset(); });
  afterEach(cleanup);

  it("hiển thị gói, nhóm và số thành viên hiện có", () => {
    render(<MembershipGroupPermissionsPanel />);
    expect(screen.getByRole("heading", { name: "Gói, nhóm & phân quyền" })).toBeTruthy();
    expect(screen.getAllByText("Basic mặc định").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4 thành viên/).length).toBeGreaterThan(0);
  });

  it("lưu ma trận quyền đã chỉnh sửa cho nhóm", async () => {
    const user = userEvent.setup();
    render(<MembershipGroupPermissionsPanel />);
    await user.click(screen.getByRole("switch", { name: "Xuất dữ liệu cho nhóm Basic mặc định" }));
    await user.click(screen.getByRole("button", { name: "Lưu quyền" }));
    expect(mocks.permissionMutate).toHaveBeenCalledWith(expect.objectContaining({ groupId: 10, permissions: expect.arrayContaining([expect.objectContaining({ permissionKey: "canExportData", isAllowed: true })]) }));
  });
});
