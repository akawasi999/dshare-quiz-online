// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tree: { data: { items: [], refreshedAt: new Date("2026-08-22T00:00:00Z") }, isLoading: false, isError: false, refetch: vi.fn() },
  checkUrl: { data: { normalizedUrl: "tin-hoc-van-phong", available: false }, isFetching: false, refetch: vi.fn(async () => ({ data: { normalizedUrl: "tin-hoc-van-phong", available: false } })) },
  create: { mutate: vi.fn(), isPending: false },
  update: { mutate: vi.fn(), isPending: false },
  bulk: { mutate: vi.fn(), isPending: false },
  archive: { mutate: vi.fn(), isPending: false },
  remove: { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/lib/trpc", () => ({ trpc: {
  useUtils: () => ({ admin: { learning: { topics: { tree: { invalidate: vi.fn() } } } } }),
  admin: { learning: { topics: {
    tree: { useQuery: () => mocks.tree },
    checkUrl: { useQuery: () => mocks.checkUrl },
    create: { useMutation: () => mocks.create },
    update: { useMutation: () => mocks.update },
    bulkUpdateQuizPolicies: { useMutation: () => mocks.bulk },
    archive: { useMutation: () => mocks.archive },
    remove: { useMutation: () => mocks.remove },
  } } },
} }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import TopicManagementPanel from "../client/src/components/TopicManagementPanel";

describe("TopicManagementPanel", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("bỏ mô tả popup, hiển thị URL/Parent và chặn tạo khi URL đã có", async () => {
    const user = userEvent.setup();
    render(<TopicManagementPanel />);
    await user.click(screen.getAllByRole("button", { name: "Tạo Chủ đề" })[0]!);

    expect(screen.queryByText(/Chủ đề không chọn cấp cha/i)).toBeNull();
    expect(screen.getByLabelText("URL")).toBeTruthy();
    expect(screen.getByText("Parent")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Cho phép tạo Quiz ở chủ đề này" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Kiểm duyệt Quiz mới được đăng trong chủ đề" })).toBeTruthy();

    await user.type(screen.getByLabelText("Tên Chủ đề"), "Tin học văn phòng");
    expect(screen.getByText("URL đã có")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Tạo Chủ đề" }));
    expect(mocks.create.mutate).not.toHaveBeenCalled();
  });

  it("hiển thị nhãn policy và gửi cập nhật hàng loạt cho các Chủ đề đã chọn", async () => {
    mocks.tree.data = { items: [{ id: 9, name: "Tin học", slug: "tin-hoc", parentId: null, path: "/9/", depth: 0, sortOrder: 0, status: "active", allowQuizCreation: false, requireQuizModeration: true, version: 1, quizCount: 0, childCount: 0, updatedAt: new Date() }], refreshedAt: new Date() } as any;
    const user = userEvent.setup();
    render(<TopicManagementPanel />);

    expect(screen.getByText("Tắt tạo Quiz")).toBeTruthy();
    expect(screen.getByText("Duyệt Quiz")).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: "Chọn Chủ đề Tin học" }));
    expect(screen.getByText("Đã chọn 1 Chủ đề")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(mocks.bulk.mutate).toHaveBeenCalledWith(expect.objectContaining({ topicIds: [9], allowQuizCreation: true, requireQuizModeration: false }));
  });
});
