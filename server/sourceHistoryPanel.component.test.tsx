// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SourceHistoryPanel } from "../client/src/components/SourceHistoryPanel";

describe("SourceHistoryPanel", () => {
  it("hiển thị nguồn URL gần đây và gửi lại cấu hình khi tái tạo", () => {
    const onReuse = vi.fn();
    const item = { id: 1, sourceUrl: "https://www.youtube.com/watch?v=abc123", sourceName: "Video hệ Mặt Trời", sourceType: "youtube" as const, sourceCharacterCount: 920, lastQuestionCount: 6, lastDifficulty: "medium" as const, useCount: 2, lastUsedAt: new Date("2026-08-20T00:00:00.000Z") };
    render(<SourceHistoryPanel items={[item]} busy={false} onReuse={onReuse} />);
    expect(screen.getByText("Nguồn URL gần đây")).toBeTruthy();
    expect(screen.getByText("Video hệ Mặt Trời")).toBeTruthy();
    expect(screen.getByText(/6 câu · medium · dùng 2 lần/)).toBeTruthy();
    (screen.getByRole("button", { name: "Tái tạo" }) as HTMLButtonElement).click();
    expect(onReuse).toHaveBeenCalledWith(item);
  });
});
