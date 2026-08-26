// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bulkMutate: vi.fn(),
  statusMutate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  users: { data: { items: [{ user: { id: 9, name: "Người làm bài mẫu", email: "participant@example.com", openId: "participant-9", createdAt: new Date() }, profile: { tier: "basic", pointBalance: 20, isBanned: false }, completedCount: 3 }], total: 25, page: 1, pageSize: 12, totalPages: 3 }, isLoading: false, refetch: vi.fn() },
  detail: { data: { user: { id: 9, name: "Người làm bài mẫu", email: "participant@example.com", openId: "participant-9" }, profile: { tier: "pro", pointBalance: 170, isBanned: false }, activity: [], recentAttempts: [], recentTransactions: [], paymentOrders: [{ order: { id: 42, description: "Nâng cấp PRO", itemCode: "membership-2", payosOrderCode: 1787025000123, status: "paid", createdAt: new Date("2026-08-20T00:00:00Z") }, emailDeliveries: [{ id: 11, subject: "Xác nhận kích hoạt PRO · Dshare Quiz Online", recipient: "participant@example.com", status: "sent", errorMessage: null, createdAt: new Date("2026-08-20T00:02:00Z") }] }] }, isLoading: false },
  permissionAudit: { data: [{ id: 77, action: "user.tier_updated", metadata: { previousTier: "basic", tier: "pro" }, actor: { id: 1, name: "Quản trị viên", email: "admin@example.com" }, createdAt: new Date("2026-08-21T00:00:00Z") }], isLoading: false, refetch: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({ trpc: { admin: {
  users: { useQuery: () => mocks.users },
  userDetail: { useQuery: () => mocks.detail },
  userPermissionAudit: { useQuery: () => mocks.permissionAudit },
  updateUserTier: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
  updateUserStatus: { useMutation: () => ({ isPending: false, mutate: mocks.statusMutate }) },
  adjustPoints: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
  bulkUpdateUsers: { useMutation: () => ({ isPending: false, mutate: mocks.bulkMutate }) },
} } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));

import UserManagementPanel from "../client/src/components/UserManagementPanel";

describe("UserManagementPanel enhancements", () => {
  beforeEach(() => { mocks.bulkMutate.mockReset(); mocks.statusMutate.mockReset(); });
  afterEach(cleanup);

  it("hiển thị phân trang phía máy chủ", () => {
    render(<UserManagementPanel />);
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByText("Hiển thị 1–1 / 25")).toBeTruthy();
  });

  it("cho phép chọn nhiều và gửi thao tác đổi gói hàng loạt", async () => {
    const user = userEvent.setup();
    render(<UserManagementPanel />);
    await user.click(screen.getAllByLabelText("Chọn Người làm bài mẫu")[0]);
    expect(screen.getByText("Đã chọn 1 tài khoản")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Thao tác hàng loạt"), "pro");
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(mocks.bulkMutate).toHaveBeenCalledWith({ userIds: [9], tier: "pro" });
  });

  it("hiển thị lịch sử gửi email theo từng đơn thanh toán trong chi tiết tài khoản", async () => {
    const user = userEvent.setup();
    render(<UserManagementPanel />);
    await user.click(screen.getAllByText("Người làm bài mẫu")[0]);
    expect(screen.getByText("Lịch sử xác nhận giao dịch")).toBeTruthy();
    expect(screen.getByText("Nâng cấp PRO")).toBeTruthy();
    expect(screen.getByText("Xác nhận kích hoạt PRO · Dshare Quiz Online")).toBeTruthy();
    expect(screen.getByText("Đã gửi")).toBeTruthy();
  });

  it("hiển thị audit thay đổi quyền, gói và người thực hiện trong User 360°", async () => {
    const user = userEvent.setup();
    render(<UserManagementPanel />);
    await user.click(screen.getAllByText("Người làm bài mẫu")[0]);
    expect(screen.getByText("Lịch sử thay đổi quyền")).toBeTruthy();
    expect(screen.getByText("Cập nhật gói tài khoản")).toBeTruthy();
    expect(screen.getByText("Từ Basic sang PRO.")).toBeTruthy();
    expect(screen.getByText(/Quản trị viên/)).toBeTruthy();
  });

  it("yêu cầu lý do trước khi đình chỉ và gửi trạng thái cụ thể tới máy chủ", async () => {
    const user = userEvent.setup();
    render(<UserManagementPanel />);
    await user.click(screen.getAllByRole("button", { name: /Đình chỉ/ })[0]);
    expect(screen.getAllByText("Đình chỉ").length).toBeGreaterThan(1);
    const confirm = screen.getAllByRole("button", { name: "Đình chỉ" }).at(-1)!;
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByLabelText(/Lý do cụ thể/), "Cần xác minh hoạt động bất thường.");
    await user.click(confirm);
    expect(mocks.statusMutate).toHaveBeenCalledWith({ userId: 9, status: "suspended", reason: "Cần xác minh hoạt động bất thường." });
  });
});
