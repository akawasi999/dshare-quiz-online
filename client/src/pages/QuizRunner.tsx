import QuizSecurityGuard from "@/components/QuizSecurityGuard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { demoQuizQuestions } from "@/data/demoQuiz";
import { showcaseQuizzes } from "@/data/demo";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronLeft,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock3,
  Flag,
  Loader2,
  ListChecks,
  ListTodo,
  Maximize,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type ActiveQuestion = {
  id: number;
  prompt: string;
  type: string;
  difficulty: string;
  tags: string[];
  explanation?: string | null;
  imageUrl?: string | null;
  options: { id: number; body: string }[];
  correctOptionIds?: number[];
  statements?: Array<{ id: string; text: string; correct?: boolean }>;
  media?: { url: string; kind: "audio" | "video"; fileName: string } | null;
};
type SandboxPreview = {
  title: string;
  summary: string;
  durationSeconds: number;
  questions: ActiveQuestion[];
};
type AnswerFeedback = {
  questionId: number;
  status: "correct" | "incorrect" | "saved";
} | null;

export default function QuizRunner() {
  const [, params] = useRoute("/quiz/:id");
  const quizId = Number(params?.id ?? 101);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isSandbox =
    new URLSearchParams(window.location.search).get("sandbox") === "1";
  const sandboxPreview = useMemo<SandboxPreview | null>(() => {
    try {
      const raw = isSandbox
        ? sessionStorage.getItem("dshare-quiz-preview")
        : null;
      return raw ? (JSON.parse(raw) as SandboxPreview) : null;
    } catch {
      return null;
    }
  }, [isSandbox]);
  const detail = trpc.catalog.detail.useQuery(
    { quizId },
    { enabled: !isSandbox && Number.isInteger(quizId) && quizId > 0 }
  );
  const demoFallback =
    showcaseQuizzes.find(quiz => quiz.id === quizId) ?? showcaseQuizzes[0];
  const fallback = useMemo(
    () =>
      isSandbox && sandboxPreview
        ? {
            id: 0,
            title: sandboxPreview.title,
            category: "Studio",
            subject: "Xem trước",
            lesson: "Sandbox",
            topicPath: "Studio › Sandbox",
            rootTopicId: null,
            rootTopicTitle: null,
            summary:
              sandboxPreview.summary ||
              "Bạn đang xem trước Quiz trong môi trường Sandbox.",
            mode: "Ôn tập" as const,
            difficulty: "Tùy chỉnh",
            duration: `${Math.ceil(sandboxPreview.durationSeconds / 60)} phút`,
            questionCount: sandboxPreview.questions.length,
            points: 0,
            reward: 0,
          }
        : detail.data
          ? {
              id: detail.data.quiz.id,
              title: detail.data.quiz.title,
              category: detail.data.topic?.name ?? detail.data.category?.title ?? "Chưa phân loại",
              subject: detail.data.subject?.title ?? "",
              lesson: detail.data.lesson?.title ?? "",
              topicPath:
                detail.data.topicPath ??
                [
                  detail.data.category?.title,
                  detail.data.subject?.title,
                  detail.data.lesson?.title,
                ]
                  .filter(Boolean)
                  .join(" › "),
              rootTopicId: detail.data.rootTopicId,
              rootTopicTitle: detail.data.rootTopicTitle,
              summary:
                detail.data.quiz.summary ??
                "Bộ đề đã được biên soạn trong Dshare.",
              mode:
                detail.data.quiz.mode === "testing"
                  ? ("Kiểm tra" as const)
                  : ("Ôn tập" as const),
              difficulty: {
                easy: "Dễ",
                medium: "Trung bình",
                hard: "Nâng cao",
              }[detail.data.quiz.difficulty],
              duration: `${Math.ceil(detail.data.quiz.durationSeconds / 60)} phút`,
              questionCount: detail.data.quiz.questionCount,
              points: detail.data.quiz.entryPointCost,
              reward: detail.data.quiz.completionReward,
            }
          : demoFallback,
    [detail.data, demoFallback, isSandbox, sandboxPreview]
  );
  const topicPath =
    "topicPath" in fallback && fallback.topicPath
      ? fallback.topicPath
      : [fallback.category, fallback.subject, fallback.lesson]
          .filter(Boolean)
          .join(" › ");
  const start = trpc.quiz.start.useMutation();
  const saveAnswer = trpc.quiz.saveAnswer.useMutation();
  const submit = trpc.quiz.submit.useMutation();
  const security = trpc.quiz.securityEvent.useMutation();
  const [phase, setPhase] = useState<"ready" | "active">("ready");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ActiveQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [statementAnswers, setStatementAnswers] = useState<
    Record<number, Record<string, boolean>>
  >({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900);
  const [totalDuration, setTotalDuration] = useState(900);
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const current = questions[currentIndex];
  const hasAnswer = (question: ActiveQuestion) =>
    question.type === "true_false_statements"
      ? Object.keys(statementAnswers[question.id] ?? {}).length ===
          (question.statements?.length ?? 0) &&
        (question.statements?.length ?? 0) > 0
      : Boolean(answers[question.id]?.length);
  const answeredCount = questions.filter(hasAnswer).length;
  const progressPercent = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;
  const isMultiple = current?.type === "multiple";
  const isLocalPreview = Boolean(attemptId && attemptId < 0);
  const onSecurityEvent = useCallback(
    (
      eventType:
        | "copy"
        | "paste"
        | "context_menu"
        | "tab_hidden"
        | "fullscreen_exit"
    ) => {
      if (attemptId && attemptId > 0) security.mutate({ attemptId, eventType });
      toast.warning("Phiên làm bài đang được bảo vệ", {
        description:
          "Hành động này đã bị hạn chế và được ghi nhận trong lượt làm bài.",
      });
    },
    [attemptId, security]
  );
  const resetSession = (
    nextQuestions: ActiveQuestion[],
    nextAttempt: number,
    seconds: number
  ) => {
    setQuestions(nextQuestions);
    setAttemptId(nextAttempt);
    setPhase("active");
    setTimeLeft(seconds);
    setTotalDuration(seconds);
    setAnswers({});
    setStatementAnswers({});
    setFeedback(null);
    setCurrentIndex(0);
  };
  const launchDemo = () =>
    resetSession(
      [...demoQuizQuestions]
        .sort(() => Math.random() - 0.5)
        .map(question => ({
          ...question,
          options: [...question.options].sort(() => Math.random() - 0.5),
        })),
      -Date.now(),
      25 * 60
    );
  const begin = async () => {
    if (isSandbox && sandboxPreview) {
      resetSession(
        sandboxPreview.questions,
        -Date.now(),
        sandboxPreview.durationSeconds
      );
      toast.info("Đang xem trước Sandbox", {
        description: "Kết quả không được lưu vào lịch sử hoặc thống kê.",
      });
      return;
    }
    if (!user) {
      startLogin();
      return;
    }
    try {
      const response = await start.mutateAsync({ quizId });
      resetSession(
        response.questions,
        response.attemptId,
        response.quiz.durationSeconds
      );
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    } catch {
      toast.info("Bắt đầu với trải nghiệm minh họa", {
        description:
          "Bộ đề này đang chờ được phát hành trong ngân hàng dữ liệu.",
      });
      launchDemo();
    }
  };
  const applyAnswer = (questionId: number, selectedOptionIds: number[]) => {
    setAnswers(value => ({ ...value, [questionId]: selectedOptionIds }));
    if (attemptId && attemptId > 0)
      saveAnswer.mutate({ attemptId, questionId, selectedOptionIds });
  };
  const choose = (optionId: number) => {
    if (!current) return;
    const previous = answers[current.id] ?? [];
    const next = isMultiple
      ? previous.includes(optionId)
        ? previous.filter(id => id !== optionId)
        : [...previous, optionId]
      : [optionId];
    applyAnswer(current.id, next);
    const correct = current.correctOptionIds ?? [];
    const reveal = isLocalPreview && correct.length > 0;
    const isCorrect =
      reveal &&
      next.length === correct.length &&
      next.every(id => correct.includes(id));
    setFeedback({
      questionId: current.id,
      status: reveal ? (isCorrect ? "correct" : "incorrect") : "saved",
    });
  };
  const chooseStatement = (statementId: string, value: boolean) => {
    if (!current) return;
    const next = {
      ...(statementAnswers[current.id] ?? {}),
      [statementId]: value,
    };
    setStatementAnswers(values => ({ ...values, [current.id]: next }));
    if (attemptId && attemptId > 0)
      saveAnswer.mutate({
        attemptId,
        questionId: current.id,
        selectedOptionIds: [],
        answerPayload: { statementAnswers: next },
      });
    const complete =
      Object.keys(next).length === (current.statements?.length ?? 0);
    const expected = Object.fromEntries(
      (current.statements ?? []).map(statement => [
        statement.id,
        statement.correct,
      ])
    );
    const isCorrect =
      complete && Object.keys(expected).every(id => next[id] === expected[id]);
    setFeedback({
      questionId: current.id,
      status:
        isLocalPreview && complete
          ? isCorrect
            ? "correct"
            : "incorrect"
          : "saved",
    });
  };
  const finish = async () => {
    if (!attemptId) return;
    try {
      let payload: unknown;
      if (attemptId > 0) payload = await submit.mutateAsync({ attemptId });
      else {
        const review = questions.map(question => {
          const selectedStatementAnswers = statementAnswers[question.id] ?? {};
          const expected = Object.fromEntries(
            (question.statements ?? []).map(statement => [
              statement.id,
              statement.correct,
            ])
          );
          const isStatement = question.type === "true_false_statements";
          return {
            questionId: question.id,
            prompt: question.prompt,
            explanation: question.explanation,
            type: question.type,
            options: question.options,
            statements: question.statements ?? [],
            selectedStatementAnswers,
            selectedOptionIds: answers[question.id] ?? [],
            correctOptionIds: question.correctOptionIds ?? [],
            isCorrect: isStatement
              ? Object.keys(expected).length ===
                  Object.keys(selectedStatementAnswers).length &&
                Object.keys(expected).every(
                  id => selectedStatementAnswers[id] === expected[id]
                )
              : JSON.stringify([...(answers[question.id] ?? [])].sort()) ===
                JSON.stringify([...(question.correctOptionIds ?? [])].sort()),
          };
        });
        const correctCount = review.filter(
          question => question.isCorrect
        ).length;
        payload = {
          scorePercent: Math.round((correctCount / questions.length) * 100),
          correctCount,
          availablePoints: questions.length,
          earnedPoints: correctCount,
          passed: correctCount / questions.length >= 0.7,
          quiz: {
            title: fallback.title,
            completionReward: fallback.reward,
            passingScore: 70,
          },
          review,
        };
      }
      const resultWithTiming = {
        ...(payload as Record<string, unknown>),
        durationSeconds: Math.max(0, totalDuration - timeLeft),
        totalDurationSeconds: totalDuration,
      };
      sessionStorage.setItem(
        "dshare-quiz-result",
        JSON.stringify(resultWithTiming)
      );
      if (document.fullscreenElement)
        document.exitFullscreen().catch(() => undefined);
      setLocation(`${ROUTES.results}/${quizId}`);
    } catch {
      toast.error("Chưa thể nộp bài", {
        description: "Vui lòng kiểm tra kết nối và thử lại.",
      });
    }
  };
  useEffect(() => {
    if (phase !== "active") return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const timer = window.setInterval(
      () => setTimeLeft(value => value - 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [phase, timeLeft]);
  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`;
  if (phase === "ready" && !isSandbox && detail.isLoading)
    return (
      <PageState
        icon={<Loader2 className="animate-spin text-primary" size={20} />}
        title="Đang tải thông tin bộ đề…"
      />
    );
  if (phase === "ready" && !isSandbox && detail.isError)
    return (
      <PageState
        icon={<AlertTriangle className="text-warning" size={30} />}
        title="Chưa tải được bộ đề"
        description={detail.error.message || "Kết nối tạm thời gặp sự cố."}
        actions={
          <>
            <Button onClick={() => detail.refetch()}>Thử lại</Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.explore}>Quay lại thư viện</Link>
            </Button>
          </>
        }
      />
    );
  if (phase === "ready")
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_34%),radial-gradient(circle_at_88%_28%,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_32%),var(--background)] lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden">
        <SiteHeader />
        <main className="container py-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:py-2">
          <Link
            href={isSandbox ? ROUTES.quizBuilder : ROUTES.explore}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-xs font-bold text-text-secondary shadow-[var(--shadow-sm)] transition-[transform,border-color,color] hover:-translate-y-0.5 hover:border-primary/35 hover:text-primary lg:min-h-8 lg:self-start lg:px-3 lg:text-[11px]"
          >
            <ArrowLeft size={15} />
            {isSandbox ? "Quay lại Studio" : "Trở về thư viện"}
          </Link>
          <section className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_390px] xl:gap-5 lg:min-h-0 lg:flex-1">
            <div className="overflow-hidden rounded-[26px] border border-border bg-surface shadow-[0_20px_56px_color-mix(in_srgb,var(--foreground)_8%,transparent)]">
              <div className="relative min-h-[270px] overflow-hidden bg-[linear-gradient(135deg,#085ef0_0%,#184bd6_52%,#5935dc_100%)] p-5 text-white sm:p-6 lg:min-h-[170px] lg:p-3">
                <div aria-hidden="true" className="absolute -left-12 -top-20 size-72 rounded-full bg-white/8" />
                <div className="relative max-w-[620px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.12em] text-white backdrop-blur">
                      <BookOpenCheck size={13} />
                      <span className="truncate">{topicPath || "Chủ đề đang cập nhật"}</span>
                    </span>
                    {isSandbox ? <span className="rounded-full bg-white/12 px-3 py-2 text-[10px] font-bold text-white/85">Sandbox</span> : null}
                  </div>
                  <h1 className="mt-5 text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.03] tracking-[-.06em] lg:mt-2 lg:text-[1.75rem]">
                    <span className="inline-block rounded-xl bg-white px-3 py-1.5 text-[#0b3ea8] shadow-[0_10px_24px_rgba(5,23,89,.24)] lg:rounded-lg lg:px-2.5 lg:py-1">
                      {fallback.title}
                    </span>
                  </h1>
                </div>
                <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:mt-2 lg:gap-1.5">
                  <HeroStat icon={<CircleHelp size={22} />} label="Câu hỏi" value={`${fallback.questionCount} câu`} />
                  <HeroStat icon={<Clock3 size={22} />} label="Thời gian" value={fallback.duration} />
                  <HeroStat icon={<Trophy size={22} />} label="Điểm tối đa" value="70 điểm" />
                  <HeroStat icon={<ListTodo size={22} />} label="Chế độ" value={isSandbox ? "Sandbox" : fallback.mode} />
                </div>
              </div>
              <div className="space-y-2.5 p-4 sm:p-5 lg:space-y-1.5 lg:p-3">
                <InfoPanel icon={<BookOpenCheck size={21} />} title="Nội dung bài tập">
                  <p className="lg:line-clamp-1">{fallback.summary || "Bài tập gồm các câu hỏi giúp bạn kiểm tra và củng cố kiến thức theo Chủ đề đã chọn."}</p>
                </InfoPanel>
                <InfoPanel icon={<ListChecks size={21} />} title="Cấu trúc bài tập">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div><p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">Dạng câu hỏi</p><p className="mt-1 text-xs font-bold text-foreground">Trắc nghiệm</p></div>
                    <div className="border-border-light sm:border-l sm:pl-4"><p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">Số câu hỏi</p><p className="mt-1 text-xs font-bold text-foreground">{fallback.questionCount} câu</p></div>
                    <div className="border-border-light sm:border-l sm:pl-4"><p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">Độ khó</p><span className="mt-1 inline-flex rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold text-success">{fallback.difficulty}</span></div>
                  </div>
                </InfoPanel>
                <InfoPanel icon={<AlertTriangle size={21} />} title="Lưu ý khi làm bài">
                  <ul className="space-y-1.5 text-xs leading-5 text-text-secondary lg:grid lg:grid-cols-3 lg:gap-2 lg:space-y-0 lg:text-[10px] lg:leading-4">
                    <li className="flex gap-2"><CircleCheck size={14} className="mt-0.5 shrink-0 text-primary" />Duy trì kết nối ổn định trong suốt quá trình làm bài.</li>
                    <li className="flex gap-2"><CircleCheck size={14} className="mt-0.5 shrink-0 text-primary" />Kết quả được tính ngay sau khi bạn nộp bài.</li>
                    <li className="flex gap-2"><CircleCheck size={14} className="mt-0.5 shrink-0 text-primary" />Bạn có thể xem lại đáp án và giải thích sau khi hoàn thành.</li>
                  </ul>
                </InfoPanel>
              </div>
            </div>
            <aside className="rounded-[26px] border border-border bg-surface p-5 shadow-[0_20px_56px_color-mix(in_srgb,var(--foreground)_8%,transparent)] sm:p-6 lg:p-4">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.15em] text-primary"><Trophy size={15} />{isSandbox ? "Xem trước Quiz" : "Xác nhận trước khi bắt đầu"}</p>
              <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.35rem)] font-bold leading-[1.14] tracking-[-.05em] text-foreground lg:mt-2 lg:text-[1.65rem]">{isSandbox ? "Sẵn sàng xem trước Quiz?" : "Sẵn sàng chinh phục bài tập này?"}</h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary lg:mt-2 lg:text-xs lg:leading-5">Kiểm tra lại thông tin bên dưới trước khi bắt đầu làm bài.</p>
              <div className="mt-4 divide-y divide-dashed divide-border-light border-y border-dashed border-border-light lg:mt-3">
                <ConfirmMetric icon={<CircleHelp size={21} />} label="Số câu hỏi" value={`${fallback.questionCount} câu`} />
                <ConfirmMetric icon={<Clock3 size={21} />} label="Thời gian làm bài" value={fallback.duration} />
                <ConfirmMetric icon={<Trophy size={21} />} label="Điểm tối đa" value="70 điểm" />
                <ConfirmMetric icon={<ListTodo size={21} />} label="Chế độ" value={isSandbox ? "Sandbox" : fallback.mode} />
              </div>
              {fallback.mode === "Kiểm tra" ? <div className="mt-5 rounded-xl border border-warning/20 bg-warning/10 p-3 text-xs leading-5 text-warning"><Sparkles className="mr-1 inline" size={14} />Lệ phí <strong>{fallback.points} Point</strong>; đạt từ 70 điểm để nhận <strong>{fallback.reward} Point</strong>.</div> : null}
              <Button onClick={begin} disabled={start.isPending} aria-busy={start.isPending} size="lg" className="cta-gradient mt-5 h-12 w-full rounded-xl text-sm font-extrabold shadow-[0_12px_24px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_16px_30px_color-mix(in_srgb,var(--primary)_34%,transparent)] active:translate-y-0 active:scale-[.98] lg:mt-3 lg:h-10 lg:text-xs">
                {start.isPending ? <Loader2 className="animate-spin" size={16} /> : isSandbox ? "Bắt đầu xem trước" : "Bắt đầu làm bài"}<ArrowRight className="ml-1" size={19} />
              </Button>
              <p className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-text-secondary lg:mt-2 lg:text-[10px]"><ShieldCheck size={14} className="text-primary" />Phiên làm bài được bảo vệ an toàn.</p>
            </aside>
          </section>
          <section className="mt-4 grid divide-y divide-border rounded-[20px] border border-border bg-surface px-4 py-1 shadow-[var(--shadow-sm)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-5 lg:mt-2 lg:shrink-0">
            <TrustItem icon={<ShieldCheck size={22} />} title="Cam kết chất lượng" description="Bài tập được biên soạn và kiểm duyệt trước khi công bố." />
            <TrustItem icon={<CircleCheck size={22} />} title="Chính xác" description="Nội dung được kiểm tra để hỗ trợ việc học hiệu quả." />
            <TrustItem icon={<Clock3 size={22} />} title="Cập nhật" description="Ngân hàng bài tập được bổ sung theo Chủ đề mới." />
          </section>
        </main>
      </div>
    );
  if (!current)
    return (
      <PageState
        icon={<AlertTriangle className="text-warning" size={30} />}
        title="Phiên làm bài chưa sẵn sàng"
        description="Không tải được câu hỏi cho phiên này."
        actions={
          <Button asChild>
            <Link href={ROUTES.explore}>Quay lại thư viện</Link>
          </Button>
        }
      />
    );
  const feedbackForCurrent =
    feedback?.questionId === current.id ? feedback.status : null;
  const selected = answers[current.id] ?? [];
  const selectedStatements = statementAnswers[current.id] ?? {};
  return (
    <div className="min-h-screen select-none bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_5%,transparent)_0%,var(--background)_30%)]">
      <QuizSecurityGuard active onEvent={onSecurityEvent} />
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 shadow-[0_8px_24px_color-mix(in_srgb,var(--foreground)_5%,transparent)] backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between gap-3">
          <Link
            href={ROUTES.explore}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition-colors hover:border-primary/35 hover:text-primary"
          >
            <ChevronLeft size={17} />
            <span className="hidden sm:inline">Thoát bài</span>
          </Link>
          <div className="hidden min-w-0 text-center sm:block">
            <p className="truncate text-xs font-bold text-foreground">
              {fallback.title}
            </p>
            <p className="mt-1 truncate text-[10px] font-medium text-text-secondary">
              {topicPath || "Chủ đề đang cập nhật"} · Câu {currentIndex + 1}/{questions.length}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-white shadow-[var(--shadow-sm)]",
              timeLeft <= 60 ? "bg-danger" : "bg-[linear-gradient(135deg,var(--primary),var(--accent))]"
            )}
          >
            <Clock3 size={15} />
            <span className="font-mono text-sm font-medium">
              {formattedTime}
            </span>
          </div>
        </div>
      </header>
      <main className="container py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <section
            key={current.id}
            className="quiz-question-enter mx-auto w-full max-w-[960px] rounded-[28px] border border-border bg-surface p-5 shadow-[0_18px_44px_color-mix(in_srgb,var(--foreground)_7%,transparent)] sm:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-primary">
                  <ListChecks size={13} /> Câu {currentIndex + 1}
                </span>
                <span className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-bold text-text-secondary">
                  {current.difficulty}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  toast.info("Báo lỗi câu hỏi", {
                    description:
                      "Sau khi hoàn thành bài, bạn có thể gửi báo cáo để admin duyệt.",
                  })
                }
                className="flex min-h-11 items-center gap-1 text-[11px] font-semibold text-warning hover:underline"
              >
                <Flag size={13} />
                Báo lỗi
              </button>
            </div>
            <p className="mt-7 text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.28] tracking-[-.035em] text-foreground">
              {current.prompt}
            </p>
            {current.imageUrl ? (
              <img
                src={current.imageUrl}
                alt="Hình minh họa câu hỏi"
                className="mt-5 max-h-[420px] w-full rounded-[var(--radius-md-token)] border border-border object-contain"
              />
            ) : null}
            {current.media ? (
              <section className="mt-5 rounded-[var(--radius-md-token)] border border-border bg-muted p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-text-secondary">
                  Tư liệu đính kèm
                </p>
                {current.media.kind === "audio" ? (
                  <audio
                    controls
                    src={current.media.url}
                    className="h-10 w-full"
                    aria-label="Audio minh họa câu hỏi"
                  />
                ) : (
                  <video
                    controls
                    src={current.media.url}
                    className="max-h-[420px] w-full rounded-[var(--radius-sm-token)] bg-black"
                    aria-label="Video minh họa câu hỏi"
                  />
                )}
              </section>
            ) : null}
            <p className="mt-3 text-[11px] font-medium text-text-secondary">
              {current.tags.map(tag => `#${tag}`).join(" · ")}
            </p>
            {current.type === "true_false_statements" ? (
              <StatementAnswerTable
                statements={current.statements ?? []}
                selected={selectedStatements}
                onChoose={chooseStatement}
                reveal={isLocalPreview && Boolean(feedbackForCurrent)}
              />
            ) : null}
            <div
              className={cn(
                "mt-8 space-y-3",
                current.type === "true_false_statements" && "hidden"
              )}
            >
              {current.options.map((option, index) => {
                const isSelected = selected.includes(option.id);
                const isCorrectOption =
                  isLocalPreview &&
                  feedbackForCurrent &&
                  (current.correctOptionIds ?? []).includes(option.id);
                const isWrongSelected =
                  isLocalPreview &&
                  feedbackForCurrent === "incorrect" &&
                  isSelected &&
                  !isCorrectOption;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => choose(option.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex min-h-16 w-full items-center gap-4 rounded-[var(--radius-md-token)] border p-4 text-left transition-[border-color,background-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20",
                      isCorrectOption
                        ? "border-success bg-success/12 shadow-[0_0_0_3px_rgba(34,197,94,.1)]"
                        : isWrongSelected
                          ? "border-danger bg-danger/5"
                          : isSelected
                            ? "border-primary bg-primary-light shadow-[var(--shadow-sm)]"
                            : "border-border bg-surface hover:border-primary/45 hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full border text-xs font-bold",
                        isCorrectOption
                          ? "border-success bg-success text-white"
                          : isWrongSelected
                            ? "border-danger bg-danger text-white"
                            : isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-muted text-text-secondary"
                      )}
                    >
                      {isCorrectOption ? (
                        <CircleCheck size={16} />
                      ) : isWrongSelected ? (
                        <CircleX size={16} />
                      ) : isSelected ? (
                        <Check size={15} />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </span>
                    <span className="text-sm font-medium leading-6 text-foreground">
                      {option.body}
                    </span>
                  </button>
                );
              })}
            </div>
            <div aria-live="polite" className="mt-5 min-h-12">
              {feedbackForCurrent ? (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md-token)] px-4 py-3 text-sm font-semibold",
                    feedbackForCurrent === "correct"
                      ? "bg-success/12 text-success"
                      : feedbackForCurrent === "incorrect"
                        ? "bg-danger/5 text-danger"
                        : "bg-primary-light text-primary"
                  )}
                >
                  {feedbackForCurrent === "correct" ? (
                    <CircleCheck size={18} />
                  ) : feedbackForCurrent === "incorrect" ? (
                    <CircleX size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {feedbackForCurrent === "correct"
                    ? "Chính xác! Bạn có thể chuyển sang câu tiếp theo."
                    : feedbackForCurrent === "incorrect"
                      ? "Chưa đúng. Đáp án đúng đã được đánh dấu để bạn ôn lại."
                      : "Đáp án đã được lưu. Bạn có thể xem lại trước khi nộp bài."}
                </div>
              ) : null}
            </div>
            <div className="mt-7 flex justify-between border-t border-border-light pt-5">
              <Button
                variant="ghost"
                disabled={currentIndex === 0}
                onClick={() => {
                  setFeedback(null);
                  setCurrentIndex(index => index - 1);
                }}
                className="rounded-full text-xs"
              >
                <ArrowLeft size={15} />
                Quay lại
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={() => {
                    setFeedback(null);
                    setCurrentIndex(index => index + 1);
                  }}
                  className="rounded-full text-xs"
                >
                  Câu tiếp theo <ArrowRight size={15} />
                </Button>
              ) : (
                <Button
                  onClick={finish}
                  disabled={submit.isPending}
                  className="rounded-full text-xs"
                >
                  Nộp bài <Check size={15} />
                </Button>
              )}
            </div>
          </section>
          <aside className="h-fit rounded-[24px] border border-border bg-surface p-5 shadow-[0_14px_34px_color-mix(in_srgb,var(--foreground)_6%,transparent)] lg:sticky lg:top-24">
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-primary">
              Tiến độ làm bài
            </p>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {answeredCount}
                <span className="text-sm text-text-secondary">
                  /{questions.length}
                </span>
              </p>
              <p className="text-[11px] text-text-secondary">
                {progressPercent}% hoàn thành
              </p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Tiến độ làm bài"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={answeredCount}
            >
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2 rounded-[var(--radius-md-token)] bg-muted/65 p-2">
              {questions.map((question, index) => (
                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setCurrentIndex(index);
                  }}
                  key={question.id}
                  aria-label={`Đi đến câu ${index + 1}`}
                  aria-current={index === currentIndex ? "step" : undefined}
                  className={cn(
                    "grid aspect-square place-items-center rounded-[var(--radius-sm-token)] text-xs font-bold transition-[transform,background-color,color] hover:-translate-y-0.5",
                    index === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : hasAnswer(question)
                        ? "bg-success/12 text-success"
                        : "bg-muted text-text-secondary"
                  )}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-[var(--radius-md-token)] border border-primary/10 bg-primary-light p-4">
              <Maximize size={16} className="text-primary" />
              <p className="mt-3 text-xs font-bold text-foreground">
                Phiên làm bài tập trung
              </p>
              <p className="mt-1 text-[10px] leading-5 text-text-secondary">
                Tốt nhất hãy giữ nguyên màn hình trong suốt thời gian làm bài.
              </p>
            </div>
            <Button
              onClick={finish}
              variant="outline"
              className="mt-4 w-full rounded-full text-xs"
            >
              Nộp bài sớm
            </Button>
          </aside>
        </div>
      </main>
    </div>
  );
}
function PageState({
  icon,
  title,
  description,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container grid min-h-[70vh] place-items-center">
        <div
          role={description ? "alert" : "status"}
          className="max-w-md rounded-[var(--radius-xl-token)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-sm)]"
        >
          <div className="mx-auto w-fit">{icon}</div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">{title}</h1>
          {description ? (
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {description}
            </p>
          ) : null}
          {actions ? (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md-token)] bg-white/12 p-3">
      <p className="text-[9px] font-bold uppercase tracking-[.12em] text-white/70">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/12 p-3.5 backdrop-blur-sm lg:rounded-xl lg:p-2">
      <div className="flex items-center gap-2 text-white/80">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-[.11em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-bold text-white lg:mt-1 lg:text-xs">{value}</p>
    </div>
  );
}

function InfoPanel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-4 sm:px-5 lg:rounded-xl lg:px-3 lg:py-2.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary-light text-primary lg:size-7 lg:rounded-lg">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground lg:text-xs">{title}</h3>
          <div className="mt-2 lg:mt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}

function ConfirmMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5 lg:py-3">
      <span className="flex min-w-0 items-center gap-3 text-sm text-text-secondary lg:gap-2 lg:text-xs">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </span>
      <strong className="shrink-0 text-sm text-foreground lg:text-xs">{value}</strong>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 py-4 sm:px-5 lg:gap-2 lg:py-2 lg:px-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <h3 className="text-xs font-bold text-foreground lg:text-[11px]">{title}</h3>
        <p className="mt-1 text-[11px] leading-5 text-text-secondary lg:leading-4">{description}</p>
      </div>
    </div>
  );
}

function StatementAnswerTable({
  statements,
  selected,
  onChoose,
  reveal,
}: {
  statements: Array<{ id: string; text: string; correct?: boolean }>;
  selected: Record<string, boolean>;
  onChoose: (id: string, value: boolean) => void;
  reveal: boolean;
}) {
  return (
    <section className="mt-7 overflow-hidden rounded-[var(--radius-md-token)] border border-border">
      <div className="grid grid-cols-[minmax(0,1fr)_72px_84px] bg-muted px-4 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-text-secondary">
        <span>Nhận định</span>
        <span className="text-center">Có</span>
        <span className="text-center">Không</span>
      </div>
      {statements.map((statement, index) => {
        const selectedValue = selected[statement.id];
        const showCorrect = reveal && statement.correct === true;
        const showWrong =
          reveal &&
          selectedValue !== undefined &&
          selectedValue !== statement.correct;
        return (
          <div
            key={statement.id}
            className="grid grid-cols-[minmax(0,1fr)_72px_84px] items-center gap-1 border-t border-border-light px-4 py-3"
          >
            <p className="pr-3 text-sm font-medium leading-6 text-foreground">
              <span className="mr-2 text-text-secondary">{index + 1}.</span>
              {statement.text}
            </p>
            {([true, false] as const).map(value => {
              const active = selectedValue === value;
              const correctChoice =
                (showCorrect && value === true) ||
                (reveal && statement.correct === false && value === false);
              const wrongChoice = showWrong && active;
              return (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => onChoose(statement.id, value)}
                  aria-pressed={active}
                  className={cn(
                    "mx-auto grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs font-bold transition",
                    correctChoice
                      ? "bg-success text-white"
                      : wrongChoice
                        ? "bg-danger text-white"
                        : active
                          ? "bg-primary text-primary-foreground"
                          : value
                            ? "bg-success/10 text-success hover:bg-success/15"
                            : "bg-danger/8 text-danger hover:bg-danger/12"
                  )}
                >
                  {value ? "Có" : "Không"}
                </button>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
