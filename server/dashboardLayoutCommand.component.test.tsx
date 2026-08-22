// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), toggleTheme: vi.fn(), logout: vi.fn() }));

vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
vi.stubGlobal("scrollTo", vi.fn());
Element.prototype.scrollIntoView = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Admin", email: "admin@dshare.vn" }, loading: false, logout: mocks.logout }) }));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ theme: "light", toggleTheme: mocks.toggleTheme }) }));
vi.mock("@/hooks/useMobile", () => ({ useIsMobile: () => false }));
vi.mock("@/components/BrandLogo", () => ({ default: () => <span>Dshare</span> }));
vi.mock("wouter", () => ({ useLocation: () => ["/quan-tri", mocks.setLocation] }));

import DashboardLayout from "../client/src/components/DashboardLayout";

describe("DashboardLayout CPanel v2", () => {
  afterEach(cleanup);

  it("mở Command Palette bằng Ctrl+K và hiển thị các mô-đun quản trị", () => {
    render(<DashboardLayout><p>Workspace</p></DashboardLayout>);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(screen.getByPlaceholderText("Tìm dashboard, người dùng, Point, báo lỗi…")).toBeTruthy();
    expect(screen.getAllByText("Người dùng").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Live Monitoring").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Chủ đề").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Quiz System").length).toBeGreaterThan(1);
    expect(screen.queryByText("Ngân hàng câu hỏi")).toBeNull();
    expect(screen.queryByText("Tạo đề ngẫu nhiên")).toBeNull();
    expect(screen.queryByText("Import / Export")).toBeNull();
  });

  it("cung cấp notification center và lối vào hồ sơ từ shell quản trị", () => {
    render(<DashboardLayout><p>Workspace</p></DashboardLayout>);

    const notificationTrigger = screen.getByRole("button", { name: "Mở thông báo vận hành" });
    fireEvent.pointerDown(notificationTrigger, { button: 0, ctrlKey: false });
    fireEvent.click(notificationTrigger);
    expect(screen.getByText("Thông báo vận hành")).toBeTruthy();
    expect(screen.getByText("Mở Activity Logs")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    const [accountTrigger] = screen.getAllByRole("button", { name: "Mở menu tài khoản quản trị" });
    fireEvent.pointerDown(accountTrigger, { button: 0, ctrlKey: false });
    fireEvent.click(accountTrigger);
    expect(screen.getByText("Hồ sơ tài khoản")).toBeTruthy();
  });
});
