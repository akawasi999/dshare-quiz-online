// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ reportNotFound: vi.fn() }));
vi.mock("@/components/SiteHeader", () => ({ default: () => <header>Header</header> }));
vi.mock("@/lib/trpc", () => ({ trpc: { telemetry: { reportNotFound: { useMutation: () => ({ mutate: mocks.reportNotFound }) } } } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

import NotFound from "../client/src/pages/NotFound";

describe("NotFound", () => {
  afterEach(cleanup);

  it("hiển thị lối về trang chủ và các điểm đến chính bằng URL tiếng Anh", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Không tìm thấy trang này" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Về trang chủ" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Khám phá Quiz" }).getAttribute("href")).toBe("/quiz");
    expect(screen.getByRole("link", { name: "Xem bảng giá" }).getAttribute("href")).toBe("/pricing");
    expect(mocks.reportNotFound).toHaveBeenCalledWith(expect.objectContaining({ path: "/" }));
  });
});
