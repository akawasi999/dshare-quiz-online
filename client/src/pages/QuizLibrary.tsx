import QuizCard from "@/components/QuizCard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import type { ShowcaseQuiz } from "@/data/demo";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowRight, Filter, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const modes = ["Tất cả", "Ôn tập", "Kiểm tra"];
const difficultyLabels = { easy: "Dễ", medium: "Trung bình", hard: "Nâng cao" } as const;
const tierLabels = { basic: "Basic", pro: "Pro", premium: "Premium" } as const;

export default function QuizLibrary() {
  const initialSearch = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
  const { user } = useAuth();
  const learner = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const categories = trpc.catalog.categories.useQuery();
  const catalog = trpc.catalog.list.useQuery();
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("Tất cả");
  const [mode, setMode] = useState("Tất cả");
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
    tier: tierLabels[quiz.accessTier],
  })), [catalog.data]);
  const filtered = useMemo(() => liveQuizzes.filter(quiz => {
    const haystack = `${quiz.title} ${quiz.category} ${quiz.subject} ${quiz.lesson}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (category === "Tất cả" || quiz.category === category) && (mode === "Tất cả" || quiz.mode === mode);
  }), [liveQuizzes, search, category, mode]);

  return <div className="min-h-screen bg-[#fff7e6]"><SiteHeader />
    <main>
      <section className="border-b border-[#172554]/8 bg-[#fff7e6]"><div className="container py-14 lg:py-20"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#f59e0b]">Thư viện học tập</p><div className="mt-3 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><h1 className="font-serif text-[42px] font-semibold tracking-[-.05em] text-[#172554] sm:text-[53px]">Tìm đúng bộ đề.<br /><em className="font-medium">Học đúng trọng tâm.</em></h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#617786]">Duyệt theo chủ đề, độ khó và hình thức làm bài. Mỗi bộ đề đều thuộc một lộ trình bốn cấp rõ ràng.</p></div><div className="rounded-2xl bg-[#fff7e6] px-5 py-4 text-xs leading-5 text-[#617786]"><Sparkles size={15} className="mb-2 text-[#d97706]" /><strong className="block text-[#172554]">Luyện tập hay kiểm tra?</strong>Ôn tập phản hồi ngay. Kiểm tra tập trung vào kết quả.</div></div></div></section>
      <section className="container py-10 lg:py-14">{suggestedCategory && !hasStartedExploring ? <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#fbbf24] bg-[#fff7e6] px-4 py-3 text-xs leading-5 text-[#d97706]"><Sparkles size={16} className="shrink-0 text-[#f59e0b]" /><span><strong>Gợi ý từ phiên luyện tập gần nhất:</strong> {suggestedCategory.title}</span></div> : null}<div className="flex flex-col gap-5 rounded-[24px] border border-[#172554]/9 bg-white p-4 shadow-sm lg:flex-row lg:items-center"><div className="flex h-12 flex-1 items-center rounded-xl bg-[#eef4ff] px-4"><Search size={17} className="text-[#f59e0b]" /><input value={search} onChange={event => { setHasStartedExploring(true); setSearch(event.target.value); }} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#617786]" placeholder="Tên bộ đề, môn học hoặc bài học" /></div><div className="flex items-center gap-2 overflow-x-auto"><Filter size={16} className="shrink-0 text-[#617786]" />{categoryFilters.map((item: string) => <button key={item} onClick={() => { setHasStartedExploring(true); setCategory(item); }} className={cn("shrink-0 rounded-full px-3 py-2 text-xs font-semibold", category === item ? "bg-[#172554] text-white" : "bg-[#eef4ff] text-[#617786] hover:bg-[#eef4ff]")}>{item}</button>)}</div></div>
        <div className="mt-9 flex flex-col justify-between gap-4 border-b border-[#172554]/9 pb-5 sm:flex-row sm:items-center"><p className="text-sm font-semibold text-[#172554]"><span className="font-serif text-[24px] text-[#172554]">{filtered.length}</span> bộ đề phù hợp với bạn</p><div className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-[#f59e0b]" />{modes.map(item => <button key={item} onClick={() => { setHasStartedExploring(true); setMode(item); }} className={cn("rounded-full px-3 py-2 text-xs font-semibold", mode === item ? "bg-[#fff7e6] text-[#d97706]" : "text-[#617786] hover:bg-[#eef4ff]")}>{item}</button>)}</div></div>
        {catalog.isLoading ? <div className="mt-10 rounded-[26px] bg-white px-6 py-16 text-center text-sm text-[#617786]" aria-live="polite">Đang tải bộ đề...</div> : catalog.error ? <div role="alert" className="mt-10 rounded-[26px] bg-red-50 px-6 py-16 text-center text-sm text-red-700">Không thể tải thư viện bộ đề: {catalog.error.message}</div> : filtered.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}</div> : <div className="mt-10 rounded-[26px] border border-dashed border-[#172554]/15 bg-[#fff7e6] px-6 py-16 text-center"><Search className="mx-auto text-[#f59e0b]" size={25} /><h2 className="mt-4 font-serif text-2xl font-semibold text-[#172554]">Chưa tìm thấy bộ đề phù hợp</h2><p className="mt-2 text-sm text-[#617786]">Thử bỏ bớt bộ lọc hoặc tìm với một từ khóa khác.</p><Button variant="outline" onClick={() => { setSearch(""); setCategory("Tất cả"); setMode("Tất cả"); }} className="mt-6 rounded-full">Xóa bộ lọc</Button></div>}
        <div className="mt-12 rounded-[26px] bg-[#172554] p-6 text-white sm:flex sm:items-center sm:justify-between sm:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#fbbf24]">Bạn chưa tìm thấy chủ đề?</p><h2 className="mt-2 font-serif text-[27px] font-semibold">Theo dõi lộ trình để nhận đề phù hợp.</h2></div><Button asChild className="mt-5 rounded-full bg-[#fbbf24] text-[#172554] hover:bg-[#fbbf24] sm:mt-0"><Link href="/ho-so">Mở hồ sơ học tập <ArrowRight size={15} /></Link></Button></div>
      </section>
    </main>
  </div>;
}
