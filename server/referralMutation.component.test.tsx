// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  referral: { data: { referralCode: "DS000001", totalRewarded: 0, invitations: [], rewards: [], referredByCode: null } as any, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  apply: { isPending: false, mutate: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Học viên" }, loading: false }) }));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: { learner: { referral: { useQuery: () => mocks.referral }, applyReferralCode: { useMutation: (options: { onError?: (error: Error) => void }) => ({ ...mocks.apply, mutate: (input: { code: string }) => options.onError?.(new Error(`Mã ${input.code} không hợp lệ`)) }) } } } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));

import Referral from "../client/src/pages/Referral";

describe("Referral mutation feedback", () => {
  beforeEach(() => {
    mocks.toast.error.mockReset();
    mocks.referral.refetch.mockReset();
  });

  afterEach(cleanup);

  it("công bố lỗi rõ ràng khi mã referral bị từ chối", async () => {
    const user = userEvent.setup();
    render(<Referral />);

    await user.type(screen.getByPlaceholderText("Ví dụ: DS000001"), "bad1");
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));

    expect(mocks.toast.error).toHaveBeenCalledWith("Không thể áp dụng mã", { description: "Mã BAD1 không hợp lệ" });
  });
});
