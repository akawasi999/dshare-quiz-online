import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import { validateQuestionConfiguration } from "../shared/questionValidation";
import { storagePut } from "./storage";

export type ManualImportMimeType = "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/vnd.ms-excel";
export type ImportedDraftQuestion = { prompt: string; explanation: string; type: "single" | "multiple" | "true_false" | "fill_blank" | "matching" | "essay"; difficulty: "easy" | "medium" | "hard"; points: number; options: Array<{ body: string; isCorrect: boolean }>; accepted: string; pairs: Array<{ left: string; right: string }>; outline: string };

const maxFileBytes = 15 * 1024 * 1024;
const maxImportedQuestions = 50;
const supportedTypes = new Set(["single", "multiple", "true_false", "fill_blank", "matching", "essay"]);

const normalizedKey = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi-VN").replace(/[^a-z0-9]/g, "");
const cleanText = (value: unknown) => String(value ?? "").replace(/\u0000/g, " ").replace(/\s{2,}/g, " ").trim();
const decodeBase64 = (base64: string) => Buffer.from(base64.split(",").pop() ?? "", "base64");
const toDifficulty = (value: unknown): ImportedDraftQuestion["difficulty"] => { const text = normalizedKey(value); return text.includes("kho") || text === "hard" ? "hard" : text.includes("de") || text === "easy" ? "easy" : "medium"; };
const toType = (value: unknown): ImportedDraftQuestion["type"] => { const text = normalizedKey(value); if (text.includes("multiple") || text.includes("nhieudapan")) return "multiple"; if (text.includes("truefalse") || text.includes("dungsai")) return "true_false"; if (text.includes("fill") || text.includes("diantu")) return "fill_blank"; if (text.includes("match") || text.includes("ghepnoi")) return "matching"; if (text.includes("essay") || text.includes("tuluan")) return "essay"; return "single"; };
const safeName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "manual-quiz-import";

function pickColumn(row: Record<string, unknown>, names: string[]) {
  const indexed = Object.entries(row).map(([key, value]) => [normalizedKey(key), value] as const);
  for (const name of names) {
    const found = indexed.find(([key]) => key === normalizedKey(name));
    if (found) return found[1];
  }
  return undefined;
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function parseOptions(row: Record<string, unknown>, correctRaw: string) {
  const jsonOptions = parseJsonArray(pickColumn(row, ["options", "phuong an", "phương án", "dap an json", "đáp án json"]));
  const correctTokens = correctRaw.split(/[|,;/]/).map(value => normalizedKey(value)).filter(Boolean);
  if (jsonOptions.length) return jsonOptions.map((option, index) => {
    const item = typeof option === "object" && option ? option as Record<string, unknown> : { body: option };
    const itemRecord = item as Record<string, unknown>;
    const body = cleanText(itemRecord.body ?? itemRecord.text ?? itemRecord.value);
    const correctValue = (item as Record<string, unknown>).isCorrect;
    const explicitCorrect = correctValue === true || normalizedKey(correctValue) === "true" || normalizedKey(correctValue) === "1";
    return { body, isCorrect: explicitCorrect || correctTokens.includes(normalizedKey(String.fromCharCode(65 + index))) || correctTokens.includes(normalizedKey(body)) };
  }).filter(option => option.body);
  return ["A", "B", "C", "D", "E", "F"].map((letter, index) => {
    const body = cleanText(pickColumn(row, [letter, `option ${letter}`, `đáp án ${letter}`, `phương án ${letter}`]));
    return { body, isCorrect: correctTokens.includes(normalizedKey(letter)) || correctTokens.includes(normalizedKey(body)) };
  }).filter(option => option.body);
}

function parsePairs(value: unknown) {
  const jsonPairs = parseJsonArray(value);
  if (jsonPairs.length) return jsonPairs.map(pair => ({ left: cleanText((pair as Record<string, unknown>)?.left), right: cleanText((pair as Record<string, unknown>)?.right) })).filter(pair => pair.left && pair.right);
  return cleanText(value).split(/\n|\|/).map(line => line.split(/=>|→|;/)).map(parts => ({ left: cleanText(parts[0]), right: cleanText(parts[1]) })).filter(pair => pair.left && pair.right);
}

function fromRow(row: Record<string, unknown>, rowNumber: number): { question?: ImportedDraftQuestion; warning?: string } {
  const prompt = cleanText(pickColumn(row, ["prompt", "question", "cau hoi", "câu hỏi", "noi dung", "nội dung"]));
  if (!prompt) return { warning: `Dòng ${rowNumber}: thiếu nội dung câu hỏi.` };
  const type = toType(pickColumn(row, ["type", "loai", "loại", "question type", "dạng"]));
  const correctRaw = cleanText(pickColumn(row, ["correct answer", "correct", "answer", "dap an", "đáp án", "đáp án đúng", "accepted answers", "đáp án chấp nhận"]));
  const options = type === "true_false" ? [{ body: "Đúng", isCorrect: !["sai", "false", "b"].includes(normalizedKey(correctRaw)) }, { body: "Sai", isCorrect: ["sai", "false", "b"].includes(normalizedKey(correctRaw)) }] : parseOptions(row, correctRaw);
  const pairs = parsePairs(pickColumn(row, ["pairs", "cap ghep", "cặp ghép", "matching pairs"]));
  const accepted = cleanText(pickColumn(row, ["accepted answers", "accepted", "dap an", "đáp án", "đáp án chấp nhận"]) ?? correctRaw);
  const outline = cleanText(pickColumn(row, ["sample outline", "outline", "dan y", "dàn ý", "đáp án mẫu"]));
  const question: ImportedDraftQuestion = { prompt, explanation: cleanText(pickColumn(row, ["explanation", "loi giai", "lời giải", "solution"])), type, difficulty: toDifficulty(pickColumn(row, ["difficulty", "do kho", "độ khó"])), points: Math.min(100, Math.max(1, Number(pickColumn(row, ["points", "score", "diem", "điểm"])) || 1)), options, accepted, pairs, outline };
  const answerConfig = type === "fill_blank" ? { acceptedAnswers: accepted.split("|").map(value => value.trim()).filter(Boolean) } : type === "matching" ? { pairs } : type === "essay" ? { sampleOutline: outline } : {};
  const error = validateQuestionConfiguration({ type, options, answerConfig });
  return error ? { warning: `Dòng ${rowNumber}: ${error}` } : { question };
}

export function parseManualQuizText(text: string) {
  const normalized = text.replace(/\r/g, "").replace(/\u0000/g, " ").trim();
  const blocks = normalized.split(/(?=^(?:câu|question)\s*\d+\s*[.:)\-])/gim).map(block => block.trim()).filter(Boolean);
  const questions: ImportedDraftQuestion[] = [];
  const warnings: string[] = [];
  blocks.forEach((block, position) => {
    const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
    const first = lines.shift() ?? "";
    const prompt = cleanText(first.replace(/^(?:câu|question)\s*\d+\s*[.:)\-]\s*/i, ""));
    const optionRows = lines.map(line => line.match(/^([A-F])[.)\-:]\s*(.+)$/i)).filter(Boolean) as RegExpMatchArray[];
    const answerLine = lines.find(line => /^(?:đáp án|dap an|answer|correct answer)\s*[:\-]/i.test(line));
    const explanationLine = lines.find(line => /^(?:lời giải|loi giai|giải thích|giai thich|explanation)\s*[:\-]/i.test(line));
    const correctToken = cleanText(answerLine?.replace(/^[^:\-]+[:\-]\s*/, ""));
    const options = optionRows.map(match => ({ body: cleanText(match[2]), isCorrect: normalizedKey(match[1]) === normalizedKey(correctToken) || normalizedKey(match[2]) === normalizedKey(correctToken) }));
    if (!prompt || options.length < 2) { warnings.push(`Câu ${position + 1}: cần dòng “Câu n: …” và ít nhất hai phương án A./B.`); return; }
    if (options.filter(option => option.isCorrect).length !== 1) { warnings.push(`Câu ${position + 1}: không xác định được một đáp án đúng từ dòng “Đáp án: A”.`); return; }
    questions.push({ prompt, explanation: cleanText(explanationLine?.replace(/^[^:\-]+[:\-]\s*/, "")), type: "single", difficulty: "medium", points: 1, options, accepted: "", pairs: [], outline: "" });
  });
  return { questions, warnings: blocks.length ? warnings : ["Không tìm thấy cấu trúc “Câu n: …”, “A./B./…”, “Đáp án: A” trong tài liệu."] };
}

export function parseManualQuizSpreadsheetRows(rows: Array<Record<string, unknown>>) {
  const parsed = rows.slice(0, maxImportedQuestions).map((row, index) => fromRow(row, index + 2));
  return { questions: parsed.flatMap(result => result.question ? [result.question] : []), warnings: parsed.flatMap(result => result.warning ? [result.warning] : []) };
}

export async function importManualQuizFile(input: { userId: number; fileName: string; mimeType: ManualImportMimeType; base64: string }) {
  const bytes = decodeBase64(input.base64);
  if (!bytes.length || bytes.length > maxFileBytes) throw new Error("Tệp nhập phải có dung lượng từ 1 byte đến tối đa 15 MB.");
  const stored = await storagePut(`manual-quiz-imports/${input.userId}/${Date.now()}-${safeName(input.fileName)}`, bytes, input.mimeType);
  if (input.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || input.mimeType === "application/vnd.ms-excel") {
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const sheet = workbook.Sheets.Questions ?? workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("Không tìm thấy sheet dữ liệu trong tệp Excel.");
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
    const { questions, warnings } = parseManualQuizSpreadsheetRows(rows);
    if (!questions.length) throw new Error(warnings[0] ?? "Tệp Excel không có câu hỏi hợp lệ để nhập.");
    return { sourceName: input.fileName, sourceUrl: stored.url, sourceCharacterCount: rows.length, questions, warnings, isSpreadsheet: true };
  }
  let text = "";
  if (input.mimeType === "application/pdf") {
    const parser = new PDFParse({ data: bytes });
    try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
  } else {
    text = (await mammoth.extractRawText({ buffer: bytes })).value;
  }
  const parsed = parseManualQuizText(text.slice(0, 45_000));
  if (!parsed.questions.length) throw new Error(parsed.warnings[0] ?? "Không tìm thấy câu hỏi hợp lệ trong tài liệu.");
  return { sourceName: input.fileName, sourceUrl: stored.url, sourceCharacterCount: text.length, questions: parsed.questions.slice(0, maxImportedQuestions), warnings: parsed.warnings, isSpreadsheet: false };
}
