// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  catalog: { data: [] as unknown[], isLoading: false, isError: false, refetch: vi.fn() },
  payment: { data: undefined as { status: "pending" | "paid" | "cancelled" | "failed" } | undefined, isLoading: false, isError: false, error: null as Error | null, refetch: vi.fn() },
}));

vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: { list: { useQuery: () => mocks.catalog } },
    payment: { status: { useQuery: () => mocks.payment } },
  },
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => [window.location.pathname, vi.fn()],
}));

import Home from "../client/src/pages/Home";
import PaymentStatus from "../client/src/pages/PaymentStatus";

describe("Các trạng thái chất lượng của route công khai", () => {
  beforeEach(() => {
    mocks.catalog.data = [];
    mocks.catalog.isLoading = false;
    mocks.catalog.isError = false;
    mocks.catalog.refetch.mockReset();
    mocks.payment.data = undefined;
    mocks.payment.isLoading = false;
    mocks.payment.isError = false;
    mocks.payment.error = null;
    mocks.payment.refetch.mockReset();
    window.history.pushState({}, "", "/");
  });

  afterEach(cleanup);

  it("công bố lỗi catalog trên Trang chủ và cho phép thử lại", async () => {
    const user = userEvent.setup();
    mocks.catalog.isError = true;
    render(<Home />);

    expect(screen.getByRole("alert").textContent).toContain("Chưa thể cập nhật thư viện bộ đề");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.catalog.refetch).toHaveBeenCalledTimes(1);
  });

  it("công bố lỗi tra cứu thanh toán và cho phép thử lại mà không tạo đơn mới", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/payment-status?orderCode=123");
    mocks.payment.isError = true;
    mocks.payment.error = new Error("Máy chủ tạm thời không phản hồi");
    render(<PaymentStatus />);

    expect(screen.getByRole("alert").textContent).toContain("Máy chủ tạm thời không phản hồi");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.payment.refetch).toHaveBeenCalledTimes(1);
  });

  it("không hiển thị trạng thái chờ khi liên kết thanh toán không có mã đơn hợp lệ", () => {
    window.history.pushState({}, "", "/payment-status");
    render(<PaymentStatus />);

    expect(screen.getByRole("heading", { name: "Mã đơn không hợp lệ." })).toBeTruthy();
  });
});
