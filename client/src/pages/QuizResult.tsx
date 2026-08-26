import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { QuizAIStudyAssistant } from "@/components/QuizAIStudyAssistant";
import { exportQuizResultToPdf } from "@/lib/quizDocumentExport";
import { trpc } from "@/lib/trpc";
import { ROUTES } from "@/lib/routes";
import { parseStoredQuizResult } from "@/lib/quizResultUtils";
import { BarChart3, Check, CheckCircle2, ChevronDown, CircleAlert, CircleX, Clock3, Copy, Download, Flag, MessageCircle, RefreshCw, Share2, Target, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

const formatDuration = (seconds?: number) => {
  if (!seconds) return "Chưa ghi nhận";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes} phút ${remaining.toString().padStart(2, "0")} giây` : `${remaining} giây`;
};

export default function QuizResult() {
  const [, params] = useRoute(`${ROUTES.results}/:id`);
  const result = typeof window !== "undefined" ? parseStoredQuizResult(sessionStorage.getItem("dshare-quiz-result")) : null;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [discussion, setDiscussion] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const report = trpc.reports.submit.useMutation();
  const discussionMutation = trpc.discussion.create.useMutation();

  const reportQuestion = async (questionId: number) => {
    const details = window.prompt("Mô tả lỗi của câu hỏi (tối thiểu 10 ký tự):");
    if (!details?.trim()) return;
    try {
      await report.mutateAsync({ questionId, details });
      toast.success("Đã gửi báo lỗi", { description: "Admin sẽ duyệt báo cáo. XP bồi hoàn được cộng nếu báo cáo hợp lệ." });
    } catch {
      toast.error("Chưa thể gửi báo lỗi", { description: "Hãy đăng nhập và thử lại sau." });
    }
  };

  const postDiscussion = async () => {
    if (!discussion.trim()) return;
    try {
      await discussionMutation.mutateAsync({ quizId: Number(params?.id ?? 0), body: discussion.trim() });
      setDiscussion("");
      toast.success("Đã gửi thảo luận", { description: "Ý kiến của bạn đã được đăng trong không gian học tập." });
    } catch {
      toast.error("Chưa thể đăng thảo luận", { description: "Tính năng chỉ mở cho tài khoản đã hoàn thành bài ở hệ thống." });
    }
  };

  if (!result) {
    return <div className="min-h-screen bg-background"><SiteHeader /><main className="container grid min-h-[70vh] place-items-center"><div role="alert" className="text-center"><CircleAlert aria-hidden="true" className="mx-auto text-warning" size={30} /><h1 className="mt-4 font-serif text-3xl font-semibold text-foreground">Chưa có kết quả để hiển thị</h1><p className="mt-2 text-sm text-text-secondary">Hãy hoàn thành một bộ đề để xem phân tích chi tiết.</p><Button asChild className="mt-6 rounded-full"><Link href={ROUTES.explore}>Khám phá bộ đề</Link></Button></div></main></div>;
  }

  const correctCount = result.review.filter(item => item.isCorrect).length || result.correctCount;
  const questionCount = result.review.length || result.availablePoints;
  const incorrectCount = Math.max(0, questionCount - correctCount);
  const correctPercent = questionCount ? Math.round((correctCount / questionCount) * 100) : 0;
  const chartStyle = { background: `conic-gradient(var(--success) 0 ${correctPercent}%, var(--danger) ${correctPercent}% 100%)` };
  const shareText = `Tôi vừa hoàn thành “${result.quiz.title}” trên Dshare với ${result.scorePercent}/100 điểm (${correctCount}/${questionCount} câu đúng).`;
  const copyResultLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Đã sao chép kết quả", { description: "Bạn có thể dán nội dung vào mạng xã hội hoặc tin nhắn." });
    } catch {
      toast.error("Chưa thể sao chép kết quả", { description: "Hãy thử lại hoặc dùng nút chia sẻ khác." });
    }
  };
  const shareResult = async () => {
    const shareApi = navigator as Navigator & { share?: (data: { title: string; text: string; url: string }) => Promise<void> };
    if (shareApi.share) {
      try {
        await shareApi.share({ title: `Kết quả Quiz · ${result.quiz.title}`, text: shareText, url: window.location.href });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    await copyResultLink();
  };
  const openSocialShare = (channel: "facebook" | "zalo") => {
    const url = encodeURIComponent(window.location.href);
    const quote = encodeURIComponent(shareText);
    const destination = channel === "facebook" ? `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}` : `https://zalo.me/share?url=${url}`;
    window.open(destination, "_blank", "noopener,noreferrer");
  };
  const downloadResultPdf = async () => {
    setIsExporting(true);
    try {
      await exportQuizResultToPdf({ title: result.quiz.title, scorePercent: result.scorePercent, correctCount, incorrectCount, questionCount, durationSeconds: result.durationSeconds, passed: result.passed, review: result.review });
      toast.success("Đang tải báo cáo PDF", { description: "Báo cáo kết quả đã được tạo trên thiết bị của bạn." });
    } catch {
      toast.error("Chưa thể tạo báo cáo PDF", { description: "Hãy thử lại sau ít phút." });
    } finally {
      setIsExporting(false);
    }
  };

  return <div className="min-h-screen bg-background"><SiteHeader />
    <main className="container py-9 lg:py-12">
      <section className="overflow-hidden rounded-[var(--radius-xl-token)] bg-[linear-gradient(135deg,var(--primary)_0%,var(--accent)_100%)] p-7 text-primary-foreground shadow-[var(--shadow-md)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
          <div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full border-[9px] border-warning bg-white/8"><div className="text-center"><p className="font-serif text-[52px] font-semibold tracking-[-.07em]">{result.scorePercent}</p><p className="text-[10px] font-bold uppercase tracking-[.17em] text-warning">điểm</p></div></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-warning">Kết quả {result.passed ? "đạt mục tiêu" : "cần thêm một chút"}</p><h1 className="mt-3 font-serif text-[40px] font-semibold leading-[1.08] tracking-[-.05em]">{result.passed ? "Bạn đã hoàn thành rất tốt." : "Đây là một bước để hiểu sâu hơn."}</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/80">{result.quiz.title} · Đúng {correctCount}/{questionCount} câu. {result.passed ? `Bạn nhận được ${result.quiz.completionReward ?? 0} XP thưởng nếu đây là lượt kiểm tra hợp lệ.` : `Mốc đạt là ${result.quiz.passingScore} điểm. Hãy xem lại các câu cần ôn ngay bên dưới.`}</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild className="rounded-full bg-warning text-foreground hover:bg-warning/90"><Link href={`${ROUTES.quiz}/${params?.id ?? "101"}`}><RefreshCw size={15} /> Làm lại</Link></Button><Button asChild variant="outline" className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href={ROUTES.explore}>Bộ đề khác</Link></Button></div></div>
        </div>
      </section>

      <section aria-labelledby="quiz-summary-title" className="mt-7 rounded-[var(--radius-xl-token)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Tổng kết lượt làm</p><h2 id="quiz-summary-title" className="mt-2 font-serif text-[28px] font-semibold text-foreground">Bức tranh kết quả của bạn</h2></div><p className="text-xs text-text-secondary">Dữ liệu được tính từ lượt làm vừa hoàn thành.</p></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
          <div className="mx-auto grid size-44 place-items-center rounded-full p-4 shadow-[var(--shadow-sm)]" role="img" aria-label={`Tỷ lệ đúng ${correctPercent}%, ${correctCount} câu đúng và ${incorrectCount} câu cần ôn`} style={chartStyle}><div className="grid size-full place-items-center rounded-full bg-surface text-center"><p className="text-3xl font-bold text-foreground">{correctPercent}%</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.13em] text-text-secondary">Tỷ lệ đúng</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3"><SummaryStat icon={<CheckCircle2 className="text-success" size={20} />} label="Trả lời đúng" value={`${correctCount}/${questionCount}`} note="Câu đã nắm vững" /><SummaryStat icon={<CircleX className="text-danger" size={20} />} label="Cần ôn lại" value={`${incorrectCount} câu`} note="Xem lại lời giải" /><SummaryStat icon={<Clock3 className="text-primary" size={20} />} label="Thời gian làm" value={formatDuration(result.durationSeconds)} note={result.totalDurationSeconds ? `Tối đa ${formatDuration(result.totalDurationSeconds)}` : "Từ phiên làm bài"} /></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-border-light pt-5 text-xs font-semibold"><span className="flex items-center gap-2 text-success"><i className="size-2 rounded-full bg-success" />Đúng {correctCount}</span><span className="flex items-center gap-2 text-danger"><i className="size-2 rounded-full bg-danger" />Cần ôn {incorrectCount}</span><span className="flex items-center gap-2 text-text-secondary"><BarChart3 size={15} />Điểm {result.scorePercent}/100</span></div>
        <div className="mt-5 flex flex-wrap gap-2"><Button type="button" onClick={shareResult} className="rounded-full"><Share2 size={15} />Chia sẻ kết quả</Button><Button type="button" variant="outline" onClick={copyResultLink} className="rounded-full"><Copy size={15} />Sao chép</Button><Button type="button" variant="outline" onClick={downloadResultPdf} disabled={isExporting} aria-busy={isExporting} className="rounded-full"><Download size={15} />{isExporting ? "Đang tạo PDF…" : "Tải báo cáo PDF"}</Button><Button type="button" variant="ghost" onClick={() => openSocialShare("facebook")} className="rounded-full text-xs" aria-label="Chia sẻ kết quả lên Facebook"><span className="font-black">f</span> Facebook</Button><Button type="button" variant="ghost" onClick={() => openSocialShare("zalo")} className="rounded-full text-xs" aria-label="Chia sẻ kết quả qua Zalo"><span className="font-black">Z</span> Zalo</Button></div>
      </section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_.38fr]">
        <div className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Xem lại từng câu</p><h2 className="mt-2 font-serif text-[30px] font-semibold text-foreground">Phản hồi để tiến bộ</h2></div><p className="text-xs text-text-secondary">{correctCount} đúng · {incorrectCount} cần ôn</p></div>{result.review.length ? result.review.map((question, index) => <article key={question.questionId} className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-5"><button onClick={() => setExpanded(expanded === question.questionId ? null : question.questionId)} className="flex w-full items-start gap-4 text-left"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${question.isCorrect ? "bg-success/12 text-success" : "bg-danger/8 text-danger"}`}>{question.isCorrect ? <CheckCircle2 size={17} /> : <CircleX size={17} />}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-text-secondary">Câu {index + 1} · {question.isCorrect ? "Chính xác" : question.type === "essay" ? "Chờ đánh giá" : "Cần xem lại"}</p><h3 className="mt-2 font-serif text-[21px] font-semibold leading-tight text-foreground">{question.prompt}</h3></div><ChevronDown className={`mt-2 shrink-0 text-text-secondary transition-transform ${expanded === question.questionId ? "rotate-180" : ""}`} size={18} /></button>{expanded === question.questionId && <div className="ml-12 mt-5 border-t border-border-light pt-5"><ReviewAnswer question={question} /><div className="mt-4 rounded-[var(--radius-sm-token)] bg-warning/10 p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-warning">Giải thích</p><p className="mt-2 text-xs leading-6 text-text-secondary">{question.explanation || "Lời giải chi tiết sẽ được cập nhật bởi đội ngũ nội dung."}</p></div><QuizAIStudyAssistant question={question} /><Button onClick={() => reportQuestion(question.questionId)} disabled={report.isPending} variant="ghost" className="mt-2 h-9 rounded-full text-[11px] text-warning"><Flag size={13} /> Báo lỗi câu hỏi</Button></div>}</article>) : <div className="rounded-[var(--radius-lg-token)] border border-dashed border-border bg-surface p-7 text-center" role="status"><CircleAlert className="mx-auto text-warning" size={24} /><p className="mt-3 font-serif text-xl font-semibold text-foreground">Chưa có dữ liệu xem lại</p><p className="mt-2 text-sm leading-6 text-text-secondary">Kết quả này chưa kèm chi tiết từng câu. Bạn có thể làm lại bộ đề để nhận phản hồi đầy đủ.</p></div>}</div>
        <aside className="space-y-5"><div className="rounded-[var(--radius-lg-token)] bg-warning/10 p-6"><Trophy className="text-warning" size={22} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-warning">Đề xuất bước tiếp theo</p><h2 className="mt-2 font-serif text-[27px] font-semibold leading-tight text-foreground">{result.passed ? "Duy trì đà học của bạn." : "Làm lại các câu chưa đúng."}</h2><p className="mt-3 text-xs leading-5 text-text-secondary">Chế độ luyện tập phản hồi ngay sau mỗi câu, phù hợp để củng cố những điểm cần ôn.</p><Button asChild className="mt-5 w-full rounded-full"><Link href={`/quiz/${params?.id ?? "101"}`}><Target size={15} /> Vào chế độ luyện tập</Link></Button></div><div className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-6"><MessageCircle className="text-primary" size={21} /><h2 className="mt-4 font-serif text-[25px] font-semibold text-foreground">Thảo luận sau bài</h2><p className="mt-2 text-xs leading-5 text-text-secondary">Bạn đã hoàn thành bài, vì vậy khu vực trao đổi đã được mở.</p><textarea value={discussion} onChange={event => setDiscussion(event.target.value)} placeholder="Chia sẻ cách bạn suy luận..." className="field mt-4 min-h-24 resize-none text-xs" /><Button onClick={postDiscussion} disabled={discussionMutation.isPending} className="mt-3 w-full rounded-full text-xs">Đăng thảo luận</Button></div></aside>
      </section>
    </main>
  </div>;
}

function SummaryStat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="rounded-[var(--radius-md-token)] bg-muted p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-text-secondary">{label}</p>{icon}</div><p className="mt-5 text-xl font-bold text-foreground">{value}</p><p className="mt-1 text-[11px] text-text-secondary">{note}</p></div>;
}

function StatementReviewTable({ statements, selected }: { statements: Array<{ id: string; text: string; correct: boolean }>; selected: Record<string, boolean> }) { return <div className="overflow-hidden rounded-[var(--radius-sm-token)] border border-border"><div className="grid grid-cols-[minmax(0,1fr)_74px_84px] bg-muted px-3 py-2 text-[9px] font-bold uppercase tracking-[.12em] text-text-secondary"><span>Nhận định</span><span className="text-center">Bạn chọn</span><span className="text-center">Đáp án</span></div>{statements.map((statement, index) => { const chosen = selected[statement.id]; const right = chosen === statement.correct; return <div key={statement.id} className={`grid grid-cols-[minmax(0,1fr)_74px_84px] items-center gap-2 border-t border-border-light px-3 py-2.5 text-xs ${right ? "bg-success/8" : "bg-danger/5"}`}><p className="leading-5 text-foreground"><span className="mr-1.5 text-text-secondary">{index + 1}.</span>{statement.text}</p><span className={`mx-auto rounded-full px-2 py-1 font-bold ${chosen === undefined ? "bg-muted text-text-secondary" : chosen ? "bg-success/12 text-success" : "bg-danger/8 text-danger"}`}>{chosen === undefined ? "—" : chosen ? "Có" : "Không"}</span><span className="mx-auto flex items-center gap-1 font-bold text-foreground">{right ? <Check size={13} className="text-success" /> : <CircleX size={13} className="text-danger" />}{statement.correct ? "Có" : "Không"}</span></div>; })}</div>; }

type ReviewQuestion = { type?: string; options: Array<{ id: number; body: string }>; correctOptionIds: number[]; selectedOptionIds: number[]; statements?: Array<{ id: string; text: string; correct: boolean }>; selectedStatementAnswers?: Record<string, boolean>; matchingPairs?: Array<{ left: string; right: string }>; selectedMatchingAnswers?: Record<string, string>; selectedTextAnswer?: string; acceptedAnswers?: string[]; sampleOutline?: string };
function ReviewAnswer({ question }: { question: ReviewQuestion }) { if (question.type === "true_false_statements") return <StatementReviewTable statements={question.statements ?? []} selected={question.selectedStatementAnswers ?? {}} />; if (question.type === "matching") return <MatchingReviewTable pairs={question.matchingPairs ?? []} selected={question.selectedMatchingAnswers ?? {}} />; if (question.type === "fill_blank") return <TextAnswerReview value={question.selectedTextAnswer ?? ""} acceptedAnswers={question.acceptedAnswers ?? []} />; if (question.type === "essay") return <EssayReview value={question.selectedTextAnswer ?? ""} sampleOutline={question.sampleOutline ?? ""} />; return <div className="space-y-2">{question.options.map(option => { const isCorrect = question.correctOptionIds.includes(option.id); const chosen = question.selectedOptionIds.includes(option.id); return <div key={option.id} className={`flex gap-3 rounded-[var(--radius-sm-token)] px-3 py-2.5 text-xs leading-5 ${isCorrect ? "bg-success/12 text-foreground" : chosen ? "bg-danger/8 text-danger" : "bg-muted text-text-secondary"}`}><span className="mt-0.5">{isCorrect ? <Check size={14} /> : chosen ? <CircleX size={14} /> : "·"}</span><span>{option.body}</span></div>; })}</div>; }
function MatchingReviewTable({ pairs, selected }: { pairs: Array<{ left: string; right: string }>; selected: Record<string, string> }) { return <div className="overflow-hidden rounded-[var(--radius-sm-token)] border border-border"><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] gap-3 bg-muted px-3 py-2 text-[9px] font-bold uppercase tracking-[.12em] text-text-secondary"><span>Vế trái</span><span>Ghép của bạn · Đáp án</span><span /></div>{pairs.map((pair, index) => { const chosen = selected[String(index)] ?? "Chưa chọn"; const right = chosen === pair.right; return <div key={`${pair.left}-${index}`} className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] items-center gap-3 border-t border-border-light px-3 py-3 text-xs ${right ? "bg-success/8" : "bg-danger/5"}`}><span className="font-medium leading-5 text-foreground">{pair.left}</span><span className="leading-5"><span className={right ? "text-success" : "text-danger"}>{chosen}</span>{!right && <span className="mt-1 block text-text-secondary">Đáp án: {pair.right}</span>}</span>{right ? <Check size={15} className="text-success" /> : <CircleX size={15} className="text-danger" />}</div>; })}</div>; }
function TextAnswerReview({ value, acceptedAnswers }: { value: string; acceptedAnswers: string[] }) { return <div className="rounded-[var(--radius-sm-token)] border border-border bg-muted/60 p-4 text-xs"><p className="font-bold text-foreground">Câu trả lời của bạn</p><p className="mt-2 rounded-md bg-surface px-3 py-2 text-text-secondary">{value || "Bạn chưa nhập câu trả lời."}</p><p className="mt-4 font-bold text-foreground">Đáp án chấp nhận</p><p className="mt-2 text-text-secondary">{acceptedAnswers.length ? acceptedAnswers.join(" · ") : "Không có đáp án đã cấu hình."}</p></div>; }
function EssayReview({ value, sampleOutline }: { value: string; sampleOutline: string }) { return <div className="rounded-[var(--radius-sm-token)] border border-primary/20 bg-primary/5 p-4 text-xs"><p className="font-bold text-primary">Bài tự luận đang chờ đánh giá</p><p className="mt-2 leading-6 text-text-secondary">Câu trả lời đã được lưu, nhưng không được tự động chấm điểm.</p><p className="mt-3 rounded-md bg-surface px-3 py-2 leading-6 text-foreground">{value || "Bạn chưa nhập câu trả lời."}</p>{sampleOutline && <><p className="mt-4 font-bold text-foreground">Gợi ý nội dung</p><p className="mt-2 leading-6 text-text-secondary">{sampleOutline}</p></>}</div>; }
