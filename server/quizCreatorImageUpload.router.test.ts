import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ storagePut: vi.fn(), sharp: vi.fn() }));

vi.mock("./storage", async importOriginal => ({ ...(await importOriginal<typeof import("./storage")>()), storagePut: mocks.storagePut }));
vi.mock("sharp", () => ({ default: mocks.sharp }));

import { appRouter } from "./routers";

function caller() {
  const ctx: TrpcContext = { user: { id: 9, openId: "image-owner", name: "Image Owner", email: "image@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("creator image uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storagePut.mockResolvedValue({ key: "quiz-images/9/sample.webp", url: "/manus-storage/quiz-images/9/sample.webp" });
    mocks.sharp.mockImplementation(() => {
      const pipeline = { rotate: vi.fn(), webp: vi.fn(), toBuffer: vi.fn().mockResolvedValue(Buffer.from("webp-image")) };
      pipeline.rotate.mockReturnValue(pipeline);
      pipeline.webp.mockReturnValue(pipeline);
      return pipeline;
    });
  });

  it("chuyển ảnh bìa và ảnh câu hỏi sang WebP trước khi lưu vào vùng S3 riêng", async () => {
    const image = "data:image/png;base64,aGVsbG8=";
    await expect(caller().creator.uploadCover({ fileName: "Bìa quiz.png", mimeType: "image/png", base64: image })).resolves.toEqual({ url: "/manus-storage/quiz-images/9/sample.webp" });
    await expect(caller().creator.uploadQuestionImage({ fileName: "Câu hỏi.png", mimeType: "image/png", base64: image })).resolves.toEqual({ url: "/manus-storage/quiz-images/9/sample.webp" });
    expect(mocks.sharp).toHaveBeenCalledTimes(2);
    expect(mocks.storagePut).toHaveBeenNthCalledWith(1, expect.stringMatching(/quiz-covers\/9\/.*\.webp$/), expect.any(Buffer), "image/webp");
    expect(mocks.storagePut).toHaveBeenNthCalledWith(2, expect.stringMatching(/quiz-question-images\/9\/.*\.webp$/), expect.any(Buffer), "image/webp");
  });

  it("từ chối dữ liệu ảnh có MIME không khớp", async () => {
    await expect(caller().creator.uploadQuestionImage({ fileName: "wrong.png", mimeType: "image/png", base64: "data:image/jpeg;base64,aGVsbG8=" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
