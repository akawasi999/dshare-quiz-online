// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  overview: { data: { users: 24, quizzes: 8, submitted: 51, pendingReports: 1 }, isLoading: false, error: null, refetch: vi.fn() },
  analytics: { data: { passRate: 76, pointsConsumed: 120, pointsTopUp: 300, pointsRewarded: 44 }, isLoading: false, error: null, refetch: vi.fn() },
  reports: { data: [{ report: { id: 7, questionId: 22, status: "pending", details: "Đáp án cần xem lại" }, reporter: "Học viên" }], isLoading: false, error: null, refetch: vi.fn() },
  audit: { data: [{ log: { id: 1, action: "quiz.published", entityType: "quiz", entityId: 8, createdAt: new Date("2026-08-22T00:00:00Z") }, actorName: "Admin", actorEmail: null }], isLoading: false, error: null, refetch: vi.fn() },
  pendingQuizzes: { data: { items: [], pagination: { totalItems: 2 } }, isLoading: false, error: null, refetch: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({ trpc: { admin: { overview: { useQuery: () => mocks.overview }, analytics: { useQuery: () => mocks.analytics }, reports: { useQuery: () => mocks.reports }, auditTrail: { useQuery: () => mocks.audit }, learning: { quizzes: { list: { useQuery: () => mocks.pendingQuizzes } } } } } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

import AdminOperationsDashboard from "../client/src/components/AdminOperationsDashboard";

describe("AdminOperationsDashboard", () => {
  afterEach(cleanup);

  it("hiển thị Learning Control Center bằng dữ liệu thực và không thay Point bằng XP", () => {
    render(<AdminOperationsDashboard />);

    expect(screen.queryByRole("heading", { name: "Điều hành học tập, không chỉ vận hành dữ liệu." })).toBeNull();
    expect(screen.getAllByRole("link", { name: /Tạo Quiz/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("Point economy, tách biệt với XP")).toBeTruthy();
    expect(screen.getByText("Hệ XP, nhiệm vụ, streak và achievement chưa được khởi tạo dữ liệu; dashboard không hiển thị số liệu thay thế.")).toBeTruthy();
    expect(screen.getAllByText("120").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Xem báo cáo/i }).getAttribute("href")).toBe("/quan-tri/bao-cao");
    expect(screen.getAllByRole("link", { name: /Chờ duyệt|Quiz chờ duyệt/i }).some(link => link.getAttribute("href") === "/quan-tri/quiz-system?status=pending_review")).toBe(true);
  });
});
