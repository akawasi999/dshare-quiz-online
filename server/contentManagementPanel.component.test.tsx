// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  content: { data: { categories: [{ id: 1, title: "Tin học" }], subjects: [{ id: 2, title: "Python", categoryId: 1 }], lessons: [{ id: 3, title: "Biến", subjectId: 2 }], quizzes: [{ id: 4 }] }, isLoading: false, refetch: vi.fn() },
  saveNode: { isPending: false, mutate: vi.fn() },
  saveQuiz: { isPending: false, mutate: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({ trpc: { admin: { contentTree: { useQuery: () => mocks.content }, saveContentNode: { useMutation: () => mocks.saveNode }, saveQuiz: { useMutation: () => mocks.saveQuiz } } } }));
vi.mock("@/components/CategoryCoverSettings", () => ({ default: () => <div>Category cover settings</div> }));

import ContentManagementPanel from "../client/src/components/ContentManagementPanel";

describe("ContentManagementPanel", () => {
  afterEach(cleanup);

  it("hiển thị structure bốn cấp và đổi form theo cấp nội dung được chọn", async () => {
    const user = userEvent.setup();
    render(<ContentManagementPanel />);

    expect(screen.getByRole("heading", { name: "Nội dung học tập" })).toBeTruthy();
    expect(screen.getByText("Tin học")).toBeTruthy();
    expect(screen.getByText("Python")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Môn học" }));
    expect(screen.getByText("ID Chủ đề")).toBeTruthy();
  });
});
