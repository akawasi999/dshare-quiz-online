import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), insert: vi.fn(), values: vi.fn(), onDuplicate: vi.fn(), select: vi.fn(), from: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(), delete: vi.fn(), update: vi.fn(), set: vi.fn() }));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), getDb: mocks.getDb }));

import { appRouter } from "./routers";

function caller() {
  const ctx: TrpcContext = { user: { id: 41, openId: "draft-owner", name: "Draft Owner", email: "draft@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("creator draft router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onDuplicate.mockResolvedValue(undefined);
    mocks.values.mockReturnValue({ onDuplicateKeyUpdate: mocks.onDuplicate });
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.limit.mockResolvedValue([{ id: 8, userId: 41, draftKey: "draft-owner-123", title: "Bản nháp", payload: { title: "Bản nháp", questions: [] } }]);
    mocks.orderBy.mockReturnValue({ limit: mocks.limit });
    mocks.where.mockReturnValue({ limit: mocks.limit, orderBy: mocks.orderBy });
    mocks.from.mockReturnValue({ where: mocks.where });
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mocks.set.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mocks.update.mockReturnValue({ set: mocks.set });
    mocks.getDb.mockResolvedValue({ insert: mocks.insert, select: mocks.select, delete: mocks.delete, update: mocks.update });
  });

  it("lưu payload nháp với khóa thuộc người dùng hiện tại", async () => {
    await expect(caller().creator.saveDraft({ draftKey: "draft-owner-123", title: "Bản nháp", payload: { title: "Bản nháp", questions: [] } })).resolves.toMatchObject({ savedAt: expect.any(Date) });
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ userId: 41, draftKey: "draft-owner-123", title: "Bản nháp" }));
    expect(mocks.onDuplicate).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
  });

  it("khôi phục và xóa nháp trong phạm vi người dùng gọi API", async () => {
    await expect(caller().creator.getDraft({ draftKey: "draft-owner-123" })).resolves.toMatchObject({ userId: 41, title: "Bản nháp" });
    await expect(caller().creator.deleteDraft({ draftKey: "draft-owner-123" })).resolves.toEqual({ success: true });
    expect(mocks.delete).toHaveBeenCalledTimes(2);
  });

  it("liệt kê và khôi phục phiên bản nháp thuộc đúng người dùng", async () => {
    await expect(caller().creator.listDraftVersions({ draftKey: "draft-owner-123" })).resolves.toHaveLength(1);
    await expect(caller().creator.restoreDraftVersion({ draftKey: "draft-owner-123", versionId: 8 })).resolves.toMatchObject({ title: "Bản nháp", payload: { title: "Bản nháp" } });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("ghim phiên bản nháp thuộc đúng người dùng", async () => {
    await expect(caller().creator.toggleDraftVersionPin({ draftKey: "draft-owner-123", versionId: 8, isPinned: true })).resolves.toEqual({ id: 8, isPinned: true });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.set).toHaveBeenCalledWith({ isPinned: true });
  });
});
