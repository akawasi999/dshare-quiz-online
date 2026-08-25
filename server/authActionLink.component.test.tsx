// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: false, openAuth: vi.fn() }));

vi.mock("@/contexts/AuthGateContext", () => ({
  useAuthGate: () => ({ isAuthenticated: mocks.authenticated, openAuth: mocks.openAuth }),
}));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

import AuthActionLink from "../client/src/components/AuthActionLink";

describe("AuthActionLink", () => {
  afterEach(() => { cleanup(); mocks.authenticated = false; mocks.openAuth.mockReset(); });

  it("yêu cầu đăng nhập và lưu deep-link khi khách mở Quiz", async () => {
    const user = userEvent.setup();
    render(<AuthActionLink href="/quiz/42">Làm bài</AuthActionLink>);

    await user.click(screen.getByRole("link", { name: "Làm bài" }));
    expect(mocks.openAuth).toHaveBeenCalledWith({ mode: "login", returnTo: "/quiz/42" });
  });

  it("giữ link và thuộc tính giao diện khi người dùng đã đăng nhập", () => {
    mocks.authenticated = true;
    render(<AuthActionLink href="/quiz/42" className="quiz-action">Làm bài</AuthActionLink>);

    expect(screen.getByRole("link", { name: "Làm bài" }).getAttribute("href")).toBe("/quiz/42");
    expect(screen.getByRole("link", { name: "Làm bài" }).className).toContain("quiz-action");
  });
});
