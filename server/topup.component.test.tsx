// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  offers: { data: [] as unknown[], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  summary: { data: { profile: { pointBalance: 0, tier: "basic" } }, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  createLink: { isPending: false, mutate: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Học viên" }, loading: false }) }));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    learner: { summary: { useQuery: () => mocks.summary } },
    payment: {
      offers: { useQuery: () => mocks.offers },
      createLink: { useMutation: () => mocks.createLink },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/nap-point", vi.fn()] }));

import TopUp from "../client/src/pages/TopUp";

describe("TopUp component", () => {
  beforeEach(() => {
    mocks.offers.data = [];
    mocks.offers.isLoading = false;
    mocks.offers.error = null;
    mocks.offers.refetch.mockReset();
  });

  afterEach(cleanup);

  it("hiển thị trạng thái trống khi catalog chưa có gói thanh toán", () => {
    render(<TopUp />);
    expect(screen.getByRole("status").textContent).toContain("Chưa có gói thanh toán khả dụng");
  });

  it("công bố lỗi catalog và cho phép người học thử lại", async () => {
    const user = userEvent.setup();
    mocks.offers.error = new Error("Catalog tạm thời không phản hồi");
    render(<TopUp />);
    expect(screen.getByRole("alert").textContent).toContain("Catalog tạm thời không phản hồi");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.offers.refetch).toHaveBeenCalledTimes(1);
  });
});
