// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/SiteHeader", () => ({ default: () => <header>Header</header> }));
vi.mock("@/lib/trpc", () => ({ trpc: { site: { legalSupport: { useQuery: () => ({ data: { supportTitle: "Trung tâm hỗ trợ Dshare", supportDescription: "Nhận trợ giúp nhanh từ đội ngũ Dshare.", supportEmail: "support@dshare.vn", supportPhone: "0123 456 789", supportHours: "Thứ Hai – Thứ Sáu", supportUpdatedAt: new Date("2026-08-23") } }) } } } }));

import Support from "../client/src/pages/Support";

describe("Support page", () => {
  afterEach(cleanup);
  it("hiển thị đầy đủ kênh liên hệ được quản trị", () => {
    render(<Support />);
    expect(screen.getByRole("heading", { name: "Trung tâm hỗ trợ Dshare" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "support@dshare.vn" }).getAttribute("href")).toBe("mailto:support@dshare.vn");
    expect(screen.getByRole("link", { name: "0123 456 789" }).getAttribute("href")).toBe("tel:0123456789");
  });
});
