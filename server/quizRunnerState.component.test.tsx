// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  detail: { data: undefined, isLoading: false, isError: true, error: new Error("Catalog tạm thời không phản hồi"), refetch: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1 }, loading: false }) }));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { detail: { useQuery: () => mocks.detail } }, quiz: { start: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) }, saveAnswer: { useMutation: () => ({ mutate: vi.fn() }) }, submit: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) }, securityEvent: { useMutation: () => ({ mutate: vi.fn() }) } } } }));
vi.mock("sonner", () => ({ toast: { warning: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useRoute: () => [true, { id: "999" }], useLocation: () => ["/quiz/999", vi.fn()] }));

import QuizRunner from "../client/src/pages/QuizRunner";

describe("QuizRunner data state", () => {
  beforeEach(() => mocks.detail.refetch.mockReset());
  afterEach(cleanup);

  it("công bố lỗi chi tiết bộ đề và cho phép thử lại", async () => {
    const user = userEvent.setup();
    render(<QuizRunner />);

    expect(screen.getByRole("alert").textContent).toContain("Catalog tạm thời không phản hồi");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.detail.refetch).toHaveBeenCalledTimes(1);
  });
});
