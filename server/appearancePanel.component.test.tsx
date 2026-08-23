// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const refetch = vi.fn();
const mutateAsync = vi.fn().mockResolvedValue({ success: true });
const brand = { primaryColor: "#565BE5", accentColor: "#3762D2", successColor: "#00845A", attentionColor: "#DC2626", pageColor: "#F6F8FC", surfaceColor: "#FFFFFF", questionTabContentWidth: 1440, settingsTabContentWidth: 1040, styleConfig: null };

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ branding: { get: { invalidate: vi.fn() } } }),
    branding: { get: { useQuery: () => ({ data: brand, refetch }) }, saveAppearance: { useMutation: () => ({ mutateAsync, isPending: false }) } },
    admin: { seoSettings: { useQuery: () => ({ data: { googleAnalyticsMeasurementId: null, googleSearchConsoleVerification: null, defaultQuizCoverUrl: null }, refetch }) }, saveSeoSettings: { useMutation: () => ({ mutateAsync, isPending: false }) }, uploadAppearanceAsset: { useMutation: () => ({ mutateAsync, isPending: false }) } },
  },
}));

import BrandSettingsPanel from "../client/src/components/BrandSettingsPanel";

describe("BrandSettingsPanel", () => {
  afterEach(() => cleanup());

  it("hiển thị đầy đủ các nhóm Appearance và mục mở rộng Quiz Studio/Ảnh bìa", () => {
    render(<BrandSettingsPanel />);
    expect(screen.getByRole("navigation", { name: "Danh mục Appearance" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Basic Colors" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Quiz Studio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ảnh bìa Quiz" })).toBeTruthy();
    expect(screen.getByLabelText("Mã màu Primary Color").getAttribute("value")).toBe("#565BE5");
    fireEvent.click(screen.getByRole("button", { name: "Quiz Studio" }));
    expect(screen.getByText("Tab Câu hỏi")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ảnh bìa Quiz" }));
    expect(screen.getByText("Ảnh bìa Quiz mặc định")).toBeTruthy();
  });

  it("mô phỏng toàn trang công khai và đổi thứ tự Footer Navigation bằng kéo-thả", () => {
    render(<BrandSettingsPanel />);
    expect(screen.getAllByText("Bộ đề nổi bật").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Footer" }));
    const first = screen.getByLabelText("Tên footer link 1");
    const second = screen.getByLabelText("Tên footer link 2");
    fireEvent.dragStart(first.closest("[draggable=true]")!);
    fireEvent.dragOver(second.closest("[draggable=true]")!);
    fireEvent.drop(second.closest("[draggable=true]")!);
    expect(screen.getByLabelText("Tên footer link 1").getAttribute("value")).toBe("Bảo mật");
    expect(screen.getByLabelText("Kéo thả Điều khoản")).toBeTruthy();
  });
});
