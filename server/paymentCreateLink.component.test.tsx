// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  summary: { data: { profile: { pointBalance: 0, tier: "basic" } } },
  offers: { data: [{ code: "point_150", label: "150 Point", amount: 30000, regularAmount: 30000, pointAmount: 150, itemType: "point", discounted: false }], isLoading: false, error: null, refetch: vi.fn() },
  toast: { error: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Học viên" }, loading: false }) }));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: { learner: { summary: { useQuery: () => mocks.summary } }, payment: { offers: { useQuery: () => mocks.offers }, createLink: { useMutation: (options: { onError?: (error: Error) => void }) => ({ isPending: false, mutate: () => options.onError?.(new Error("PayOS đang bảo trì")) }) } } } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/billing", vi.fn()] }));

import TopUp from "../client/src/pages/TopUp";

describe("Payment createLink feedback", () => {
  beforeEach(() => mocks.toast.error.mockReset());
  afterEach(cleanup);

  it("công bố lỗi khi PayOS không thể tạo liên kết thanh toán", async () => {
    const user = userEvent.setup();
    render(<TopUp />);

    await user.click(screen.getByRole("button", { name: "Thanh toán PayOS" }));

    expect(mocks.toast.error).toHaveBeenCalledWith("PayOS đang bảo trì");
  });
});
