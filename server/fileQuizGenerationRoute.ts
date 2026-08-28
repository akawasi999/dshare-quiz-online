import type { Express, Request, Response } from "express";
import multer from "multer";
import { sdk } from "./_core/sdk";
import { getAiQuizFileMimeType } from "./fileQuizGeneration";
import { appRouter } from "./routers";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 } });
const errorStatus = (code?: string) => code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : code === "PAYLOAD_TOO_LARGE" ? 413 : 400;

function toQuestionCount(value: unknown) {
  const count = Number(value);
  return Number.isInteger(count) ? count : 5;
}

function toDifficulty(value: unknown) {
  return value === "easy" || value === "hard" ? value : "medium";
}

async function handleGenerateFromFile(req: Request, res: Response) {
  const user = await sdk.authenticateRequest(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "Vui lòng đăng nhập để tạo câu hỏi từ tệp." });
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Vui lòng chọn một tệp để tải lên." });
  const mimeType = getAiQuizFileMimeType(file.originalname);
  if (!mimeType) return res.status(400).json({ error: "Chỉ hỗ trợ Word (.docx), PDF, PowerPoint (.pptx) hoặc TXT." });
  try {
    const caller = appRouter.createCaller({ req, res, user });
    const result = await caller.creator.generateQuestionsFromFile({ fileName: file.originalname, mimeType, base64: `data:${mimeType};base64,${file.buffer.toString("base64")}`, questionCount: toQuestionCount(req.body?.questionCount ?? req.body?.count), difficulty: toDifficulty(req.body?.difficulty) });
    return res.json({ success: true, ...result });
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    return res.status(errorStatus(detail.code)).json({ error: detail.message || "Không thể tạo câu hỏi từ tệp." });
  }
}

export function registerFileQuizGenerationRoute(app: Express) {
  app.post("/api/generate-from-file", (req, res) => upload.single("file")(req, res, error => {
    if (error) return res.status(error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? "Tệp đính kèm tối đa 15 MB." : "Không thể đọc dữ liệu tệp tải lên." });
    void handleGenerateFromFile(req, res);
  }));
}
