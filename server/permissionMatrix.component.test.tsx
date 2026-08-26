// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ save: vi.fn(), invalidate: vi.fn(), refetch: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      permissionMatrix: {
        useQuery: () => ({
          data: {
            plans: [{ id: 1, code: "basic", name: "Basic", tier: "basic" }, { id: 2, code: "pro-monthly", name: "PRO", tier: "pro" }, { id: 3, code: "premium-monthly", name: "PREMIUM", tier: "premium" }],
            permissions: [{ id: 10, key: "quiz.ai.file_import", name: "Trích xuất từ tệp", description: "Phân tích tài liệu bằng AI.", category: "quiz_ai", type: "boolean" }, { id: 11, key: "quiz.concurrent_users", name: "Người dùng đồng thời", description: "Giới hạn người dùng đồng thời.", category: "advanced", type: "limit" }],
            matrix: [{ planId: 1, permissionId: 10, isEnabled: false, limitValue: null, limitUnit: null }, { planId: 2, permissionId: 10, isEnabled: true, limitValue: null, limitUnit: null }, { planId: 3, permissionId: 10, isEnabled: true, limitValue: null, limitUnit: null }, { planId: 1, permissionId: 11, isEnabled: true, limitValue: 10, limitUnit: "items" }, { planId: 2, permissionId: 11, isEnabled: true, limitValue: 200, limitUnit: "items" }, { planId: 3, permissionId: 11, isEnabled: true, limitValue: 200, limitUnit: "items" }],
          },
          isLoading: false,
          refetch: mocks.refetch,
        }),
      },
      savePlanPermission: { useMutation: () => ({ mutate: mocks.save, isPending: false }) },
    },
    useUtils: () => ({ admin: { permissionMatrix: { invalidate: mocks.invalidate } } }),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import PermissionMatrixPanel from "../client/src/components/PermissionMatrixPanel";

describe("Permission Matrix CPanel", () => {
  it("hiển thị ba gói, category và cho phép cập nhật quyền", () => {
    render(<PermissionMatrixPanel />);
    expect(screen.getByText("Permission Matrix")).toBeTruthy();
    expect(screen.getByText("Basic")).toBeTruthy();
    expect(screen.getByText("PRO")).toBeTruthy();
    expect(screen.getByText("PREMIUM")).toBeTruthy();
    expect(screen.getByText("Quiz AI")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Bật Trích xuất từ tệp cho Basic"));
    expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({ planId: 1, permissionId: 10, isEnabled: true }));
  });
});
