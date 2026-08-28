import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAiQuizGenerationFileKind, validateAiQuizGenerationFile } from "@/lib/quizStudioFile";
import { trpc } from "@/lib/trpc";
import { FileCheck2, FileText, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type GeneratedQuestion = { prompt: string; explanation: string; options: Array<{ body: string; isCorrect: boolean }>; answerConfig: Record<string, unknown>; type: string; difficulty: string; points?: number; imageUrl?: string };

const acceptedFormats = ".docx,.pdf,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain";
const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Không thể đọc tệp đã chọn.")); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
const formatFileSize = (bytes: number) => bytes < 1_048_576 ? `${Math.max(1, Math.ceil(bytes / 1_024))} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;

export function QuizFileUploadModal({ open, onOpenChange, onGenerated, onBusyChange }: { open: boolean; onOpenChange: (open: boolean) => void; onGenerated: (questions: GeneratedQuestion[]) => void; onBusyChange?: (busy: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const generate = trpc.creator.generateQuestionsFromFile.useMutation({
    onSuccess: result => {
      const questions = result.questions as GeneratedQuestion[];
      onGenerated(questions);
      toast.success(`Đã thêm ${questions.length} câu hỏi từ ${result.sourceName}.`);
      setFile(null); setError(""); onOpenChange(false);
    },
    onError: requestError => setError(requestError.message || "Không thể tạo câu hỏi từ tệp."),
  });
  useEffect(() => { onBusyChange?.(generate.isPending); }, [generate.isPending, onBusyChange]);

  const chooseFile = (next: File | null | undefined) => {
    if (!next) return;
    const validationError = validateAiQuizGenerationFile(next);
    if (validationError) { setFile(null); setError(validationError); return; }
    setFile(next); setError("");
  };
  const submit = async () => {
    if (!file) { setError("Vui lòng chọn một tệp trước khi tạo câu hỏi."); return; }
    const kind = getAiQuizGenerationFileKind(file);
    if (!kind) { setError("Định dạng tệp không được hỗ trợ."); return; }
    try { generate.mutate({ fileName: file.name, mimeType: kind.mimeType, base64: await toDataUrl(file), questionCount, difficulty }); }
    catch (readError) { setError(readError instanceof Error ? readError.message : "Không thể đọc tệp đã chọn."); }
  };
  const close = () => { if (generate.isPending) return; setError(""); onOpenChange(false); };

  return <Dialog open={open} onOpenChange={close}><DialogContent data-testid="quiz-file-upload-modal" className="max-w-xl overflow-hidden rounded-[24px] border border-[#7057e8]/20 bg-white p-0 shadow-2xl"><div className="bg-[radial-gradient(circle_at_top_right,_rgba(112,87,232,.18),_transparent_52%),linear-gradient(135deg,#f9f7ff,#eff6ff)] px-6 pb-5 pt-6"><DialogHeader><DialogTitle className="flex items-center gap-2 text-lg text-[#172554]"><span className="grid size-9 place-items-center rounded-xl bg-[#7057e8] text-white shadow-[0_8px_18px_rgba(112,87,232,.25)]"><Sparkles size={18} /></span>Tạo câu hỏi từ tệp</DialogTitle><DialogDescription className="pt-1 text-sm leading-6 text-[#52637a]">Tải tài liệu để AI đọc nội dung và tạo câu hỏi có thể chỉnh sửa ngay trong Studio.</DialogDescription></DialogHeader></div><div className="space-y-5 px-6 py-5"><input ref={inputRef} type="file" accept={acceptedFormats} className="hidden" onChange={event => chooseFile(event.target.files?.[0])} />{file ? <div data-testid="file-upload-selected" className="flex items-center gap-3 rounded-2xl border border-[#7057e8]/20 bg-[#faf9ff] p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#7057e8] shadow-sm"><FileCheck2 size={19} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#25324d]">{file.name}</p><p className="mt-0.5 text-xs text-[#71838d]">{formatFileSize(file.size)} · Sẵn sàng trích xuất</p></div><Button type="button" size="icon" variant="ghost" onClick={() => { setFile(null); setError(""); if (inputRef.current) inputRef.current.value = ""; }} disabled={generate.isPending} aria-label="Bỏ tệp đã chọn" className="shrink-0 rounded-xl text-[#71838d] hover:bg-white hover:text-[#de1264]"><X size={17} /></Button></div> : <button type="button" data-testid="file-upload-dropzone" onClick={() => inputRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }} className="group flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#7057e8]/28 bg-[#fbfaff] px-5 text-center transition hover:border-[#7057e8]/55 hover:bg-[#f6f3ff]"><span className="grid size-12 place-items-center rounded-2xl bg-white text-[#7057e8] shadow-sm transition group-hover:-translate-y-0.5"><UploadCloud size={23} /></span><span className="mt-3 text-sm font-bold text-[#25324d]">Kéo thả tệp vào đây hoặc chọn tệp</span><span className="mt-1 text-xs leading-5 text-[#71838d]">Word (.docx), PDF, PowerPoint (.pptx), TXT · tối đa 15 MB</span></button>}{error ? <p role="alert" className="rounded-xl bg-[#fff1f6] px-3 py-2 text-xs font-medium text-[#de1264]">{error}</p> : null}<div className="grid gap-4 rounded-2xl bg-[#f8fafc] p-4 sm:grid-cols-[1fr_1fr]"><label className="grid gap-1.5 text-xs font-bold text-[#475569]">Số câu hỏi<input aria-label="Số câu hỏi tạo từ tệp" type="number" min="1" max="20" value={questionCount} onChange={event => setQuestionCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} className="h-10 rounded-xl border border-[#d7e1ef] bg-white px-3 text-sm font-semibold text-[#25324d]" /></label><label className="grid gap-1.5 text-xs font-bold text-[#475569]">Độ khó<select aria-label="Độ khó câu hỏi tạo từ tệp" value={difficulty} onChange={event => setDifficulty(event.target.value as "easy" | "medium" | "hard")} className="h-10 rounded-xl border border-[#d7e1ef] bg-white px-3 text-sm font-semibold text-[#25324d]"><option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Nâng cao</option></select></label></div><div className="flex items-start gap-2 rounded-xl bg-[#effaf5] px-3 py-2.5 text-xs leading-5 text-[#007453]"><FileText size={15} className="mt-0.5 shrink-0" />AI chỉ tạo câu hỏi từ nội dung trích xuất. Bạn có thể xem lại và chỉnh sửa toàn bộ câu hỏi sau khi thêm vào Studio.</div></div><DialogFooter className="border-t border-[#e5e7eb] bg-[#fcfcfe] px-6 py-4 sm:justify-between"><Button type="button" variant="ghost" onClick={close} disabled={generate.isPending} className="text-[#64748b]">Hủy</Button><Button type="button" onClick={() => void submit()} disabled={!file || generate.isPending} className="min-w-40 rounded-xl bg-[#7057e8] text-white hover:bg-[#5d47cc]">{generate.isPending ? <><Loader2 className="animate-spin" size={16} />Đang tạo…</> : <><Sparkles size={16} />Tạo câu hỏi</>}</Button></DialogFooter></DialogContent></Dialog>;
}
