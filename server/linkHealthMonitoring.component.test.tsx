// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  monitoring: { data: { active: [], recent: [], refreshedAt: new Date("2026-08-26T00:00:00.000Z") }, isLoading: false, error: null, isFetching: false, refetch: vi.fn() },
  health: { data: { eventsLast24h: 4, eventsLast7d: 7, uniquePaths: 2, topPaths: [{ path: "/quiz/create", count: 4, lastSeenAt: new Date("2026-08-26T00:00:00.000Z") }], recent: [], refreshedAt: new Date() }, isLoading: false, error: null, isFetching: false, refetch: vi.fn() },
}));

vi.mock("@/components/CPanelPageHeader", () => ({ CPanelPageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock("@/lib/trpc", () => ({ trpc: { admin: { liveMonitoring: { useQuery: () => mocks.monitoring }, linkHealth: { useQuery: () => mocks.health } } } }));

import LiveMonitoringPanel from "../client/src/components/LiveMonitoringPanel";

describe("Link health dashboard", () => {
  afterEach(cleanup);
  it("hiển thị chỉ số 404 và đường dẫn cần ưu tiên xử lý", () => {
    render(<LiveMonitoringPanel />);
    expect(screen.getByText("Lỗi 404 & liên kết hỏng")).toBeTruthy();
    expect(screen.getByText("404 · 24 giờ")).toBeTruthy();
    expect(screen.getByText("/quiz/create")).toBeTruthy();
  });
});
