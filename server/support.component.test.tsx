// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/SiteHeader", () => ({ default: () => <header>Header</header> }));
const submit = vi.fn();
vi.mock("@/lib/trpc", () => ({ trpc: { site: { legalSupport: { useQuery: () => ({ data: { supportTitle: "Trung tâm hỗ trợ Dshare", supportDescription: "Nhận trợ giúp nhanh từ đội ngũ Dshare.", supportEmail: "support@dshare.vn", supportPhone: "0123 456 789", supportHours: "Thứ Hai – Thứ Sáu", supportUpdatedAt: new Date("2026-08-23") } }) }, supportFaqs: { useQuery: () => ({ data: [{ id: 1, question: "Làm sao để tạo Quiz?", answer: "Bắt đầu từ nút Tạo Quiz." }], isLoading: false }) }, submitContactMessage: { useMutation: () => ({ mutate: submit, isPending: false }) } } } }));

import Support from "../client/src/pages/Support";

describe("Support page", () => {
  afterEach(cleanup);
  it("hiển thị đầy đủ kênh liên hệ được quản trị", () => {
    render(<Support />);
    expect(screen.getByRole("heading", { name: "Trung tâm hỗ trợ Dshare" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "support@dshare.vn" }).getAttribute("href")).toBe("mailto:support@dshare.vn");
    expect(screen.getByRole("link", { name: "0123 456 789" }).getAttribute("href")).toBe("tel:0123456789");
    expect(screen.getByText("Làm sao để tạo Quiz?")).toBeTruthy();
  });

  it("gửi biểu mẫu liên hệ qua tRPC", () => {
    render(<Support />);
    fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn An" } });
    fireEvent.change(screen.getByLabelText("Email liên hệ"), { target: { value: "an@example.com" } });
    fireEvent.change(screen.getByLabelText("Nội dung yêu cầu hỗ trợ"), { target: { value: "Tôi cần hỗ trợ về việc tạo bộ câu hỏi mới." } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu hỗ trợ" }));
    expect(submit).toHaveBeenCalledWith({ name: "Nguyễn An", email: "an@example.com", subject: null, message: "Tôi cần hỗ trợ về việc tạo bộ câu hỏi mới." });
  });
});
