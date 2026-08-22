// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "../client/src/contexts/ThemeContext";

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return <button type="button" onClick={toggleTheme}>Chế độ {theme}</button>;
}

describe("Dark Mode", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    history.replaceState({}, "", "/");
  });

  afterEach(cleanup);

  it("đổi root sang dark mode và lưu lựa chọn theme", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="light" switchable><ThemeProbe /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Chế độ light" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
