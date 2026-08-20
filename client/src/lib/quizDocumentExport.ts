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

export async function exportQuizToPdf(quiz: PrintableQuiz) {
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([import("pdfmake/build/pdfmake"), import("pdfmake/build/vfs_fonts")]);
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;
  if (typeof pdfMake.addVirtualFileSystem === "function") pdfMake.addVirtualFileSystem(pdfFonts);
  else pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs || pdfFonts;
  const content = [
    { text: quiz.title || "Quiz chưa đặt tên", style: "title" },
    { text: documentHeading(quiz), style: "meta" },
    ...(quiz.summary ? [{ text: quiz.summary, style: "summary" }] : []),
    { text: "CÂU HỎI VÀ ĐÁP ÁN", style: "section" },
    ...quiz.questions.flatMap((question, index) => [
      { text: `Câu ${index + 1}. ${question.prompt || "Câu hỏi chưa có nội dung"}`, style: "question" },
      { text: `${questionTypeLabels[question.type]} · ${difficultyLabels[question.difficulty]} · ${question.points} điểm`, style: "meta" },
      ...answerLines(question).map(line => ({ text: line, style: line.startsWith("✓") ? "correctAnswer" : "answer", margin: [12, 2, 0, 0] })),
      ...(question.explanation ? [{ text: [{ text: "Lời giải: ", bold: true }, { text: question.explanation }], style: "explanation" }] : []),
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
  pdfMake.createPdf(definition).download(`${safeFileName(quiz.title)}.pdf`);
}
