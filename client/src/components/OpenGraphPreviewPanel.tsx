import { CPanelPageHeader } from "@/components/CPanelPageHeader";
import OpenGraphQuizPreview from "@/components/OpenGraphQuizPreview";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function OpenGraphPreviewPanel() {
  const catalog = trpc.catalog.list.useQuery();
  const [selectedId, setSelectedId] = useState<string>("");
  const quizzes = catalog.data ?? [];
  useEffect(() => { if (!selectedId && quizzes[0]) setSelectedId(String(quizzes[0].quizId)); }, [quizzes, selectedId]);
  const selectedQuiz = useMemo(() => quizzes.find(quiz => String(quiz.quizId) === selectedId), [quizzes, selectedId]);

  if (catalog.isLoading) return <div className="mx-auto grid min-h-64 max-w-5xl place-items-center text-sm text-text-secondary" role="status"><Loader2 className="mr-2 animate-spin text-primary" size={18} />Đang tải Quiz public…</div>;
  return <div className="mx-auto max-w-5xl"><CPanelPageHeader eyebrow="SEO / Social sharing" title="Open Graph Preview" description="Kiểm tra thẻ chia sẻ được phát hành cho từng Quiz public trước khi gửi liên kết." />
    <section className="mt-6 rounded-[var(--radius-xl-token)] border border-border bg-surface p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary"><Share2 size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Quiz public</p><h2 className="mt-1 text-xl font-bold text-foreground">Chọn Quiz để xem thẻ chia sẻ</h2></div></div><Select value={selectedId} onValueChange={setSelectedId}><SelectTrigger className="mt-6 max-w-xl"><SelectValue placeholder="Chọn Quiz public" /></SelectTrigger><SelectContent>{quizzes.map(quiz => <SelectItem key={quiz.quizId} value={String(quiz.quizId)}>{quiz.title}</SelectItem>)}</SelectContent></Select>{selectedQuiz ? <div className="mt-6"><OpenGraphQuizPreview quiz={{ id: selectedQuiz.quizId, title: selectedQuiz.title, summary: selectedQuiz.summary, coverImageUrl: selectedQuiz.coverImageUrl }} /><p className="mt-4 text-xs leading-5 text-text-secondary">Preview dùng cùng tiêu đề, mô tả, URL canonical và ảnh bìa mà máy chủ phát cho Open Graph/Twitter. Sau khi cập nhật ảnh hoặc mô tả, hãy chia sẻ lại URL để nền tảng mạng xã hội làm mới cache.</p></div> : <div className="mt-6 rounded-[var(--radius-md-token)] bg-muted p-5 text-sm text-text-secondary">Chưa có Quiz public để xem trước. Hãy publish Quiz trước.</div>}</section></div>;
}
