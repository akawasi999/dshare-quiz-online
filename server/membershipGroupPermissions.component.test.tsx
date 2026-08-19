// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
  mutate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  groups: { data: [
    { id: 1, tier: "basic", canCreateQuiz: true, canUseAi: true, canExportData: false, canViewAdvancedReports: false, canReceivePrioritySupport: false, memberCount: 4 },
    { id: 2, tier: "pro", canCreateQuiz: true, canUseAi: true, canExportData: true, canViewAdvancedReports: true, canReceivePrioritySupport: false, memberCount: 2 },
    { id: 3, tier: "premium", canCreateQuiz: true, canUseAi: true, canExportData: true, canViewAdvancedReports: true, canReceivePrioritySupport: true, memberCount: 1 },
  ], isLoading: false, error: null },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      groupPermissions: { useQuery: () => mocks.groups },
      saveGroupPermissions: { useMutation: () => ({ isPending: false, mutate: mocks.mutate }) },
    },
    useUtils: () => ({ admin: { groupPermissions: { invalidate: mocks.invalidate } } }),
  },
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));

import MembershipGroupPermissionsPanel from "../client/src/components/MembershipGroupPermissionsPanel";

describe("MembershipGroupPermissionsPanel", () => {
  beforeEach(() => { mocks.mutate.mockReset(); mocks.invalidate.mockReset(); });
  afterEach(cleanup);

  it("hiển thị ba nhóm theo gói cùng số thành viên", () => {
    render(<MembershipGroupPermissionsPanel />);
    expect(screen.getByRole("heading", { name: "Nhóm người dùng & phân quyền" })).toBeTruthy();
    expect(screen.getByText("4 thành viên")).toBeTruthy();
    expect(screen.getByText("2 thành viên")).toBeTruthy();
    expect(screen.getByText("1 thành viên")).toBeTruthy();
  });

  it("lưu ma trận quyền đã chỉnh sửa của nhóm Basic", async () => {
    const user = userEvent.setup();
    render(<MembershipGroupPermissionsPanel />);
    await user.click(screen.getByRole("switch", { name: "Xuất dữ liệu cho nhóm Basic" }));
    await user.click(screen.getAllByRole("button", { name: "Lưu quyền" })[0]!);
    expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({ tier: "basic", canExportData: true }));
  });
});
