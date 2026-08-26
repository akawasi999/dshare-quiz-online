// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  detail: { data: undefined as any, isLoading: false, isError: true, error: new Error("Catalog tạm thời không phản hồi"), refetch: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1 }, loading: false }) }));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { detail: { useQuery: () => mocks.detail } }, quiz: { start: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) }, saveAnswer: { useMutation: () => ({ mutate: vi.fn() }) }, submit: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) }, securityEvent: { useMutation: () => ({ mutate: vi.fn() }) } } } }));
vi.mock("sonner", () => ({ toast: { warning: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useRoute: () => [true, { id: "999" }], useLocation: () => ["/quiz/999", vi.fn()] }));

import QuizRunner from "../client/src/pages/QuizRunner";

describe("QuizRunner data state", () => {
  beforeEach(() => { mocks.detail.data = undefined; mocks.detail.isLoading = false; mocks.detail.isError = true; mocks.detail.error = new Error("Catalog tạm thời không phản hồi"); mocks.detail.refetch.mockReset(); sessionStorage.clear(); window.history.replaceState({}, "", "/quiz/999"); });
  afterEach(cleanup);

  it("công bố lỗi chi tiết bộ đề và cho phép thử lại", async () => {
    const user = userEvent.setup();
    render(<QuizRunner />);

    expect(screen.getByRole("alert").textContent).toContain("Catalog tạm thời không phản hồi");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.detail.refetch).toHaveBeenCalledTimes(1);
  });

  it("hiển thị ảnh minh họa khi xem trước Sandbox", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("dshare-quiz-preview", JSON.stringify({ title: "Sandbox có ảnh", summary: "", durationSeconds: 900, questions: [{ id: -1, prompt: "Câu hỏi có tư liệu minh họa", type: "single", difficulty: "medium", tags: ["Sandbox"], imageUrl: "/manus-storage/question.png", options: [{ id: 1, body: "Đúng" }, { id: 2, body: "Sai" }], correctOptionIds: [1] }] }));
    window.history.replaceState({}, "", `${window.location.origin}/quiz/0?sandbox=1`);
    expect(window.location.search).toBe("?sandbox=1");
    const { container } = render(<QuizRunner />);
    await user.click(screen.getByRole("button", { name: "Bắt đầu xem trước" }));
    expect(screen.getByRole("img", { name: "Hình minh họa câu hỏi" }).getAttribute("src")).toBe("/manus-storage/question.png");
    expect(container.querySelector("audio")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Đúng/ }));
    expect(screen.getByRole("progressbar", { name: "Tiến độ làm bài" }).getAttribute("aria-valuenow")).toBe("1");
    expect(screen.getByText("Chính xác! Bạn có thể chuyển sang câu tiếp theo.")).toBeTruthy();
  });

  it("khóa điều hướng lùi trong Sandbox khi Studio tắt quyền quay lại", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("dshare-quiz-preview", JSON.stringify({ title: "Sandbox giới hạn quay lại", summary: "", durationSeconds: 900, allowBacktrack: false, questions: [{ id: -1, prompt: "Câu hỏi thứ nhất hợp lệ", type: "single", difficulty: "medium", tags: ["Sandbox"], options: [{ id: 1, body: "Đúng" }, { id: 2, body: "Sai" }], correctOptionIds: [1] }, { id: -2, prompt: "Câu hỏi thứ hai hợp lệ", type: "single", difficulty: "medium", tags: ["Sandbox"], options: [{ id: 3, body: "Đúng" }, { id: 4, body: "Sai" }], correctOptionIds: [3] }] }));
    window.history.replaceState({}, "", `${window.location.origin}/quiz/0?sandbox=1`);
    render(<QuizRunner />);
    await user.click(screen.getByRole("button", { name: "Bắt đầu xem trước" }));
    await user.click(screen.getByRole("button", { name: /Câu tiếp theo/ }));
    expect(screen.getByRole("button", { name: "Quay lại" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Đi đến câu 1" }).hasAttribute("disabled")).toBe(true);
  });

  it("hiển thị và chấm Ghép nối trong Sandbox", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("dshare-quiz-preview", JSON.stringify({ title: "Sandbox ghép nối", summary: "", durationSeconds: 900, questions: [{ id: -1, prompt: "Ghép thủ đô với quốc gia", type: "matching", difficulty: "medium", tags: ["Sandbox"], matchingPairs: [{ left: "Hà Nội", right: "Việt Nam" }, { left: "Tokyo", right: "Nhật Bản" }], options: [], correctOptionIds: [] }] }));
    window.history.replaceState({}, "", `${window.location.origin}/quiz/0?sandbox=1`);
    render(<QuizRunner />);
    await user.click(screen.getByRole("button", { name: "Bắt đầu xem trước" }));
    expect(screen.getByText("Ghép nối các cặp tương ứng")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Ghép nối cho Hà Nội"), "Việt Nam");
    await user.selectOptions(screen.getByLabelText("Ghép nối cho Tokyo"), "Nhật Bản");
    expect(screen.getByText("Chính xác! Bạn có thể chuyển sang câu tiếp theo.")).toBeTruthy();
  });

  it("hiển thị và chấm điền từ trong Sandbox", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("dshare-quiz-preview", JSON.stringify({ title: "Sandbox điền từ", summary: "", durationSeconds: 900, questions: [{ id: -1, prompt: "Tên nền tảng là gì?", type: "fill_blank", difficulty: "easy", tags: ["Sandbox"], acceptedAnswers: ["Dshare Quiz"], options: [], correctOptionIds: [] }] }));
    window.history.replaceState({}, "", `${window.location.origin}/quiz/0?sandbox=1`);
    render(<QuizRunner />);
    await user.click(screen.getByRole("button", { name: "Bắt đầu xem trước" }));
    await user.type(screen.getByLabelText("Câu trả lời ngắn"), "dshare quiz");
    await user.tab();
    expect(screen.getByText("Chính xác! Bạn có thể chuyển sang câu tiếp theo.")).toBeTruthy();
  });

  it("chấm nhận định Có/Không khi người học trả lời đủ từng hàng", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("dshare-quiz-preview", JSON.stringify({ title: "Sandbox nhận định", summary: "", durationSeconds: 900, questions: [{ id: -1, prompt: "Chọn Có hoặc Không cho từng nhận định.", type: "true_false_statements", difficulty: "medium", tags: ["Sandbox"], statements: [{ id: "a", text: "Nhận định thứ nhất", correct: true }, { id: "b", text: "Nhận định thứ hai", correct: false }], options: [], correctOptionIds: [] }] }));
    window.history.replaceState({}, "", `${window.location.origin}/quiz/0?sandbox=1`);
    render(<QuizRunner />);
    await user.click(screen.getByRole("button", { name: "Bắt đầu xem trước" }));
    expect(screen.getByText("Nhận định thứ nhất")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Có" })[0]!);
    await user.click(screen.getAllByRole("button", { name: "Không" })[1]!);
    expect(screen.getByRole("progressbar", { name: "Tiến độ làm bài" }).getAttribute("aria-valuenow")).toBe("1");
    expect(screen.getByText("Chính xác! Bạn có thể chuyển sang câu tiếp theo.")).toBeTruthy();
  });

  it("hiển thị đường dẫn Chủ đề CPanel trên màn hình chuẩn bị Quiz", () => {
    mocks.detail.data = {
      quiz: { id: 999, title: "Kiểm tra Tin học", summary: "Bộ đề theo Chủ đề mới.", mode: "training", difficulty: "medium", durationSeconds: 900, questionCount: 12, entryPointCost: 0, completionReward: 15 },
      category: null,
      subject: null,
      lesson: null,
      topic: { id: 32, name: "Tin học" },
      topicPath: "Tiểu học › Lớp 5 › Tin học",
      rootTopicId: 10,
      rootTopicTitle: "Tiểu học",
    };
    mocks.detail.isError = false;

    render(<QuizRunner />);

    expect(screen.getByText("Tiểu học › Lớp 5 › Tin học")).toBeTruthy();
    expect(screen.getByText("Sẵn sàng chinh phục bài tập này?")).toBeTruthy();
    expect(screen.getByText("Cấu trúc bài tập")).toBeTruthy();
    expect(screen.getByText("Cam kết chất lượng")).toBeTruthy();
    expect(screen.getByText("Kiểm tra Tin học")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bắt đầu làm bài" })).toBeTruthy();
  });

  it("ẩn thẻ thông số không có dữ liệu trên màn hình chuẩn bị Quiz", () => {
    mocks.detail.data = {
      quiz: { id: 999, title: "Quiz không có thông số", summary: "", mode: "training", difficulty: "medium", durationSeconds: 0, questionCount: 0, entryPointCost: 0, completionReward: 0 },
      category: null,
      subject: null,
      lesson: null,
      topic: { id: 32, name: "Tin học" },
      topicPath: "Tiểu học › Lớp 5 › Tin học",
      rootTopicId: 10,
      rootTopicTitle: "Tiểu học",
    };
    mocks.detail.isError = false;

    render(<QuizRunner />);

    expect(screen.queryByText("Thời gian làm bài")).toBeNull();
    expect(screen.queryByText("Điểm tối đa")).toBeNull();
    expect(screen.queryByText("0 phút")).toBeNull();
    expect(screen.getAllByText("Thưởng XP")).toHaveLength(2);
  });
});
