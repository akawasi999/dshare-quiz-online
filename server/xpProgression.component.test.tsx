// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ admin: { xp: { overview: { invalidate: vi.fn() } } } }),
    admin: {
      xp: {
        overview: { useQuery: () => ({ data: { totalIssued: 0, activeLearners: 0, levels: [], rules: [], recent: [] }, isLoading: false, isFetching: false, refetch: vi.fn() }) },
        saveLevel: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        saveRule: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import XpProgressionPanel from "../client/src/components/XpProgressionPanel";

describe("XP progression workspace", () => {
  afterEach(cleanup);

  it("giữ XP tách khỏi Point và không tạo số liệu mô phỏng khi ledger rỗng", () => {
    render(<XpProgressionPanel />);
    expect(screen.getByRole("heading", { name: "XP & Gamification" })).toBeTruthy();
    expect(screen.getByText(/không kế thừa số dư hay giao dịch Point/i)).toBeTruthy();
    expect(screen.getByText("Chưa có giao dịch XP thực tế để hiển thị.")).toBeTruthy();
    expect(screen.getByText("Chưa có Rule XP. Không có phần thưởng nào được suy diễn từ Point.")).toBeTruthy();
  });
});
