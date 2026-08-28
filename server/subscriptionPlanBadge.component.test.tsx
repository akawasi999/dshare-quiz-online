// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsernameWithPlan } from "../client/src/components/SubscriptionPlanBadge";

describe("UsernameWithPlan", () => {
  it("gắn tag gói đúng cạnh tên của chính tài khoản", () => {
    render(<UsernameWithPlan name="Nguyễn Minh" tier="pro" />);
    expect(screen.getByText("Nguyễn Minh")).toBeTruthy();
    expect(screen.getByLabelText("Gói đăng ký Pro")).toBeTruthy();
  });

  it("chuẩn hóa tier không hợp lệ về Basic thay vì phỏng đoán gói khác", () => {
    render(<UsernameWithPlan name="Nguyễn Minh" tier="unknown" />);
    expect(screen.getByLabelText("Gói đăng ký Basic")).toBeTruthy();
  });
});
