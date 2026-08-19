import AccountLayout from "@/components/AccountLayout";
import CoverImageCropper from "@/components/CoverImageCropper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { validateQuizCoverFile } from "@shared/quizCover";
import { BookPlus, CheckCircle2, ImagePlus, Loader2, Pencil, PlusCircle, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type CoverTarget = "new" | number | null;

export default function UserQuizCreator() {
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverTarget, setCoverTarget] = useState<CoverTarget>(null);
  const [isReadingCover, setIsReadingCover] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [correct, setCorrect] = useState("");
  const [wrong, setWrong] = useState("");
  const mine = trpc.creator.myQuizzes.useQuery();
  const quota = trpc.learner.quota.useQuery();
  const uploadCover = trpc.creator.uploadCover.useMutation();
  const updateCover = trpc.creator.updateCover.useMutation({
    onSuccess: () => { mine.refetch(); toast.success("Đã cập nhật ảnh bìa quiz."); },
    onError: error => toast.error("Không thể cập nhật ảnh bìa", { description: error.message }),
  });
  const create = trpc.creator.createQuiz.useMutation({
    onSuccess: result => {
      toast.success(`Đã tạo ${result.title}. Quiz chỉ hiển thị cho bạn.`);
      setTitle(""); setSummary(""); setCoverImageUrl(""); setPrompt(""); setCorrect(""); setWrong("");
      mine.refetch();
    },
    onError: error => toast.error("Không thể tạo quiz", { description: error.message }),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate({
      lessonId: Number(lessonId),
      title,
      summary: summary || undefined,
      coverImageUrl: coverImageUrl || undefined,
      questions: [{ prompt, explanation: "Đáp án được tạo bởi chủ quiz.", type: "single", difficulty: "medium", tags: ["Quiz cá nhân"], options: [{ body: correct, isCorrect: true }, { body: wrong, isCorrect: false }], answerConfig: {} }],
    });
  };

  const selectCover = (file: File | undefined, target: CoverTarget) => {
    if (!file) return;
    const validationError = validateQuizCoverFile(file);
    if (validationError) { toast.error(validationError); return; }
    setCoverTarget(target);
    setPendingCoverFile(file);
  };

  const uploadCroppedCover = (file: File) => {
    const target = coverTarget;
    const reader = new FileReader();
    setPendingCoverFile(null);
    setIsReadingCover(true);
    reader.onerror = () => { setIsReadingCover(false); toast.error("Không thể đọc ảnh đã cắt."); };
    reader.onload = () => uploadCover.mutate({
      fileName: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      mimeType: "image/jpeg",
      base64: String(reader.result),
    }, {
      onSuccess: result => {
        if (target === "new") { setCoverImageUrl(result.url); toast.success("Đã tải ảnh bìa lên."); }
        else if (typeof target === "number") updateCover.mutate({ quizId: target, coverImageUrl: result.url });
      },
      onError: error => toast.error("Không thể tải ảnh bìa", { description: error.message }),
      onSettled: () => { setIsReadingCover(false); setCoverTarget(null); },
    });
    reader.readAsDataURL(file);
  };

  const quizLimit = quota.data?.limits.quizzesPerMonth;
  const used = quota.data?.usage.quizzes ?? 0;
  const isCoverBusy = isReadingCover || uploadCover.isPending || updateCover.isPending;

  return <AccountLayout><main className="container py-10 lg:py-14"><div className="mx-auto max-w-5xl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#4f46e5]">Không gian sáng tạo cá nhân</p><h1 className="mt-2 font-serif text-[38px] font-semibold tracking-[-.045em] text-[#172554]">Tạo Quiz của bạn</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#617786]">Tạo bộ đề riêng để tự luyện hoặc lưu câu hỏi theo mục tiêu học tập. Nội dung này không xuất hiện trong thư viện công khai.</p></div><Link href="/ho-so" className="text-xs font-bold text-[#4f46e5]">Quay về Bảng điều khiển</Link></header>
    <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <form onSubmit={submit} className="rounded-[28px] border border-[#172554]/10 bg-white p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white"><BookPlus size={20} /></span><div><h2 className="font-serif text-2xl font-semibold text-[#172554]">Bộ đề mới</h2><p className="mt-1 text-xs text-[#617786]">Bắt đầu với một câu hỏi hai phương án.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><Label>ID Bài học</Label><Input value={lessonId} onChange={event => setLessonId(event.target.value)} required type="number" className="mt-2" placeholder="Ví dụ: 1" /></div><div><Label>Tên Quiz</Label><Input value={title} onChange={event => setTitle(event.target.value)} required minLength={4} className="mt-2" placeholder="Ví dụ: Ôn tập chương 1" /></div></div><div className="mt-4"><Label>Mô tả ngắn</Label><Input value={summary} onChange={event => setSummary(event.target.value)} className="mt-2" placeholder="Mục tiêu của quiz này" /></div><CoverField value={coverImageUrl} onChange={setCoverImageUrl} busy={isCoverBusy} idPrefix="new-cover" onSelect={file => selectCover(file, "new")} /><div className="mt-6 border-t border-[#172554]/10 pt-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#4f46e5]">Câu hỏi đầu tiên</p><div className="mt-4"><Label>Nội dung câu hỏi</Label><Textarea value={prompt} onChange={event => setPrompt(event.target.value)} required className="mt-2 min-h-24" placeholder="Nhập câu hỏi rõ ràng…" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><Label>Đáp án đúng</Label><Input value={correct} onChange={event => setCorrect(event.target.value)} required className="mt-2 border-emerald-200" placeholder="Phương án đúng" /></div><div><Label>Phương án khác</Label><Input value={wrong} onChange={event => setWrong(event.target.value)} required className="mt-2" placeholder="Phương án chưa đúng" /></div></div></div><Button disabled={create.isPending || isCoverBusy || quota.isLoading || Boolean(quota.error)} className="mt-7 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#5b3df0]">{create.isPending ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />} Tạo Quiz riêng</Button></form>
      <aside className="rounded-[28px] bg-[#172554] p-6 text-white"><Sparkles className="text-[#a5b4fc]" size={22} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-[#bfdbfe]">Quota tạo Quiz</p>{quota.isLoading ? <p role="status" aria-live="polite" className="mt-4 text-sm text-[#dbeafe]">Đang tải quota tạo Quiz…</p> : quota.error ? <div role="alert" className="mt-4 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-[#dbeafe]"><p>Không thể tải quota: {quota.error.message}</p><Button onClick={() => quota.refetch()} variant="outline" className="mt-3 rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white">Thử lại</Button></div> : <><p className="mt-2 font-serif text-5xl font-semibold">{quizLimit === null ? "∞" : `${used}/${quizLimit}`}</p><p className="mt-2 text-xs leading-5 text-[#dbeafe]">Gói {quota.data?.tier?.toUpperCase() ?? "BASIC"} có thể tạo quiz riêng mỗi tháng. Nội dung riêng luôn ở trạng thái không công khai.</p></>}<Link href="/bang-gia" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#bfdbfe]">Xem quyền lợi gói <CheckCircle2 size={14} /></Link><div className="mt-8 rounded-2xl bg-white/10 p-4 text-xs leading-5 text-[#dbeafe]">Bạn có thể mở quiz riêng của mình trong danh sách bên dưới để tự luyện.</div></aside>
    </section>
    <section className="mt-7 rounded-[28px] border border-[#172554]/10 bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#4f46e5]">Quiz của bạn</p><h2 className="mt-2 font-serif text-2xl font-semibold text-[#172554]">Bộ đề riêng đã tạo</h2>{mine.isLoading ? <p role="status" aria-live="polite" className="mt-5 text-sm text-[#617786]">Đang tải bộ đề…</p> : mine.error ? <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-5 text-sm text-red-700"><p>Không thể tải quiz riêng: {mine.error.message}</p><Button onClick={() => mine.refetch()} variant="outline" className="mt-3 rounded-full border-red-200 text-red-700">Thử lại</Button></div> : mine.data?.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{mine.data.map(quiz => <article key={quiz.id} className="overflow-hidden rounded-2xl border border-[#172554]/8 bg-[#eef4ff]"><div className="relative">{quiz.coverImageUrl ? <img src={quiz.coverImageUrl} alt="" className="h-28 w-full object-cover" /> : <div className="grid h-28 place-items-center bg-gradient-to-br from-[#cfe4ff] to-[#eef4ff] text-xs font-bold text-[#065be5]">Chưa có ảnh bìa</div>}</div><div className="p-4"><Link href={`/quiz/${quiz.id}`} className="text-sm font-bold text-[#172554] hover:text-[#065be5]">{quiz.title}</Link><p className="mt-1 text-xs text-[#617786]">{quiz.questionCount} câu · Chỉ mình bạn thấy</p><div className="mt-4 flex flex-wrap gap-2"><label htmlFor={`quiz-cover-${quiz.id}`} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-bold text-[#065be5] transition hover:bg-[#dbeafe]"><Pencil size={13} /> Thay ảnh</label><input id={`quiz-cover-${quiz.id}`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isCoverBusy} onChange={event => { selectCover(event.target.files?.[0], quiz.id); event.currentTarget.value = ""; }} />{quiz.coverImageUrl ? <Button type="button" variant="ghost" disabled={isCoverBusy} onClick={() => updateCover.mutate({ quizId: quiz.id, coverImageUrl: null })} className="h-auto rounded-full px-3 py-2 text-[11px] text-[#de1264] hover:bg-red-50 hover:text-[#de1264]"><Trash2 size={13} /> Bỏ ảnh</Button> : null}</div></div></article>)}</div> : <p className="mt-5 rounded-2xl bg-[#eef4ff] p-5 text-sm text-[#617786]">Bạn chưa có quiz riêng nào. Tạo bộ đề đầu tiên để bắt đầu.</p>}</section>
  </div></main>{pendingCoverFile ? <CoverImageCropper file={pendingCoverFile} onCancel={() => { setPendingCoverFile(null); setCoverTarget(null); }} onConfirm={uploadCroppedCover} /> : null}</AccountLayout>;
}

function CoverField({ value, onChange, busy, idPrefix, onSelect }: { value: string; onChange: (value: string) => void; busy: boolean; idPrefix: string; onSelect: (file?: File) => void }) {
  return <div className="mt-4 rounded-2xl border border-dashed border-[#065be5]/25 bg-[#ebf4ff]/60 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><Label htmlFor={`${idPrefix}-url`}>Ảnh bìa bộ đề</Label><p className="mt-1 text-[11px] leading-4 text-[#617786]">Dán URL hoặc chọn ảnh để cắt theo tỷ lệ 16:9.</p></div><label htmlFor={`${idPrefix}-file`} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#065be5]/20 bg-white px-3 py-2 text-xs font-bold text-[#065be5] transition hover:bg-[#eef4ff]"><ImagePlus size={15} />{busy ? "Đang tải ảnh…" : "Chọn & cắt ảnh"}</label></div><Input id={`${idPrefix}-url`} value={value} onChange={event => onChange(event.target.value)} type="url" className="mt-3 bg-white" placeholder="https://…/cover.jpg" /><input id={`${idPrefix}-file`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={event => { onSelect(event.target.files?.[0]); event.currentTarget.value = ""; }} />{value ? <div className="relative mt-3 overflow-hidden rounded-xl border border-[#172554]/10"><img src={value} alt="Xem trước ảnh bìa bộ đề" className="h-28 w-full object-cover" /><button type="button" onClick={() => onChange("")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-[#141432]/75 text-white hover:bg-[#141432]" aria-label="Xóa ảnh bìa"><X size={15} /></button></div> : null}</div>;
}
