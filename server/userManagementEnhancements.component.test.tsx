// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bulkMutate: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  users: { data: { items: [{ user: { id: 9, name: "Người học mẫu", email: "learner@example.com", openId: "learner-9", createdAt: new Date() }, profile: { tier: "basic", pointBalance: 20, isBanned: false }, completedCount: 3 }], total: 25, page: 1, pageSize: 12, totalPages: 3 }, isLoading: false, refetch: vi.fn() },
  detail: { data: { user: { id: 9, name: "Người học mẫu", email: "learner@example.com", openId: "learner-9" }, profile: { tier: "pro", pointBalance: 170, isBanned: false }, activity: [], recentAttempts: [], recentTransactions: [], paymentOrders: [{ order: { id: 42, description: "Nâng cấp PRO", itemCode: "membership-2", payosOrderCode: 1787025000123, status: "paid", createdAt: new Date("2026-08-20T00:00:00Z") }, emailDeliveries: [{ id: 11, subject: "Xác nhận kích hoạt PRO · Dshare Quiz Online", recipient: "learner@example.com", status: "sent", errorMessage: null, createdAt: new Date("2026-08-20T00:02:00Z") }] }] }, isLoading: false },
}));

vi.mock("@/lib/trpc", () => ({ trpc: { admin: {
  users: { useQuery: () => mocks.users },
  userDetail: { useQuery: () => mocks.detail },
  updateUserTier: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
  updateUserStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
  adjustPoints: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
  bulkUpdateUsers: { useMutation: () => ({ isPending: false, mutate: mocks.bulkMutate }) },
} } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));

import UserManagementPanel from "../client/src/components/UserManagementPanel";

describe("UserManagementPanel enhancements", () => {
  beforeEach(() => mocks.bulkMutate.mockReset());
  afterEach(cleanup);

  it("hiển thị phân trang phía máy chủ", () => {
    render(<UserManagementPanel />);
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByText("Hiển thị 1–1 / 25")).toBeTruthy();
  });

  it("cho phép chọn nhiều và gửi thao tác đổi gói hàng loạt", async () => {
    const user = userEvent.setup();
    render(<UserManagementPanel />);
    await user.click(screen.getByLabelText("Chọn Người học mẫu"));
    expect(screen.getByText("Đã chọn 1 người dùng")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Thao tác hàng loạt"), "pro");
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(mocks.bulkMutate).toHaveBeenCalledWith({ userIds: [9], tier: "pro" });
  });

  it("hiển thị lịch sử gửi email theo từng đơn thanh toán trong chi tiết thành viên", async () => {
    const user = userEvent.setup();
    render(<UserManagementPanel />);
    await user.click(screen.getByText("Người học mẫu"));
    expect(screen.getByText("Lịch sử xác nhận giao dịch")).toBeTruthy();
    expect(screen.getByText("Nâng cấp PRO")).toBeTruthy();
    expect(screen.getByText("Xác nhận kích hoạt PRO · Dshare Quiz Online")).toBeTruthy();
    expect(screen.getByText("Đã gửi")).toBeTruthy();
  });
});
