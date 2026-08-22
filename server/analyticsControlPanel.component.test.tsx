// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ analytics: { data: { users: 12, completed: 44, passRate: 72, pointsConsumed: 80, pointsTopUp: 150, pointsRewarded: 30, popularQuizzes: [{ title: "Python cơ bản", count: 20, passRate: 75 }] }, isLoading: false, error: null, refetch: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: { admin: { analytics: { useQuery: () => mocks.analytics } } } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("recharts", () => ({ ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CartesianGrid: () => null, Cell: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null, Bar: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

import AnalyticsControlPanel from "../client/src/components/AnalyticsControlPanel";

describe("AnalyticsControlPanel", () => {
  afterEach(cleanup);
  it("tổng hợp số liệu thật và ghi rõ XP chưa được suy diễn từ Point", () => {
    render(<AnalyticsControlPanel />);
    expect(screen.getByRole("heading", { name: "Analytics" })).toBeTruthy();
    expect(screen.getByText("80")).toBeTruthy();
    expect(screen.getByText("Python cơ bản")).toBeTruthy();
    expect(screen.getByText(/XP, retention, cohort, streak và mission/i)).toBeTruthy();
  });
});
