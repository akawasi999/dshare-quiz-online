import QuizSecurityGuard from "@/components/QuizSecurityGuard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { demoQuizQuestions } from "@/data/demoQuiz";
import { showcaseQuizzes } from "@/data/demo";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronLeft, CircleHelp, Clock3, Flag, Loader2, LockKeyhole, Maximize, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type ActiveQuestion = { id: number; prompt: string; type: string; difficulty: string; tags: string[]; explanation?: string | null; options: { id: number; body: string }[]; correctOptionIds?: number[] };

export default function QuizRunner() {
  const [, params] = useRoute("/quiz/:id");
  const quizId = Number(params?.id ?? 101);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const fallback = showcaseQuizzes.find(quiz => quiz.id === quizId) ?? showcaseQuizzes[0];
  const start = trpc.quiz.start.useMutation();
  const saveAnswer = trpc.quiz.saveAnswer.useMutation();
  const submit = trpc.quiz.submit.useMutation();
  const security = trpc.quiz.securityEvent.useMutation();
  const [phase, setPhase] = useState<"ready" | "active">("ready");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ActiveQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(fallback.questionCount ? 25 * 60 : 900);
  const current = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(value => value.length).length;
  const isMultiple = current?.type === "multiple";

  const onSecurityEvent = useCallback((eventType: "copy" | "paste" | "context_menu" | "tab_hidden" | "fullscreen_exit") => {
    if (attemptId && attemptId > 0) security.mutate({ attemptId, eventType });
    toast.warning("Phiên làm bài đang được bảo vệ", { description: "Hành động này đã bị hạn chế và được ghi nhận trong lượt làm bài." });
  }, [attemptId, security]);

  const launchDemo = () => {
    const shuffled = [...demoQuizQuestions].sort(() => Math.random() - .5).map(question => ({ ...question, options: [...question.options].sort(() => Math.random() - .5) }));
    setQuestions(shuffled); setAttemptId(-Date.now()); setPhase("active"); setTimeLeft(25 * 60); setAnswers({}); setCurrentIndex(0);
  };
  const begin = async () => {
    if (!user) { startLogin(); return; }
    try {
      const response = await start.mutateAsync({ quizId });
      setAttemptId(response.attemptId); setQuestions(response.questions); setPhase("active"); setTimeLeft(response.quiz.durationSeconds); setAnswers({}); setCurrentIndex(0);
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    } catch (error) {
      toast.info("Bắt đầu với trải nghiệm minh họa", { description: "Bộ đề này đang chờ được phát hành trong ngân hàng dữ liệu." });
      launchDemo();
    }
  };
  const persist = (questionId: number, selectedOptionIds: number[]) => {
    setAnswers(value => ({ ...value, [questionId]: selectedOptionIds }));
    if (attemptId && attemptId > 0) saveAnswer.mutate({ attemptId, questionId, selectedOptionIds });
  };
  const choose = (optionId: number) => {
    if (!current) return;
    const previous = answers[current.id] ?? [];
    persist(current.id, isMultiple ? (previous.includes(optionId) ? previous.filter(id => id !== optionId) : [...previous, optionId]) : [optionId]);
  };
  const finish = async () => {
    if (!attemptId) return;
    try {
      let payload: unknown;
      if (attemptId > 0) payload = await submit.mutateAsync({ attemptId });
      else {
        const review = questions.map(question => ({ questionId: question.id, prompt: question.prompt, explanation: question.explanation, options: question.options, selectedOptionIds: answers[question.id] ?? [], correctOptionIds: question.correctOptionIds ?? [], isCorrect: JSON.stringify([...(answers[question.id] ?? [])].sort()) === JSON.stringify([...(question.correctOptionIds ?? [])].sort()) }));
        const correctCount = review.filter(question => question.isCorrect).length;
        payload = { scorePercent: Math.round((correctCount / questions.length) * 100), correctCount, availablePoints: questions.length, earnedPoints: correctCount, passed: correctCount / questions.length >= .7, quiz: { title: fallback.title, completionReward: fallback.reward, passingScore: 70 }, review };
      }
      sessionStorage.setItem("dshare-quiz-result", JSON.stringify(payload));
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
      setLocation(`/ket-qua/${quizId}`);
    } catch (error) { toast.error("Chưa thể nộp bài", { description: "Vui lòng kiểm tra kết nối và thử lại." }); }
  };
  useEffect(() => { if (phase !== "active") return; if (timeLeft <= 0) { finish(); return; } const timer = window.setInterval(() => setTimeLeft(value => value - 1), 1000); return () => window.clearInterval(timer); }, [phase, timeLeft]);
  const formattedTime = `${Math.floor(timeLeft / 60).toString().padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`;

  if (phase === "ready") return <div className="min-h-screen bg-[#fff7e6]"><SiteHeader /><main className="container py-10 lg:py-16"><Link href="/kham-pha" className="inline-flex items-center gap-2 text-xs font-bold text-[#617786]"><ArrowLeft size={15} /> Trở về thư viện</Link><section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.65fr]"><div className="rounded-[30px] bg-[#172554] p-7 text-white sm:p-10"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#fbbf24]">{fallback.category} · {fallback.subject} · {fallback.lesson}</p><h1 className="mt-4 max-w-2xl font-serif text-[43px] font-semibold leading-[1.05] tracking-[-.05em] sm:text-[57px]">{fallback.title}</h1><p className="mt-6 max-w-xl text-sm leading-6 text-[#eef4ff]">{fallback.summary}</p><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Câu hỏi" value={`${fallback.questionCount}`} /><Stat label="Thời gian" value={fallback.duration} /><Stat label="Ngưỡng đạt" value="70 điểm" /><Stat label="Chế độ" value={fallback.mode} /></div></div><aside className="rounded-[30px] border border-[#172554]/10 bg-white p-7"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#f59e0b]">Xác nhận trước khi bắt đầu</p><h2 className="mt-3 font-serif text-[29px] font-semibold leading-tight text-[#172554]">Một lượt làm bài tập trung.</h2><div className="mt-6 space-y-4 text-xs leading-5 text-[#617786]"><p className="flex gap-3"><ShieldCheck className="shrink-0 text-[#617786]" size={18} />Thứ tự câu hỏi và đáp án được xáo trộn theo từng lượt làm.</p><p className="flex gap-3"><LockKeyhole className="shrink-0 text-[#f59e0b]" size={18} />Chức năng copy, paste và menu chuột phải bị hạn chế trong phiên kiểm tra.</p><p className="flex gap-3"><Clock3 className="shrink-0 text-[#617786]" size={18} />Bài sẽ tự động nộp khi đồng hồ về 00:00.</p></div>{fallback.mode === "Kiểm tra" && <div className="mt-6 rounded-2xl bg-[#fff7e6] p-4 text-xs leading-5 text-[#d97706]"><Sparkles className="mb-2" size={16} />Lệ phí: <strong>{fallback.points} Point</strong>. Đạt từ 70 điểm để nhận <strong>{fallback.reward} Point</strong> thưởng.</div>}<Button onClick={begin} disabled={start.isPending} aria-busy={start.isPending} className="mt-7 h-12 w-full rounded-full bg-[#f59e0b] text-xs font-bold hover:bg-[#d97706]">{start.isPending ? <Loader2 className="animate-spin" size={16} /> : "Bắt đầu làm bài"}</Button><p className="mt-3 text-center text-[10px] text-[#617786]">Bằng việc bắt đầu, bạn đồng ý duy trì một phiên làm bài trung thực.</p></aside></section></main></div>;
  if (!current) return <div className="min-h-screen bg-[#fff7e6]"><SiteHeader /><main className="container grid min-h-[70vh] place-items-center"><div className="max-w-md text-center" role="alert"><AlertTriangle className="mx-auto text-[#f59e0b]" size={30} /><h1 className="mt-4 font-serif text-3xl font-semibold text-[#172554]">Phiên làm bài chưa sẵn sàng</h1><p className="mt-3 text-sm leading-6 text-[#617786]">Không tải được câu hỏi cho phiên này. Hãy quay lại thư viện và thử bắt đầu một bộ đề khác.</p><Button asChild className="mt-6 rounded-full bg-[#172554]"><Link href="/kham-pha">Quay lại thư viện</Link></Button></div></main></div>;
  return <div className="min-h-screen bg-[#fff7e6] select-none"><QuizSecurityGuard active={phase === "active"} onEvent={onSecurityEvent} /><header className="border-b border-[#172554]/10 bg-[#fff7e6]"><div className="container flex h-[72px] items-center justify-between gap-4"><Link href="/kham-pha" className="flex items-center gap-2 text-xs font-bold text-[#617786]"><ChevronLeft size={17} /> Thoát bài</Link><div className="hidden min-w-0 text-center sm:block"><p className="truncate text-xs font-bold text-[#172554]">{fallback.title}</p><p className="mt-1 text-[10px] text-[#617786]">Câu {currentIndex + 1} / {questions.length}</p></div><div className="flex items-center gap-3 rounded-full bg-[#172554] px-4 py-2 text-[#fff7e6]"><Clock3 size={15} /><span className="font-mono text-sm font-medium">{formattedTime}</span></div></div></header><main className="container py-7 lg:py-9"><div className="grid gap-6 lg:grid-cols-[1fr_260px]"><section className="rounded-[28px] border border-[#172554]/10 bg-white p-5 shadow-sm sm:p-8"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#617786]">{current?.difficulty}</span><button onClick={() => toast.info("Báo lỗi câu hỏi", { description: "Sau khi hoàn thành bài, bạn có thể gửi báo cáo để admin duyệt và nhận Point bồi hoàn nếu hợp lệ." })} className="flex items-center gap-1 text-[11px] font-semibold text-[#f59e0b]"><Flag size={13} /> Báo lỗi</button></div><p className="mt-7 font-serif text-[28px] font-semibold leading-[1.28] tracking-[-.025em] text-[#172554] sm:text-[34px]">{current?.prompt}</p><p className="mt-3 text-[11px] font-medium text-[#617786]">{current?.tags.map(tag => `#${tag}`).join(" · ")}</p><div className="mt-8 space-y-3">{current?.options.map((option, index) => { const selected = (answers[current.id] ?? []).includes(option.id); return <button key={option.id} onClick={() => choose(option.id)} className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all", selected ? "border-[#f59e0b] bg-[#fff7e6] shadow-sm" : "border-[#172554]/10 bg-[#fff7e6] hover:border-[#f59e0b]/55 hover:bg-[#fff7e6]")}><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold", selected ? "border-[#f59e0b] bg-[#f59e0b] text-white" : "border-[#eef4ff] text-[#617786]")}>{selected ? <Check size={15} /> : String.fromCharCode(65 + index)}</span><span className="text-sm font-medium leading-6 text-[#172554]">{option.body}</span></button>; })}</div><div className="mt-8 flex justify-between border-t border-[#172554]/10 pt-5"><Button variant="ghost" disabled={currentIndex === 0} onClick={() => setCurrentIndex(index => index - 1)} className="rounded-full text-xs"><ArrowLeft size={15} /> Quay lại</Button>{currentIndex < questions.length - 1 ? <Button onClick={() => setCurrentIndex(index => index + 1)} className="rounded-full bg-[#172554] text-xs">Câu tiếp theo <ArrowRight size={15} /></Button> : <Button onClick={finish} disabled={submit.isPending} className="rounded-full bg-[#f59e0b] text-xs">Nộp bài <Check size={15} /></Button>}</div></section><aside className="h-fit rounded-[25px] border border-[#172554]/10 bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#f59e0b]">Tiến độ làm bài</p><div className="mt-4 flex items-end justify-between"><p className="font-serif text-[32px] font-semibold text-[#172554]">{answeredCount}<span className="text-sm text-[#617786]">/{questions.length}</span></p><p className="text-[11px] text-[#617786]">đã chọn đáp án</p></div><div className="mt-5 grid grid-cols-5 gap-2">{questions.map((question, index) => <button onClick={() => setCurrentIndex(index)} key={question.id} className={cn("grid aspect-square place-items-center rounded-lg text-xs font-bold", index === currentIndex ? "bg-[#172554] text-white" : answers[question.id]?.length ? "bg-[#fbbf24] text-[#d97706]" : "bg-[#eef4ff] text-[#617786]")}>{index + 1}</button>)}</div><div className="mt-6 rounded-2xl bg-[#eef4ff] p-4"><Maximize size={16} className="text-[#617786]" /><p className="mt-3 text-xs font-bold text-[#617786]">Phiên làm bài tập trung</p><p className="mt-1 text-[10px] leading-5 text-[#617786]">Tốt nhất hãy giữ nguyên màn hình trong suốt thời gian làm bài.</p></div><Button onClick={finish} variant="outline" className="mt-4 w-full rounded-full text-xs">Nộp bài sớm</Button></aside></div></main></div>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white/[.07] p-3"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#617786]">{label}</p><p className="mt-2 text-sm font-bold text-[#fff7e6]">{value}</p></div>; }
