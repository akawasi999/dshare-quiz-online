import QuizCard from "@/components/QuizCard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import type { ShowcaseQuiz } from "@/data/demo";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Clock3, Filter, Search, SlidersHorizontal, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const modes = ["Tất cả", "Ôn tập", "Kiểm tra"];
const difficultyLabels = { easy: "Dễ", medium: "Trung bình", hard: "Nâng cao" } as const;
const tierLabels = { basic: "Basic", pro: "Pro", premium: "Premium" } as const;

export default function QuizLibrary() {
  const initialSearch = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
  const { user } = useAuth();
  const learner = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const quota = trpc.learner.quota?.useQuery(undefined, { enabled: Boolean(user), retry: false }) ?? { data: undefined };
  const categories = trpc.catalog.categories.useQuery();
  const catalog = trpc.catalog.list.useQuery();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("Tất cả");
  const [mode, setMode] = useState("Tất cả");
  const [difficulty, setDifficulty] = useState("Tất cả");
  const [visibleCount, setVisibleCount] = useState(6);
  const [hasStartedExploring, setHasStartedExploring] = useState(Boolean(initialSearch));
  const suggestedCategory = categories.data?.find(item => item.id === learner.data?.profile.lastPracticeCategoryId);
  const categoryFilters = ["Tất cả", ...(categories.data ?? []).map(item => item.title)];
  const liveQuizzes = useMemo<ShowcaseQuiz[]>(() => (catalog.data ?? []).map(quiz => ({
    id: quiz.quizId,
    title: quiz.title,
    category: quiz.categoryTitle,
    subject: quiz.subjectTitle,
    lesson: quiz.lessonTitle,
    summary: quiz.summary ?? "Bộ đề đã được biên soạn trong Dshare.",
    mode: quiz.mode === "testing" ? "Kiểm tra" as const : "Ôn tập" as const,
    difficulty: difficultyLabels[quiz.difficulty],
    duration: `${Math.ceil(quiz.durationSeconds / 60)} phút`,
    questionCount: quiz.questionCount,
    accent: "#2563eb",
    points: quiz.entryPointCost,
    reward: quiz.completionReward,
    attemptCount: Number(quiz.attemptCount ?? 0),
    coverImage: quiz.coverImageUrl ?? undefined,
    tier: tierLabels[quiz.accessTier],
  })), [catalog.data]);
  const filtered = useMemo(() => liveQuizzes.filter(quiz => {
    const haystack = `${quiz.title} ${quiz.category} ${quiz.subject} ${quiz.lesson}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (category === "Tất cả" || quiz.category === category) && (mode === "Tất cả" || quiz.mode === mode) && (difficulty === "Tất cả" || quiz.difficulty === difficulty);
  }), [liveQuizzes, search, category, mode, difficulty]);

  return <div className="min-h-screen bg-[#fff7e6]"><SiteHeader />
    <main>
      <section className="border-b border-[#172554]/8 bg-[#ebf4ff]"><div className="container py-8 lg:py-10"><div className="rounded-[22px] border border-[#007453]/20 bg-[#e8f6fd] px-5 py-4 sm:flex sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#007453] text-white"><Sparkles size={19} /></span><div><p className="text-sm font-bold text-[#141432]">{quota.data?.limits.attemptsPerMonth === null ? "Bạn có lượt làm Quiz không giới hạn" : `Bạn còn ${quota.data?.remaining.attempts ?? "—"} lượt làm Quiz tháng này`}</p><p className="mt-1 text-xs text-[#6c6c7a]">Theo gói {quota.data?.tier?.toUpperCase() ?? "BASIC"}; lượt còn lại được cập nhật theo dữ liệu máy chủ.</p></div></div><div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#007453] sm:mt-0">{quota.data?.limits.attemptsPerMonth === null ? "∞ lượt" : `${quota.data?.usage.attempts ?? 0}/${quota.data?.limits.attemptsPerMonth ?? 0}`}</div></div></div></section>
      <section className="container py-10 lg:py-14">{suggestedCategory && !hasStartedExploring ? <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#fbbf24] bg-[#fff7e6] px-4 py-3 text-xs leading-5 text-[#d97706]"><Sparkles size={16} className="shrink-0 text-[#f59e0b]" /><span><strong>Gợi ý từ phiên luyện tập gần nhất:</strong> {suggestedCategory.title}</span></div> : null}<div className="grid gap-3 rounded-[24px] border border-[#172554]/9 bg-white p-3 shadow-sm lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:items-center"><div className="flex h-11 items-center rounded-xl bg-[#eef4ff] px-3"><Search aria-hidden="true" size={16} className="text-[#f59e0b]" /><input aria-label="Tìm kiếm bộ đề" value={search} onChange={event => { setHasStartedExploring(true); setSearch(event.target.value); }} className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-[#617786]" placeholder="Tìm bộ đề…" /></div><div className="flex min-w-0 flex-col gap-2 border-t border-[#172554]/8 pt-3 lg:flex-row lg:items-center lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"><div className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#617786]"><Filter aria-hidden="true" size={14} /> Chủ đề</div><div className="flex min-w-0 gap-2 overflow-x-auto pb-0.5">{categoryFilters.map((item: string) => <button key={item} aria-pressed={category === item} onClick={() => { setHasStartedExploring(true); setCategory(item); }} className={cn("shrink-0 rounded-full px-3 py-2 text-xs font-semibold", category === item ? "bg-[#172554] text-white" : "bg-[#eef4ff] text-[#617786] hover:bg-[#dbeafe]")}>{item}</button>)}</div></div></div>
        <div className="mt-7 flex flex-col items-center gap-3 border-b border-[#172554]/9 pb-5"><div className="flex flex-wrap justify-center gap-2">{["Tất cả", "Dễ", "Trung bình", "Nâng cao"].map(item => <button key={item} aria-pressed={difficulty === item} onClick={() => setDifficulty(item)} className={cn("rounded-full border px-4 py-2 text-xs font-bold", difficulty === item ? "border-[#3762d2] bg-[#3762d2] text-white" : "border-[#172554]/10 bg-white text-[#6c6c7a]")}>{item === "Tất cả" ? <Target className="mr-1 inline" size={13} /> : <i className={cn("mr-1 inline-block h-2.5 w-2.5 rounded-full", item === "Dễ" ? "bg-[#007453]" : item === "Trung bình" ? "bg-[#f59e0b]" : "bg-[#de1264]")} />} {item}</button>)}</div><p className="text-sm font-semibold text-[#141432]"><span className="font-serif text-[24px]">{filtered.length}</span> bộ đề phù hợp</p></div>
        {catalog.isLoading ? <div role="status" className="mt-10 rounded-[26px] bg-white px-6 py-16 text-center text-sm text-[#617786]" aria-live="polite">Đang tải bộ đề...</div> : catalog.error ? <div role="alert" className="mt-10 rounded-[26px] bg-red-50 px-6 py-16 text-center text-sm text-red-700"><p>Không thể tải thư viện bộ đề: {catalog.error.message}</p><Button variant="outline" onClick={() => catalog.refetch()} className="mt-5 rounded-full border-red-200 text-red-700">Thử lại</Button></div> : filtered.length ? <><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.slice(0, visibleCount).map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}</div>{visibleCount < filtered.length && <div className="mt-8 text-center"><Button onClick={() => setVisibleCount(value => value + 6)} className="cta-gradient rounded-full">Tải thêm bộ đề</Button></div>}</> : <div className="mt-10 rounded-[26px] border border-dashed border-[#172554]/15 bg-[#fff7e6] px-6 py-16 text-center"><Search aria-hidden="true" className="mx-auto text-[#f59e0b]" size={25} /><h2 className="mt-4 font-serif text-2xl font-semibold text-[#172554]">Chưa tìm thấy bộ đề phù hợp</h2><p className="mt-2 text-sm text-[#617786]">Thử bỏ bớt bộ lọc hoặc tìm với một từ khóa khác.</p><Button variant="outline" onClick={() => { setSearch(""); setCategory("Tất cả"); setMode("Tất cả"); setDifficulty("Tất cả"); }} className="mt-6 rounded-full">Xóa bộ lọc</Button></div>}
        <div className="mt-12 rounded-[26px] bg-[#172554] p-6 text-white sm:flex sm:items-center sm:justify-between sm:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#fbbf24]">Bạn chưa tìm thấy chủ đề?</p><h2 className="mt-2 font-serif text-[27px] font-semibold">Theo dõi lộ trình để nhận đề phù hợp.</h2></div><Button asChild className="mt-5 rounded-full bg-[#fbbf24] text-[#172554] hover:bg-[#fbbf24] sm:mt-0"><Link href="/ho-so">Mở hồ sơ học tập <ArrowRight size={15} /></Link></Button></div>
      </section>
    </main>
  </div>;
}
