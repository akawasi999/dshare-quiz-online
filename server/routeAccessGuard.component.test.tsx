// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: null as null | { id: number; role: "user" | "admin" }, loading: false, error: null as unknown, openAuth: vi.fn(), setLocation: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: mocks.user, loading: mocks.loading, error: mocks.error }) }));
vi.mock("@/contexts/AuthGateContext", () => ({ useAuthGate: () => ({ openAuth: mocks.openAuth, requireAuth: vi.fn(), isAuthenticated: Boolean(mocks.user) }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/account", mocks.setLocation] }));

import RouteAccessGuard from "../client/src/components/RouteAccessGuard";

describe("RouteAccessGuard", () => {
  afterEach(() => { cleanup(); mocks.user = null; mocks.loading = false; mocks.error = null; mocks.openAuth.mockReset(); mocks.setLocation.mockReset(); });

  it("mở Auth Gate và không render dữ liệu nhạy cảm khi guest truy cập route protected", async () => {
    render(<RouteAccessGuard access="authenticated"><p>Dữ liệu riêng tư</p></RouteAccessGuard>);
    await waitFor(() => expect(mocks.openAuth).toHaveBeenCalledWith({ mode: "login", returnTo: "/account" }));
    expect(screen.queryByText("Dữ liệu riêng tư")).toBeNull();
    expect(screen.getByText("Đăng nhập để tiếp tục")).toBeTruthy();
  });

  it("chặn user thường ở route admin", () => {
    mocks.user = { id: 12, role: "user" };
    render(<RouteAccessGuard access="admin"><p>Admin nhạy cảm</p></RouteAccessGuard>);
    expect(screen.queryByText("Admin nhạy cảm")).toBeNull();
    expect(screen.getByText("Không có quyền truy cập")).toBeTruthy();
  });

  it("cho phép admin render nội dung protected", () => {
    mocks.user = { id: 1, role: "admin" };
    render(<RouteAccessGuard access="admin"><p>Admin nhạy cảm</p></RouteAccessGuard>);
    expect(screen.getByText("Admin nhạy cảm")).toBeTruthy();
  });
});
