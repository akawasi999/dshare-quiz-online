// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  content: { data: { categories: [], subjects: [{ id: 1, title: "Tin học" }], lessons: [{ id: 7, subjectId: 1, title: "Excel cơ bản" }], topics: [{ id: 24, name: "Tin học văn phòng", parentId: null, depth: 0, status: "active" }, { id: 25, name: "Excel", parentId: 24, depth: 1, status: "active" }, { id: 26, name: "Hàm tính", parentId: 25, depth: 2, status: "active" }, { id: 27, name: "Chủ đề một cấp", parentId: null, depth: 0, status: "active" }, { id: 28, name: "Chủ đề hai cấp", parentId: null, depth: 0, status: "active" }, { id: 29, name: "Nhánh cuối", parentId: 28, depth: 1, status: "active" }] }, isLoading: false },
  create: { mutate: vi.fn(), isPending: false },
  chat: { mutate: vi.fn(), isPending: false, onSuccess: null as null | ((result: any) => void) },
  pinVersion: vi.fn(),
  versions: { data: [] as any[], isLoading: false, refetch: vi.fn() },
  analytics: { data: { summary: { completedAttempts: 8, averageScore: 75, passRate: 63, latestCompletedAt: new Date("2026-08-21T00:00:00Z") }, questions: [{ questionId: 1, prompt: "Câu hỏi phân tích", points: 1, answerCount: 8, correctCount: 5, correctRate: 63 }] }, isLoading: false, isError: false, refetch: vi.fn() },
}));

vi.mock("@/components/AccountLayout", () => ({ default: ({ children, hideHeader, hideFooter, staticHeader, compactViewport }: { children: React.ReactNode; hideHeader?: boolean; hideFooter?: boolean; staticHeader?: boolean; compactViewport?: boolean }) => <div data-testid="account-layout" data-hide-header={hideHeader ? "true" : "false"} data-hide-footer={hideFooter ? "true" : "false"} data-static-header={staticHeader ? "true" : "false"} data-compact-viewport={compactViewport ? "true" : "false"}>{children}</div> }));
vi.mock("@/components/PermissionGuard", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { creator: { contentOptions: { useQuery: () => mocks.content }, getQuizForEdit: { useQuery: () => ({ data: undefined, isLoading: false }) }, quizAnalytics: { useQuery: () => mocks.analytics }, getDraft: { useQuery: () => ({ data: undefined, isLoading: false }) }, listDraftVersions: { useQuery: () => mocks.versions }, saveDraft: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, restoreDraftVersion: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, toggleDraftVersionPin: { useMutation: () => ({ mutate: mocks.pinVersion, isPending: false }) }, deleteDraft: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, createQuiz: { useMutation: () => mocks.create }, updateQuiz: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, uploadCover: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, uploadQuestionImage: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, studioAiChat: { useMutation: (options: { onSuccess?: (result: any) => void }) => { mocks.chat.onSuccess = options.onSuccess ?? null; return mocks.chat; } }, generateQuestionsFromDocument: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }, importManualQuizFile: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) }, generateQuestionsFromRemoteSource: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } }, useUtils: () => ({ creator: { myQuizzes: { invalidate: vi.fn() } } }) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import UserQuizCreator, { ShareQuizDialog } from "../client/src/pages/UserQuizCreator";

describe("Quiz Creator theo đặc tả", () => {
  afterEach(() => { cleanup(); mocks.versions.data = []; mocks.pinVersion.mockReset(); mocks.analytics.data = { summary: { completedAttempts: 8, averageScore: 75, passRate: 63, latestCompletedAt: new Date("2026-08-21T00:00:00Z") }, questions: [{ questionId: 1, prompt: "Câu hỏi phân tích", points: 1, answerCount: 8, correctCount: 5, correctRate: 63 }] }; window.history.replaceState({}, "", "/build"); });

  it("hiển thị App Shell ba cột và ẩn chrome Landing Page", () => {
    render(<UserQuizCreator />);
    expect(screen.getByTestId("spec-creator-header").className).toContain("editor-header");
    expect(screen.getByTestId("spec-quiz-workspace").className).toContain("editor-body");
    expect(screen.getByTestId("account-layout").getAttribute("data-compact-viewport")).toBe("true");
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-header")).toBe("true");
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-footer")).toBe("true");
    expect(screen.getByText("Danh sách câu hỏi")).toBeTruthy();
    expect(screen.getByText("Nhập chủ đề")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lịch sử bản nháp" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mở điều hướng Studio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tải xuống" }).getAttribute("title")).toBe("Tải xuống");
    expect(screen.queryByRole("button", { name: "Người làm bài" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Đáp án" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tác giả Quiz" })).toBeNull();
    expect(screen.getByRole("button", { name: "Xem trước Sandbox" }).textContent).toBe("");
    expect(screen.getByTestId("settings-topic-required")).toBeTruthy();
    expect(screen.getByTestId("manual-question-bar").className).toContain("mb-[50px]");
    const preview = screen.getByRole("button", { name: "Xem trước Sandbox" });
    const publish = screen.getByRole("button", { name: /Xuất bản/ });
    expect(preview.compareDocumentPosition(publish) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("question-navigator").className).toContain("editor-question-navigator");
    expect(screen.getByTestId("question-navigator-scroll").className).toContain("flex-col");
    expect(screen.queryByTestId("floating-toolbar")).toBeNull();
    expect(screen.queryByTestId("quiz-ai-point-footer")).toBeNull();
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
    expect(screen.getByRole("option", { name: "Tin học văn phòng" })).toBeTruthy();
    expect(screen.queryByText("Bản đồ Game")).toBeNull();
    await user.selectOptions(screen.getByRole("combobox", { name: "Chủ đề" }), "24");
    expect(screen.queryByTestId("settings-topic-required")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Chủ đề con cấp 2" })).toBeTruthy();
    await user.selectOptions(screen.getByRole("combobox", { name: "Chủ đề con cấp 2" }), "25");
    expect(screen.getByRole("combobox", { name: "Chủ đề con cấp 3" })).toBeTruthy();
    expect(screen.queryByText("Chủ đề cấp 2")).toBeNull();
    expect(screen.queryByText("Chủ đề cấp 3")).toBeNull();
    await user.selectOptions(screen.getByRole("combobox", { name: "Chủ đề" }), "27");
    expect(screen.queryByRole("combobox", { name: "Chủ đề con cấp 2" })).toBeNull();
    await user.selectOptions(screen.getByRole("combobox", { name: "Chủ đề" }), "28");
    expect(screen.getByRole("combobox", { name: "Chủ đề con cấp 2" })).toBeTruthy();
  });

  it("mở Panel AI từ thanh AI nhanh và giữ nguyên Sidebar cùng Editor", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Nhập chủ đề" }));
    expect(screen.getByText("Tạo câu hỏi cùng AI")).toBeTruthy();
    expect(screen.getByTestId("quiz-ai-primary")).toBeTruthy();
    expect(screen.getByLabelText("AI Assistant")).toBeTruthy();
    const resizeHandle = screen.getByRole("separator", { name: "Điều chỉnh độ rộng khung chat AI" });
    expect(resizeHandle.getAttribute("aria-valuenow")).toBe("460");
    fireEvent.keyDown(resizeHandle, { key: "ArrowLeft" });
    expect(resizeHandle.getAttribute("aria-valuenow")).toBe("480");
    expect(screen.getByTestId("collapsed-question-navigator")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mở danh sách câu hỏi" })).toBeTruthy();
    expect(screen.queryByLabelText("Danh sách câu hỏi")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Mở danh sách câu hỏi" }));
    expect(screen.getByLabelText("Danh sách câu hỏi")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thu gọn danh sách câu hỏi" })).toBeTruthy();
    expect(screen.getByTestId("question-navigator")).toBeTruthy();
    expect(screen.getByTestId("spec-creator-header")).toBeTruthy();
    expect(screen.queryByTestId("quiz-ai-point-footer")).toBeNull();
    expect(screen.queryByText("AI nâng cao")).toBeNull();
    expect(screen.queryByLabelText("Liên kết pháp lý")).toBeNull();
    expect(screen.getByRole("button", { name: "Xem trước Sandbox" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Xuất bản/ })).toBeTruthy();
    expect(screen.getByTestId("account-layout").getAttribute("data-hide-header")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Thu gọn chat" }));
    expect(screen.queryByLabelText("AI Assistant")).toBeNull();
  });

  it("gửi yêu cầu bằng Enter, có nút đính kèm và giữ thanh AI nhanh trong chế độ chat", async () => {
    const user = userEvent.setup();
    mocks.chat.mutate.mockClear();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Nhập chủ đề" }));
    expect(screen.getByRole("button", { name: "Đính kèm tệp vào chat AI" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nhập chủ đề" })).toBeTruthy();
    const input = screen.getByPlaceholderText("Hãy yêu cầu AI thêm, sửa hoặc xoá câu hỏi…");
    await user.type(input, "Tạo câu hỏi Toán lớp 4");
    await user.keyboard("{Enter}");
    expect(mocks.chat.mutate).toHaveBeenCalledWith(expect.objectContaining({ messages: expect.arrayContaining([expect.objectContaining({ content: "Tạo câu hỏi Toán lớp 4" })]), requestedQuestionCount: null, context: expect.objectContaining({ currentQuestionCount: 1, questions: [expect.objectContaining({ id: expect.any(String), points: 1, imageUrl: "" })] }) }));
  });

  it("buộc xác nhận số lượng trước khi AI tạo và áp dụng lệnh tạo/sửa vào bản nháp", async () => {
    const user = userEvent.setup();
    mocks.chat.mutate.mockClear();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Nhập chủ đề" }));
    await user.type(screen.getByPlaceholderText("Hãy yêu cầu AI thêm, sửa hoặc xoá câu hỏi…"), "Tạo câu hỏi về phân số");
    await user.keyboard("{Enter}");
    const originalId = mocks.chat.mutate.mock.calls[0]?.[0]?.context?.questions?.[0]?.id;
    await act(async () => { mocks.chat.onSuccess?.({ action: "clarify_count", reply: "Bạn muốn tạo tối đa bao nhiêu câu hỏi?", detected: { topic: "Phân số", type: "single", difficulty: "easy", count: 3 }, suggestedPrompts: [], operations: [] }); });
    const countInput = screen.getByRole("spinbutton", { name: "Số câu hỏi tối đa AI được tạo" });
    expect((countInput as HTMLInputElement).value).toBe("3");
    fireEvent.change(countInput, { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Xác nhận tạo" }));
    expect(mocks.chat.mutate).toHaveBeenLastCalledWith(expect.objectContaining({ requestedQuestionCount: 2 }));
    await act(async () => { mocks.chat.onSuccess?.({ action: "apply", reply: "Đã cập nhật bản nháp.", detected: { topic: "Phân số", type: "single", difficulty: "hard", count: 1 }, suggestedPrompts: [], operations: [{ kind: "update", targetId: originalId, question: { type: "single", difficulty: "hard", points: 5, prompt: "Phân số nào tương đương một phần hai?", explanation: "2/4 rút gọn bằng 1/2.", imageUrl: "", options: [{ body: "2/4", isCorrect: true }, { body: "1/4", isCorrect: false }], answerConfig: {} } }, { kind: "create", targetId: null, question: { type: "multiple", difficulty: "medium", points: 3, prompt: "Chọn các phân số bằng một nửa.", explanation: "2/4 và 3/6 đều bằng 1/2.", imageUrl: "", options: [{ body: "2/4", isCorrect: true }, { body: "3/6", isCorrect: true }, { body: "1/3", isCorrect: false }], answerConfig: {} } }] }); });
    expect(screen.getByDisplayValue("Phân số nào tương đương một phần hai?")).toBeTruthy();
    expect(screen.getAllByText(/#2/).length).toBeGreaterThan(0);
  });

  it("cho phép nhân bản và đổi loại câu hỏi ngay trong tab Câu hỏi", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Loại câu hỏi 1" }), "true_false");
    expect((screen.getByRole("combobox", { name: "Loại câu hỏi 1" }) as HTMLSelectElement).value).toBe("true_false");
    await user.click(screen.getByRole("button", { name: "Sao chép câu hỏi 1" }));
    expect(screen.getAllByText(/#2/).length).toBeGreaterThan(0);
  });

  it("cho phép chỉnh sửa trực tiếp nội dung và đáp án trong Editor trung tâm", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    const prompt = screen.getByPlaceholderText("Nhập nội dung câu hỏi") as HTMLTextAreaElement;
    await user.clear(prompt);
    await user.type(prompt, "Câu hỏi đã chỉnh sửa");
    expect(prompt.value).toBe("Câu hỏi đã chỉnh sửa");
    const answer = screen.getByPlaceholderText("Tùy chọn 1") as HTMLInputElement;
    await user.clear(answer);
    await user.type(answer, "Đáp án mới");
    expect(answer.value).toBe("Đáp án mới");
    expect(screen.getByLabelText("Thêm gợi ý lời giải")).toBeTruthy();
    expect(screen.queryByText("AI hỗ trợ")).toBeNull();
    expect(screen.queryByRole("button", { name: "Giải thích" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Viết lại" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Chuẩn LaTeX" })).toBeNull();
    expect(screen.queryByText("Tùy chọn trả lời")).toBeNull();
  });

  it("hiển thị điều khiển sắp xếp và không còn năm dạng câu hỏi đã gỡ", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Loại câu hỏi 1" }), "ordering");
    expect(screen.getByRole("button", { name: "+ Thêm bước" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Audio/ })).toBeNull();
    expect(screen.queryByRole("option", { name: /Video/ })).toBeNull();
    expect(screen.queryByRole("option", { name: /Hotspot/ })).toBeNull();
    expect(screen.queryByRole("option", { name: /Trả lời ngắn AI/ })).toBeNull();
    expect(screen.queryByRole("option", { name: /Tự luận AI/ })).toBeNull();
  });

  it("đồng bộ tiêu đề Quiz trực tiếp trên header Studio", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    const titleField = screen.getByRole("textbox", { name: "Tiêu đề Quiz ở thanh menu Studio" }) as HTMLInputElement;
    await user.clear(titleField);
    await user.type(titleField, "Ôn tập Toán lớp 4");
    expect(titleField.value).toBe("Ôn tập Toán lớp 4");
  });

  it("bổ sung thẻ câu hỏi thủ công từ thanh cuối Editor", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "+ Đúng / Sai" }));
    expect(screen.getAllByText(/#2/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("option", { name: "⇄ Đúng / Sai" }).length).toBeGreaterThan(0);
  });

  it("cho phép kéo-thả để đổi thứ tự câu hỏi ngay trên Sidebar", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "+ Đúng / Sai" }));
    const sidebar = screen.getByTestId("question-navigator-scroll");
    const cardsBefore = sidebar.querySelectorAll("button");
    fireEvent.dragStart(cardsBefore[0]!);
    fireEvent.dragOver(cardsBefore[1]!);
    fireEvent.drop(cardsBefore[1]!);
    const cardsAfter = sidebar.querySelectorAll("button");
    expect(cardsAfter[0]!.textContent).toContain("Đúng / Sai");
  });

  it("cuộn tới card tương ứng khi chọn câu hỏi trong Sidebar", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "+ Đúng / Sai" }));
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-question-id]"));
    const scrollIntoView = vi.fn();
    Object.defineProperty(cards[1]!, "scrollIntoView", { value: scrollIntoView });
    await user.click(screen.getByTestId("question-navigator-scroll").querySelectorAll("button")[1]!);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("tạo được câu nhận định Có/Không với bảng nhiều hàng", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "+ Nhận định Có / Không" }));
    expect(screen.queryByText("Nhận định chọn Có / Không")).toBeNull();
    const statementInput = screen.getByPlaceholderText("Nhận định 1") as HTMLInputElement;
    await user.type(statementInput, "Máy tính cần có nguồn điện để hoạt động.");
    expect(statementInput.value).toContain("nguồn điện");
  });

  it("hiển thị tải ảnh cạnh nội dung, điểm sát độ khó và Preview Sandbox trong luồng P0", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    expect(screen.queryByText("Media")).toBeNull();
    const uploadButton = screen.getByRole("button", { name: "Tải lên ảnh minh họa" });
    expect(uploadButton).toBeTruthy();
    expect(uploadButton.parentElement?.parentElement?.contains(screen.getByPlaceholderText("Nhập nội dung câu hỏi"))).toBe(true);
    expect(screen.queryByRole("menuitem", { name: "MP3" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Video" })).toBeNull();
    expect(screen.queryByText(/Ảnh JPG\/PNG\/WEBP tối đa 5MB/)).toBeNull();
    expect(screen.getByText("Điểm")).toBeTruthy();
    expect(screen.queryByText("Độ khó")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Độ khó câu hỏi 1" })).toBeTruthy();
    expect(screen.getByRole("spinbutton", { name: "Điểm câu hỏi 1" }).className).toContain("text-center");
    expect(screen.queryByText("PRO")).toBeNull();
    expect(screen.getByRole("button", { name: /Xem trước Sandbox/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cài đặt" }));
    expect(screen.getAllByText("Quyền riêng tư & chia sẻ").length).toBeGreaterThan(0);
  });

  it("hiển thị điều khiển tải ảnh bìa và ảnh minh họa câu hỏi qua S3", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    expect(screen.getByRole("button", { name: "Tải lên ảnh minh họa" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cài đặt" }));
    expect(screen.getByRole("button", { name: "Tải ảnh đại diện Quiz" })).toBeTruthy();
    expect(screen.getByText(/JPG, PNG hoặc WEBP/)).toBeTruthy();
  });

  it("hiển thị phân tích lượt làm và tỷ lệ đúng/sai khi mở Quiz đã lưu", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/build?edit=5");
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Phân tích" }));
    expect(screen.getByTestId("quiz-analytics-workspace")).toBeTruthy();
    expect(screen.getByText("Hiệu quả làm bài của người làm bài")).toBeTruthy();
    expect(screen.getByText("Câu hỏi phân tích")).toBeTruthy();
    expect(screen.getAllByText("63%")).toHaveLength(2);
  });

  it("hiển thị trạng thái chưa đủ dữ liệu trong tab phân tích", async () => {
    const user = userEvent.setup();
    mocks.analytics.data = { summary: { completedAttempts: 0, averageScore: 0, passRate: 0, latestCompletedAt: new Date("2026-08-21T00:00:00Z") }, questions: [] };
    window.history.replaceState({}, "", "/build?edit=5");
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Phân tích" }));
    expect(screen.getByText("Chưa đủ dữ liệu để phân tích")).toBeTruthy();
  });

  it("cho phép ghim và đối chiếu phiên bản nháp trước khi khôi phục", async () => {
    const user = userEvent.setup();
    mocks.versions.data = [{ id: 9, title: "Phiên bản quan trọng", payload: { title: "Phiên bản quan trọng", description: "Mô tả cũ", questions: [{ id: "q1" }, { id: "q2" }] }, isPinned: false, savedAt: new Date("2026-08-21T00:00:00Z") }];
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Lịch sử bản nháp" }));
    await user.click(screen.getByRole("button", { name: "Ghim phiên bản nháp 9" }));
    expect(mocks.pinVersion).toHaveBeenCalledWith(expect.objectContaining({ versionId: 9, isPinned: true }));
    await user.click(screen.getByRole("button", { name: "So sánh" }));
    expect(screen.getByText("Đối chiếu trước khi khôi phục")).toBeTruthy();
    expect(screen.getAllByText("Phiên bản quan trọng")).toHaveLength(2);
  });

  it("không còn hiển thị Thư viện mẫu Quiz trong Studio", () => {
    render(<UserQuizCreator />);
    expect(screen.queryByRole("button", { name: "Mẫu Quiz" })).toBeNull();
    expect(screen.queryByText("Thư viện mẫu Quiz theo môn học")).toBeNull();
  });

  it("mở được lịch sử nội dung AI để tái sử dụng", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Nhập chủ đề" }));
    await user.click(screen.getByRole("button", { name: "Lịch sử nội dung AI" }));
    expect(screen.getByText("Nội dung AI đã tạo")).toBeTruthy();
    expect(screen.getByText("Chưa có nội dung AI nào để tái sử dụng.")).toBeTruthy();
  });

  it("hiển thị tay nắm kéo thả cho Ghép nối và Sắp xếp", () => {
    render(<UserQuizCreator />);
    fireEvent.change(screen.getByRole("combobox", { name: "Loại câu hỏi 1" }), { target: { value: "matching" } });
    expect(screen.getByRole("button", { name: "Kéo thả cặp ghép 1" })).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Loại câu hỏi 1" }), { target: { value: "ordering" } });
    expect(screen.getByRole("button", { name: "Kéo thả bước sắp xếp 1" })).toBeTruthy();
  });
});
