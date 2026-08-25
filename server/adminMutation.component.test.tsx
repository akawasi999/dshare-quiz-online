// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  users: { data: { items: [{ user: { id: 4, name: "Học viên", email: "hocvien@example.com", openId: "user-4", createdAt: new Date() }, profile: { tier: "basic", pointBalance: 0, isBanned: false }, completedCount: 0 }], total: 1, page: 1, pageSize: 12, totalPages: 1 }, isLoading: false, refetch: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, role: "admin" }, loading: false }) }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/AdminOperationsDashboard", () => ({ default: () => null }));
vi.mock("@/components/AdminBugReportsPanel", () => ({ default: () => null }));
vi.mock("@/components/AdminPointLedgerPanel", () => ({ default: () => null }));
vi.mock("@/components/AIQuestionGeneratorPanel", () => ({ default: () => null }));
vi.mock("@/components/LiveMonitoringPanel", () => ({ default: () => null }));
vi.mock("@/components/QuestionEditorPanel", () => ({ default: () => null }));
vi.mock("@/components/QuestionTransferPanel", () => ({ default: () => null }));
vi.mock("@/components/RandomQuizBuilder", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: { admin: { users: { useQuery: () => mocks.users }, userDetail: { useQuery: () => ({ data: undefined, isLoading: false }) }, updateUserTier: { useMutation: (options: { onError?: (error: Error) => void }) => ({ isPending: false, mutate: () => options.onError?.(new Error("Không thể cập nhật dữ liệu")) }) }, updateUserStatus: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, adjustPoints: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, bulkUpdateUsers: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } } } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("wouter", () => ({ useLocation: () => ["/admin/users", vi.fn()] }));

import Admin from "../client/src/pages/Admin";

describe("Admin mutation feedback", () => {
  beforeEach(() => mocks.toast.error.mockReset());
  afterEach(cleanup);

  it("công bố lỗi khi không thể thay đổi hạng thành viên", async () => {
    const user = userEvent.setup();
    render(<Admin />);

    await user.selectOptions(screen.getAllByLabelText("Hạng của Học viên")[0], "pro");

    expect(mocks.toast.error).toHaveBeenCalledWith("Không thể cập nhật hạng", { description: "Không thể cập nhật dữ liệu" });
  });
});
