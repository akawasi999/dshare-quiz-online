// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mine: { data: [], isLoading: false, error: null, refetch: vi.fn() },
  quota: { data: { tier: "basic", limits: { quizzesPerMonth: 2 }, usage: { quizzes: 0 } }, isLoading: false, error: null, refetch: vi.fn() },
  content: { data: { categories: [], subjects: [{ id: 1, title: "Tin học" }], lessons: [{ id: 7, subjectId: 1, title: "Excel cơ bản" }] }, isLoading: false, error: null },
  sourceHistory: { data: [], isLoading: false, error: null },
  branding: { data: { questionTabContentWidth: 960, settingsTabContentWidth: 840 }, isLoading: false, error: null },
  create: { mutate: vi.fn(), isPending: false },
  exportPdf: vi.fn(() => Promise.resolve()),
  exportWord: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/components/AccountLayout", () => ({ default: ({ children, hideSidebar, hideHeader }: { children: React.ReactNode; hideSidebar?: boolean; hideHeader?: boolean }) => <div data-testid="account-layout" data-hide-sidebar={hideSidebar ? "true" : "false"} data-hide-header={hideHeader ? "true" : "false"}>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { creator: { contentOptions: { useQuery: () => mocks.content }, myQuizzes: { useQuery: () => mocks.mine }, sourceHistory: { useQuery: () => mocks.sourceHistory }, getQuizForEdit: { useQuery: () => ({ data: undefined, isLoading: false }) }, uploadCover: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, createQuiz: { useMutation: () => mocks.create }, updateQuiz: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, generateQuestionAI: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, generateQuestionsFromDocument: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, generateQuestionsFromRemoteSource: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, importManualQuizFile: { useMutation: () => ({ isPending: false, data: undefined, mutate: vi.fn(), mutateAsync: vi.fn() }) }, studioAiChat: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, enhanceQuestionAI: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } }, learner: { quota: { useQuery: () => mocks.quota } }, branding: { get: { useQuery: () => mocks.branding } }, useUtils: () => ({ creator: { myQuizzes: { invalidate: vi.fn() }, sourceHistory: { invalidate: vi.fn() } } }) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/quizDocumentExport", () => ({ exportQuizToPdf: mocks.exportPdf, exportQuizToWord: mocks.exportWord }));

import UserQuizCreator from "../client/src/pages/UserQuizCreator";

describe("UserQuizCreator thiết kế lại", () => {
  afterEach(cleanup);

  it("mở thẳng studio Quiz mà không yêu cầu chọn phương thức hoặc nhập ID", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    expect(screen.getByText("Tạo nhanh với")).toBeTruthy();
    expect(screen.getByTestId("live-question-preview").className).toContain("live-question-preview--headerless");
    expect(screen.queryByRole("textbox", { name: "Tiêu đề Quiz trong studio" })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Cài đặt" }));
    expect(screen.getByRole("textbox", { name: "Tiêu đề Quiz trong studio" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Mô tả Quiz trong studio" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Câu hỏi" }));
    expect(screen.queryByText("Mô tả ngắn")).toBeNull();
    expect(screen.queryByText("Thông tin Quiz")).toBeNull();
    expect(screen.getByText("Nhập phụ đề")).toBeTruthy();
    expect(screen.getByText("Nhập nội dung mô tả bài học")).toBeTruthy();
    expect(screen.getByText("Excel, Word, PDF")).toBeTruthy();
    expect(screen.getByText("Video dưới 2 giờ có phụ đề")).toBeTruthy();
    expect(screen.getByText("Địa chỉ trang web có nội dung")).toBeTruthy();
    expect(screen.queryByText("ID Bài học")).toBeNull();
  });

  it("mở trình soạn thủ công với metadata, bảo mật và sáu loại câu hỏi", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    expect(screen.queryByText("Thông tin Quiz")).toBeNull();
    expect(screen.getByRole("tab", { name: "Cài đặt" })).toBeTruthy();
    expect(screen.getByText("Tạo nhanh với")).toBeTruthy();
    expect(screen.queryByText("Nhập câu hỏi từ tệp")).toBeNull();
    expect(screen.getByRole("button", { name: "Xem như học viên" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Tải mẫu Excel" })).toBeNull();
    expect(screen.queryByText("ID Bài học")).toBeNull();
    expect(screen.getByRole("option", { name: "✎ Bài luận" })).toBeTruthy();
  });

  it("chuyển Cài đặt trong cùng khối Studio và ẩn vùng soạn Câu hỏi", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("tab", { name: "Cài đặt" }));
    expect(screen.getByText("Cài đặt Quiz")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Vui lòng nhập câu hỏi.")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Câu hỏi" }));
    expect(screen.getByPlaceholderText("Vui lòng nhập câu hỏi.")).toBeTruthy();
  });

  it("áp dụng chiều rộng nội dung theo cấu hình Style cho từng tab Studio", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    expect(screen.getByTestId("studio-content-panel").style.maxWidth).toBe("960px");
    await user.click(screen.getByRole("tab", { name: "Cài đặt" }));
    expect(screen.getByTestId("studio-content-panel").style.maxWidth).toBe("840px");
  });

  it("đồng bộ tên Quiz từ thanh Studio sang Cài đặt và chỉ mở Xuất bản khi đủ dữ liệu bắt buộc", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    const publishButton = screen.getByRole("button", { name: "Xuất bản" });
    expect(publishButton.hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Đổi tên Quiz" }));
    const headerTitle = screen.getByLabelText("Đổi tên Quiz trên thanh Studio");
    await user.type(headerTitle, "Quiz trực tiếp");
    await user.click(screen.getByRole("tab", { name: "Cài đặt" }));
    expect((screen.getByLabelText("Tiêu đề Quiz trong studio") as HTMLInputElement).value).toBe("Quiz trực tiếp");
    expect(screen.getAllByText("*").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "Câu hỏi" }));
    await user.type(screen.getByPlaceholderText("Vui lòng nhập câu hỏi."), "Câu hỏi bắt buộc để xuất bản");
    await user.type(screen.getByPlaceholderText("Tùy chọn 1"), "Đáp án đúng");
    await user.type(screen.getByPlaceholderText("Tùy chọn 2"), "Đáp án sai");
    await user.click(screen.getByRole("button", { name: "Thêm vào Quiz" }));
    expect(publishButton.hasAttribute("disabled")).toBe(false);
    mocks.create.mutate.mockClear();
    await user.click(publishButton);
    expect(screen.getByText("Nếu bạn chỉnh sửa câu hỏi, câu hỏi sẽ được làm mới. Bạn có muốn chỉnh sửa lại ngay bây giờ không?")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(mocks.create.mutate).toHaveBeenLastCalledWith(expect.objectContaining({ isPublished: true }));
  });

  it("mở khung chat AI và phần xem trước câu hỏi", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getAllByRole("button", { name: "Dùng Quiz AI" })[0]!);
    expect(screen.getByText("Tạo câu hỏi cùng AI")).toBeTruthy();
    expect(screen.getByTestId("studio-workspace").className).toContain("xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]");
    expect(screen.getByTestId("studio-workspace").className).toContain("studio-workspace--with-chat");
    expect(screen.getByTestId("studio-focused-question-list")).toBeTruthy();
    expect(screen.getByTestId("studio-toolbar").className).toContain("hidden");
    expect(screen.getByText("AI sẽ tự làm rõ yêu cầu trước khi tạo câu hỏi.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đính kèm tệp vào chat AI" })).toBeTruthy();
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-sidebar")).toBe("true");
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-header")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Thu gọn" }));
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-sidebar")).toBe("true");
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-header")).toBe("false");
    expect(screen.getByTestId("studio-toolbar").className).not.toContain("hidden");
  });

  it("mở biểu mẫu trích xuất YouTube và trang web từ các thao tác nhanh", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: /Trích xuất từ YouTube/ }));
    expect(screen.getByLabelText("URL YouTube trong chat AI")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Thu gọn" }));
    await user.click(screen.getByRole("button", { name: /Trích từ trang web/ }));
    expect(screen.getByLabelText("URL trang web trong chat AI")).toBeTruthy();
  });

  it("cho phép chỉnh sửa câu hỏi ngay trong xem trước và xuất bản nháp sang PDF/Word", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.type(screen.getByPlaceholderText("Vui lòng nhập câu hỏi."), "Thủ đô của Việt Nam là thành phố nào?");
    await user.type(screen.getByPlaceholderText("Tùy chọn 1"), "Hà Nội");
    await user.type(screen.getByPlaceholderText("Tùy chọn 2"), "Huế");
    await user.click(screen.getByRole("button", { name: "Thêm vào Quiz" }));
    const undoButton = screen.getByRole("button", { name: "Hoàn tác" });
    expect(undoButton.hasAttribute("disabled")).toBe(false);
    await user.click(undoButton);
    expect(screen.getByRole("button", { name: "Làm lại" }).hasAttribute("disabled")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Làm lại" }));

    const downloadButton = screen.getByRole("button", { name: "Tải xuống Quiz" });
    expect(downloadButton.hasAttribute("disabled")).toBe(false);
    await user.click(downloadButton);
    await user.click(screen.getByRole("menuitem", { name: "Tải PDF" }));
    await user.click(downloadButton);
    await user.click(screen.getByRole("menuitem", { name: "Tải Word" }));
    expect(mocks.exportPdf).toHaveBeenCalledTimes(1);
    expect(mocks.exportWord).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Sửa câu hỏi trong Live Preview" }));
    const promptEditor = screen.getByLabelText("Nội dung câu hỏi trong Live Preview");
    await user.clear(promptEditor);
    await user.type(promptEditor, "Thủ đô Việt Nam hiện nay là đâu?");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(screen.getAllByText("Thủ đô Việt Nam hiện nay là đâu?").length).toBeGreaterThan(0);
  });
});
