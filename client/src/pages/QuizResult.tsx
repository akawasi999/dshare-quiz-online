import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { QuizAIStudyAssistant } from "@/components/QuizAIStudyAssistant";
import { trpc } from "@/lib/trpc";
import { Check, CheckCircle2, ChevronDown, CircleAlert, CircleX, Flag, MessageCircle, RefreshCw, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useRoute } from "wouter";

type ResultPayload = { scorePercent: number; correctCount: number; availablePoints: number; earnedPoints: number; passed: boolean; quiz: { title: string; completionReward?: number; passingScore: number }; review: Array<{ questionId: number; prompt: string; explanation?: string | null; selectedOptionIds: number[]; correctOptionIds: number[]; isCorrect: boolean; options: { id: number; body: string }[] }> };

export default function QuizResult() {
  const [, params] = useRoute("/ket-qua/:id");
  const result = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("dshare-quiz-result") ?? "null") as ResultPayload | null : null;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [discussion, setDiscussion] = useState("");
  const report = trpc.reports.submit.useMutation();
  const discussionMutation = trpc.discussion.create.useMutation();
  const reportQuestion = async (questionId: number) => {
    const details = window.prompt("Mô tả lỗi của câu hỏi (tối thiểu 10 ký tự):");
    if (!details?.trim()) return;
    try {
      await report.mutateAsync({ questionId, details });
      toast.success("Đã gửi báo lỗi", { description: "Admin sẽ duyệt báo cáo. Point bồi hoàn được cộng nếu báo cáo hợp lệ." });
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
  if (!result) return <div className="min-h-screen bg-[#fffdf8]"><SiteHeader /><main className="container grid min-h-[70vh] place-items-center"><div className="text-center"><CircleAlert className="mx-auto text-[#bd9144]" size={30} /><h1 className="mt-4 font-serif text-3xl font-semibold text-[#173a51]">Chưa có kết quả để hiển thị</h1><p className="mt-2 text-sm text-[#6e7d84]">Hãy hoàn thành một bộ đề để xem phân tích chi tiết.</p><Button asChild className="mt-6 rounded-full bg-[#173a51]"><Link href="/kham-pha">Khám phá bộ đề</Link></Button></div></main></div>;
  return <div className="min-h-screen bg-[#f5f5ef]"><SiteHeader />
    <main className="container py-9 lg:py-12"><section className={`overflow-hidden rounded-[32px] p-7 text-white sm:p-10 ${result.passed ? "bg-[#173a51]" : "bg-[#5f4b46]"}`}><div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full border-[9px] border-[#e5c981] bg-white/8"><div className="text-center"><p className="font-serif text-[52px] font-semibold tracking-[-.07em]">{result.scorePercent}</p><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#e5c981]">điểm</p></div></div><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#e5c981]">Kết quả {result.passed ? "đạt mục tiêu" : "cần thêm một chút"}</p><h1 className="mt-3 font-serif text-[40px] font-semibold leading-[1.08] tracking-[-.05em]">{result.passed ? "Bạn đã hoàn thành rất tốt." : "Đây là một bước để hiểu sâu hơn."}</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#d0dbdb]">{result.quiz.title} · Đúng {result.correctCount}/{result.availablePoints} câu. {result.passed ? `Bạn nhận được ${result.quiz.completionReward ?? 0} Point thưởng nếu đây là lượt kiểm tra hợp lệ.` : `Mốc đạt là ${result.quiz.passingScore} điểm. Hãy xem lại các câu cần ôn ngay bên dưới.`}</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild className="rounded-full bg-[#e4c378] text-[#173a51] hover:bg-[#f0d48f]"><Link href={`/quiz/${params?.id ?? "101"}`}><RefreshCw size={15} /> Làm lại</Link></Button><Button asChild variant="outline" className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/kham-pha">Bộ đề khác</Link></Button></div></div></div></section>
      <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_.38fr]"><div className="space-y-4"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9d7c40]">Xem lại từng câu</p><h2 className="mt-2 font-serif text-[30px] font-semibold text-[#173a51]">Phản hồi để tiến bộ</h2></div><p className="text-xs text-[#718088]">{result.review.filter(item => item.isCorrect).length} đúng · {result.review.filter(item => !item.isCorrect).length} cần ôn</p></div>{result.review.map((question, index) => <article key={question.questionId} className="rounded-[22px] border border-[#17334a]/9 bg-white p-5"><button onClick={() => setExpanded(expanded === question.questionId ? null : question.questionId)} className="flex w-full items-start gap-4 text-left"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${question.isCorrect ? "bg-[#e6efe3] text-[#537752]" : "bg-[#f5e5df] text-[#af5d50]"}`}>{question.isCorrect ? <CheckCircle2 size={17} /> : <CircleX size={17} />}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#8e967f]">Câu {index + 1} · {question.isCorrect ? "Chính xác" : "Cần xem lại"}</p><h3 className="mt-2 font-serif text-[21px] font-semibold leading-tight text-[#23465b]">{question.prompt}</h3></div><ChevronDown className={`mt-2 shrink-0 text-[#7e8c90] transition-transform ${expanded === question.questionId ? "rotate-180" : ""}`} size={18} /></button>{expanded === question.questionId && <div className="ml-12 mt-5 border-t border-[#17334a]/8 pt-5"><div className="space-y-2">{question.options.map(option => { const isCorrect = question.correctOptionIds.includes(option.id); const chosen = question.selectedOptionIds.includes(option.id); return <div key={option.id} className={`flex gap-3 rounded-xl px-3 py-2.5 text-xs leading-5 ${isCorrect ? "bg-[#e8f0e6] text-[#476849]" : chosen ? "bg-[#f7e6df] text-[#9d5348]" : "bg-[#f5f6f2] text-[#718088]"}`}><span className="mt-0.5">{isCorrect ? <Check size={14} /> : chosen ? <CircleX size={14} /> : "·"}</span><span>{option.body}</span></div>; })}</div><div className="mt-4 rounded-xl bg-[#f5f1e6] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#947333]">Giải thích</p><p className="mt-2 text-xs leading-6 text-[#5c625b]">{question.explanation || "Lời giải chi tiết sẽ được cập nhật bởi đội ngũ nội dung."}</p></div><QuizAIStudyAssistant question={question} /><Button onClick={() => reportQuestion(question.questionId)} disabled={report.isPending} variant="ghost" className="mt-2 h-9 rounded-full text-[11px] text-[#8e7444]"><Flag size={13} /> Báo lỗi câu hỏi</Button></div>}</article>)}</div>
        <aside className="space-y-5"><div className="rounded-[24px] bg-[#e9ddbd] p-6"><Trophy className="text-[#987432]" size={22} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#8d6d2e]">Đề xuất bước tiếp theo</p><h2 className="mt-2 font-serif text-[27px] font-semibold leading-tight text-[#173a51]">{result.passed ? "Duy trì đà học của bạn." : "Làm lại các câu chưa đúng."}</h2><p className="mt-3 text-xs leading-5 text-[#62665e]">Chế độ luyện tập phản hồi ngay sau mỗi câu, phù hợp để củng cố những điểm cần ôn.</p><Button asChild className="mt-5 w-full rounded-full bg-[#173a51]"><Link href={`/quiz/${params?.id ?? "101"}`}>Vào chế độ luyện tập</Link></Button></div><div className="rounded-[24px] border border-[#17334a]/9 bg-white p-6"><MessageCircle className="text-[#60808b]" size={21} /><h2 className="mt-4 font-serif text-[25px] font-semibold text-[#173a51]">Thảo luận sau bài</h2><p className="mt-2 text-xs leading-5 text-[#738087]">Bạn đã hoàn thành bài, vì vậy khu vực trao đổi đã được mở.</p><textarea value={discussion} onChange={event => setDiscussion(event.target.value)} placeholder="Chia sẻ cách bạn suy luận..." className="mt-4 min-h-24 w-full resize-none rounded-xl border border-[#17334a]/10 bg-[#f7f7f3] p-3 text-xs outline-none focus:border-[#b88f44]" /><Button onClick={postDiscussion} disabled={discussionMutation.isPending} className="mt-3 w-full rounded-full bg-[#173a51] text-xs">Đăng thảo luận</Button></div></aside></section>
    </main>
  </div>;
}
