// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  content: { data: { categories: [], subjects: [{ id: 1, title: "Tin học" }], lessons: [{ id: 7, subjectId: 1, title: "Excel cơ bản" }] }, isLoading: false },
  create: { mutate: vi.fn(), isPending: false },
  chat: { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/components/AccountLayout", () => ({ default: ({ children, hideHeader }: { children: React.ReactNode; hideHeader?: boolean }) => <div data-testid="account-layout" data-hide-header={hideHeader ? "true" : "false"}>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { creator: { contentOptions: { useQuery: () => mocks.content }, getQuizForEdit: { useQuery: () => ({ data: undefined, isLoading: false }) }, getDraft: { useQuery: () => ({ data: undefined, isLoading: false }) }, listDraftVersions: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) }, saveDraft: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, restoreDraftVersion: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, deleteDraft: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, createQuiz: { useMutation: () => mocks.create }, updateQuiz: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, studioAiChat: { useMutation: () => mocks.chat }, generateQuestionsFromDocument: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }, importManualQuizFile: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }, generateQuestionsFromRemoteSource: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } }, useUtils: () => ({ creator: { myQuizzes: { invalidate: vi.fn() } } }) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import UserQuizCreator, { ShareQuizDialog } from "../client/src/pages/UserQuizCreator";

describe("Quiz Creator theo đặc tả", () => {
  afterEach(cleanup);

  it("hiển thị header tự lưu và editor ba vùng", () => {
    render(<UserQuizCreator />);
    expect(screen.getByTestId("spec-creator-header")).toBeTruthy();
    expect(screen.getByTestId("autosave-indicator")).toBeTruthy();
    expect(screen.getByText("Danh sách câu hỏi")).toBeTruthy();
    expect(screen.getByText("Nhập chủ đề")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mở Chat AI" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lịch sử bản nháp" })).toBeTruthy();
  });

  it("mở hộp lịch sử bản nháp để khôi phục phiên bản", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Lịch sử bản nháp" }));
    expect(screen.getByText("Chưa có phiên bản nháp")).toBeTruthy();
  });

  it("hiển thị và mở liên kết chia sẻ nhanh Facebook, Zalo", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ShareQuizDialog share={{ title: "Quiz Tin học", url: "https://example.test/exam/tin-hoc", qr: "" }} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Chia sẻ qua Email" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Chia sẻ lên Facebook" }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining("facebook.com/sharer"), "_blank", "noopener,noreferrer");
    await user.click(screen.getByRole("button", { name: "Chia sẻ qua Zalo" }));
    expect(open).toHaveBeenLastCalledWith(expect.stringContaining("zalo.me/share"), "_blank", "noopener,noreferrer");
    open.mockRestore();
  });

  it("chuyển sang tab cài đặt với các nhóm theo đặc tả", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Cài đặt" }));
    expect(screen.getByText("Thông tin cơ bản")).toBeTruthy();
    expect(screen.getByText("Cấu hình làm bài")).toBeTruthy();
    expect(screen.getByText("Bảo mật & nâng cao")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Tiêu đề Quiz trong studio" })).toBeTruthy();
  });

  it("mở split-screen chat AI từ toolbar phải và thu gọn về Editor", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Mở Chat AI" }));
    expect(screen.getByText("Tạo câu hỏi cùng AI")).toBeTruthy();
    expect(screen.getByTestId("quiz-ai-primary")).toBeTruthy();
    expect(screen.getByTestId("spec-quiz-workspace").className).toContain("xl:grid-cols-[950px_450px]");
    expect(screen.getByText("Câu mới từ AI sẽ xuất hiện tại đây.")).toBeTruthy();
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-header")).toBe("true");
    await user.click(screen.getByRole("button", { name: /Thu gọn/ }));
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-header")).toBe("false");
  });

  it("gửi yêu cầu bằng Enter, có nút đính kèm và ẩn nguồn AI trong chế độ chat", async () => {
    const user = userEvent.setup();
    mocks.chat.mutate.mockClear();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Mở Chat AI" }));
    expect(screen.getByRole("button", { name: "Đính kèm tệp vào chat AI" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Nhập chủ đề" })).toBeNull();
    const input = screen.getByPlaceholderText("Hỏi AI hoặc mô tả Quiz bạn muốn tạo…");
    await user.type(input, "Tạo câu hỏi Toán lớp 4");
    await user.keyboard("{Enter}");
    expect(mocks.chat.mutate).toHaveBeenCalledWith(expect.objectContaining({ messages: expect.arrayContaining([expect.objectContaining({ content: "Tạo câu hỏi Toán lớp 4" })]) }));
  });

  it("cho phép nhân bản và đổi loại câu hỏi ngay trong tab Câu hỏi", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Mở Chat AI" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Loại câu hỏi trong tab 1" }), "true_false");
    expect((screen.getByRole("combobox", { name: "Loại câu hỏi trong tab 1" }) as HTMLSelectElement).value).toBe("true_false");
    await user.click(screen.getByRole("button", { name: "Nhân bản câu hỏi 1 trong tab" }));
    expect(screen.getByText((_, element) => element?.textContent === "Tổng 2 câu hỏi")).toBeTruthy();
  });

  it("cho phép chỉnh sửa trực tiếp nội dung và đáp án trong tab Câu hỏi có vùng cuộn", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Mở Chat AI" }));
    const questionPanel = screen.getByLabelText("Tiêu đề Quiz trong tab Câu hỏi").closest("section");
    expect(questionPanel?.className).toContain("xl:h-full");
    const prompt = screen.getByRole("textbox", { name: "Nội dung câu hỏi 1 trong tab" }) as HTMLTextAreaElement;
    await user.clear(prompt);
    await user.type(prompt, "Câu hỏi đã chỉnh sửa");
    expect(prompt.value).toBe("Câu hỏi đã chỉnh sửa");
    const answer = screen.getByRole("textbox", { name: "Đáp án 1 câu 1 trong tab" }) as HTMLInputElement;
    await user.clear(answer);
    await user.type(answer, "Đáp án mới");
    expect(answer.value).toBe("Đáp án mới");
  });

  it("hiển thị tiến độ và đồng bộ tiêu đề Quiz giữa tab Câu hỏi với thanh Studio", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Mở Chat AI" }));
    expect(screen.getByText((_, element) => element?.textContent === "Tổng 1 câu hỏi")).toBeTruthy();
    expect(screen.getByText("0/1 hoàn thành")).toBeTruthy();
    const titleInQuestionTab = screen.getByRole("textbox", { name: "Tiêu đề Quiz trong tab Câu hỏi" }) as HTMLInputElement;
    await user.clear(titleInQuestionTab);
    await user.type(titleInQuestionTab, "Ôn tập Toán lớp 4");
    await user.click(screen.getByRole("button", { name: /Thu gọn/ }));
    expect((screen.getByRole("textbox", { name: "Tiêu đề Quiz ở thanh menu Studio" }) as HTMLInputElement).value).toBe("Ôn tập Toán lớp 4");
  });

  it("bổ sung thẻ câu hỏi thủ công từ thanh cuối Editor", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "+ Đúng / Sai" }));
    expect(screen.getAllByText(/#2/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: "⇄ Đúng / Sai" }).length).toBeGreaterThan(0);
  });
});
