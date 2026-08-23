// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Học viên" }, logout: vi.fn() }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/ho-so", vi.fn()] }));

import AccountSidebar from "../client/src/components/AccountSidebar";

describe("AccountSidebar", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("giữ menu tối giản theo nhóm và không còn hiển thị các trang đã nằm trong Tổng quan", () => {
    render(<AccountSidebar />);
    expect(screen.getByRole("button", { name: "Tổng quan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quiz của tôi" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "AI Assistant" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Nhiệm vụ" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Thành tích" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Bảng xếp hạng" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Mời bạn bè" })).toBeNull();
  });

  it("thu gọn được bằng điều khiển truy cập được nhưng vẫn giữ toàn bộ menu", async () => {
    const user = userEvent.setup();
    const { container } = render(<AccountSidebar />);

    await user.click(screen.getByRole("button", { name: "Thu gọn thanh điều hướng" }));

    expect(container.querySelector("aside")?.className).toContain("w-[76px]");
    expect(localStorage.getItem("dshare-account-sidebar-collapsed")).toBe("true");
    expect(screen.getByRole("button", { name: "Mở rộng thanh điều hướng" })).toBeTruthy();
    expect(screen.getByLabelText("Thông tin cá nhân")).toBeTruthy();
    expect(screen.getByLabelText("Đăng xuất")).toBeTruthy();
  });
});
