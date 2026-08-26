// @ts-nocheck
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

export type PrintableQuizQuestion = {
  prompt: string;
  explanation: string;
  type: "single" | "multiple" | "true_false" | "fill_blank" | "matching" | "essay";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  options: Array<{ body: string; isCorrect: boolean }>;
  accepted: string;
  pairs: Array<{ left: string; right: string }>;
  outline: string;
};

export type PrintableQuiz = { title: string; summary?: string; durationMinutes: number; questions: PrintableQuizQuestion[] };
export type PrintableQuizResult = {
  title: string;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  questionCount: number;
  durationSeconds?: number;
  passed: boolean;
  review: Array<{ prompt: string; isCorrect: boolean; explanation?: string | null }>;
};

const questionTypeLabels = { single: "Chọn 1 đáp án", multiple: "Chọn nhiều đáp án", true_false: "Đúng / Sai", fill_blank: "Điền vào chỗ trống", matching: "Ghép nối", essay: "Tự luận" };
const difficultyLabels = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const safeFileName = (title: string) => (title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "dshare-quiz");

function getOptions(question: PrintableQuizQuestion) {
  if (question.type !== "true_false") return question.options;
  const trueIsCorrect = question.options[0]?.isCorrect ?? true;
  return [{ body: "Đúng", isCorrect: trueIsCorrect }, { body: "Sai", isCorrect: !trueIsCorrect }];
}

function answerLines(question: PrintableQuizQuestion) {
  if (["single", "multiple", "true_false"].includes(question.type)) return getOptions(question).map((option, index) => `${option.isCorrect ? "✓ " : ""}${String.fromCharCode(65 + index)}. ${option.body || `Phương án ${String.fromCharCode(65 + index)}`}`);
  if (question.type === "fill_blank") return [`Đáp án chấp nhận: ${question.accepted || "Chưa thiết lập"}`];
  if (question.type === "matching") return question.pairs.map((pair, index) => `${index + 1}. ${pair.left || "Vế A"} → ${pair.right || "Vế B"}`);
  return [`Dàn ý đáp án mẫu: ${question.outline || "Chưa thiết lập"}`];
}

function downloadBlob(blob: Blob, fileName: string) {
  const anchor = document.createElement("a");
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

function documentHeading(quiz: PrintableQuiz) {
  return `Dshare Quiz Online · ${quiz.questions.length} câu · ${quiz.durationMinutes} phút`;
}

export async function exportQuizToWord(quiz: PrintableQuiz) {
  const children = [
    new Paragraph({ children: [new TextRun({ text: quiz.title || "Quiz chưa đặt tên", bold: true, size: 32, color: "065BE5" })], heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ children: [new TextRun({ text: documentHeading(quiz), color: "475569", italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
    ...(quiz.summary ? [new Paragraph({ children: [new TextRun({ text: quiz.summary, color: "334155" })], spacing: { after: 260 } })] : []),
    ...quiz.questions.flatMap((question, index) => [
      new Paragraph({ children: [new TextRun({ text: `Câu ${index + 1}. `, bold: true, color: "065BE5" }), new TextRun({ text: question.prompt || "Câu hỏi chưa có nội dung", bold: true })], spacing: { before: 240, after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: `${questionTypeLabels[question.type]} · ${difficultyLabels[question.difficulty]} · ${question.points} điểm`, color: "64748B", size: 18 })], spacing: { after: 100 } }),
      ...answerLines(question).map(line => new Paragraph({ children: [new TextRun({ text: line, color: line.startsWith("✓") ? "007453" : "172554", bold: line.startsWith("✓") })], bullet: { level: 0 }, spacing: { after: 60 } })),
      ...(question.explanation ? [new Paragraph({ children: [new TextRun({ text: "Lời giải: ", bold: true, color: "065BE5" }), new TextRun({ text: question.explanation })], spacing: { before: 80, after: 100 } })] : []),
    ]),
  ];
  const document = new Document({ sections: [{ children }] });
  downloadBlob(await Packer.toBlob(document), `${safeFileName(quiz.title)}.docx`);
}

export type QuizPdfVariant = "student" | "answer_key" | "teacher";

export async function exportQuizToPdf(quiz: PrintableQuiz, variant: QuizPdfVariant = "teacher") {
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;
  if (typeof pdfMake.addVirtualFileSystem === "function") pdfMake.addVirtualFileSystem(pdfFonts);
  else pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs || pdfFonts;
  const content = [
    { text: quiz.title || "Quiz chưa đặt tên", style: "title" },
    { text: documentHeading(quiz), style: "meta" },
    ...(quiz.summary ? [{ text: quiz.summary, style: "summary" }] : []),
    { text: variant === "student" ? "ĐỀ LÀM BÀI" : variant === "answer_key" ? "ĐÁP ÁN" : "ĐỀ GIÁO VIÊN", style: "section" },
    ...quiz.questions.flatMap((question, index) => [
      { text: `Câu ${index + 1}. ${question.prompt || "Câu hỏi chưa có nội dung"}`, style: "question" },
      { text: `${questionTypeLabels[question.type]} · ${difficultyLabels[question.difficulty]} · ${question.points} điểm`, style: "meta" },
      ...(variant === "student" ? [{ text: "................................................................................................................", style: "answer", margin: [12, 8, 0, 8] }] : answerLines(question).map(line => ({ text: line, style: line.startsWith("✓") ? "correctAnswer" : "answer", margin: [12, 2, 0, 0] }))),
      ...(variant === "teacher" && question.explanation ? [{ text: [{ text: "Lời giải: ", bold: true }, { text: question.explanation }], style: "explanation" }] : []),
    ]),
  ];
  const definition = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 48],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "172554" },
    content,
    styles: {
      title: { fontSize: 21, bold: true, color: "065BE5", alignment: "center", margin: [0, 0, 0, 7] },
      meta: { fontSize: 9, color: "64748B", alignment: "center", margin: [0, 0, 0, 12] },
      summary: { fontSize: 10, color: "334155", lineHeight: 1.3, margin: [0, 0, 0, 16] },
      section: { fontSize: 10, bold: true, color: "065BE5", margin: [0, 4, 0, 12] },
      question: { fontSize: 12, bold: true, color: "172554", margin: [0, 14, 0, 4] },
      answer: { fontSize: 10, color: "172554" },
      correctAnswer: { fontSize: 10, color: "007453", bold: true },
      explanation: { fontSize: 9, color: "475569", margin: [12, 6, 0, 3] },
    },
    footer: (currentPage: number, pageCount: number) => ({ text: `Dshare Quiz Online · Trang ${currentPage}/${pageCount}`, alignment: "center", color: "64748B", fontSize: 8, margin: [0, 10, 0, 0] }),
  };
  pdfMake.createPdf(definition).download(`${safeFileName(`${quiz.title}-${variant}`)}.pdf`);
}

export async function exportQuizResultToPdf(result: PrintableQuizResult) {
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;
  if (typeof pdfMake.addVirtualFileSystem === "function") pdfMake.addVirtualFileSystem(pdfFonts);
  else pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs || pdfFonts;
  const duration = result.durationSeconds ? `${Math.floor(result.durationSeconds / 60)} phút ${String(result.durationSeconds % 60).padStart(2, "0")} giây` : "Chưa ghi nhận";
  const definition = {
    pageSize: "A4",
    pageMargins: [42, 48, 42, 48],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "1F2937" },
    content: [
      { text: "Dshare Quiz Online", style: "brand" },
      { text: "BÁO CÁO KẾT QUẢ QUIZ", style: "title" },
      { text: result.title, style: "quizTitle" },
      { text: `Tạo lúc ${new Date().toLocaleString("vi-VN")}`, style: "meta" },
      { table: { widths: ["*", "*", "*"], body: [[{ text: "ĐIỂM", style: "cardLabel" }, { text: "ĐÚNG / SAI", style: "cardLabel" }, { text: "THỜI GIAN", style: "cardLabel" }], [{ text: `${result.scorePercent}/100`, style: "cardValue" }, { text: `${result.correctCount}/${result.incorrectCount}`, style: "cardValue" }, { text: duration, style: "cardValue" }]] }, layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => "F1F5F9", paddingLeft: () => 12, paddingRight: () => 12, paddingTop: () => 10, paddingBottom: () => 10 }, margin: [0, 20, 0, 20] },
      { text: result.passed ? "KẾT QUẢ: ĐẠT MỤC TIÊU" : "KẾT QUẢ: CẦN ÔN THÊM", style: result.passed ? "success" : "warning" },
      { text: "PHÂN TÍCH CÂU HỎI", style: "section" },
      ...result.review.map((item, index) => ({ text: [{ text: `${item.isCorrect ? "✓" : "•"} Câu ${index + 1}: `, bold: true }, { text: item.prompt }], style: item.isCorrect ? "correct" : "incorrect", margin: [0, 5, 0, 0] })),
      { text: `Tổng quan: ${result.correctCount} câu trả lời đúng và ${result.incorrectCount} câu cần ôn lại trên tổng ${result.questionCount} câu.`, style: "summary" },
    ],
    styles: {
      brand: { fontSize: 10, bold: true, color: "635BFF", alignment: "center", margin: [0, 0, 0, 8] },
      title: { fontSize: 21, bold: true, color: "1F2937", alignment: "center", margin: [0, 0, 0, 5] },
      quizTitle: { fontSize: 13, color: "4B5563", alignment: "center" },
      meta: { fontSize: 9, color: "6B7280", alignment: "center", margin: [0, 6, 0, 0] },
      cardLabel: { fontSize: 8, bold: true, color: "6B7280", alignment: "center" },
      cardValue: { fontSize: 14, bold: true, color: "1F2937", alignment: "center" },
      success: { fontSize: 11, bold: true, color: "16A34A", margin: [0, 0, 0, 18] },
      warning: { fontSize: 11, bold: true, color: "D97706", margin: [0, 0, 0, 18] },
      section: { fontSize: 11, bold: true, color: "635BFF", margin: [0, 0, 0, 8] },
      correct: { fontSize: 10, color: "166534" },
      incorrect: { fontSize: 10, color: "B91C1C" },
      summary: { fontSize: 10, color: "4B5563", margin: [0, 20, 0, 0] },
    },
    footer: (currentPage: number, pageCount: number) => ({ text: `Dshare Quiz Online · Báo cáo kết quả · Trang ${currentPage}/${pageCount}`, alignment: "center", color: "6B7280", fontSize: 8, margin: [0, 10, 0, 0] }),
  };
  pdfMake.createPdf(definition).download(`${safeFileName(`ket-qua-${result.title}`)}.pdf`);
}
