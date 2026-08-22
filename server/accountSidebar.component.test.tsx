// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Học viên" }, logout: vi.fn() }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/ho-so", vi.fn()] }));

import AccountSidebar from "../client/src/components/AccountSidebar";

describe("AccountSidebar", () => {
  afterEach(cleanup);

  it("giữ các mục học tập và không còn hiển thị AI Assistant", () => {
    render(<AccountSidebar />);
    expect(screen.getByRole("button", { name: "Bảng điều khiển" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quiz của tôi" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "AI Assistant" })).toBeNull();
  });
});
