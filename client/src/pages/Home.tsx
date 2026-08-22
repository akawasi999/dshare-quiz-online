import QuizCard from "@/components/QuizCard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { showcaseQuizzes } from "@/data/demo";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookMarked, BrainCircuit, CheckCircle2, ChevronRight, CircleHelp, Compass, Crown, Layers3, Search, ShieldCheck, SlidersHorizontal, Sparkles, TimerReset } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const pathways = [
  { step: "01", icon: Layers3, label: "Chủ đề", value: "Công nghệ thông tin", note: "Khám phá lĩnh vực" },
  { step: "02", icon: Compass, label: "Môn học", value: "Lập trình Python", note: "Xây nền kiến thức" },
  { step: "03", icon: BookMarked, label: "Bài học", value: "Cú pháp cơ bản", note: "Học theo lộ trình" },
  { step: "04", icon: CircleHelp, label: "Bài thi / Bộ đề", value: "Kiểm tra chương 01", note: "Đo lường tiến bộ" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("Tất cả");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "reward">("newest");
  const [, setLocation] = useLocation();
  const catalogQuery = trpc.catalog.list.useQuery();
  const spotlight = useMemo(() => catalogQuery.data?.length ? showcaseQuizzes : showcaseQuizzes, [catalogQuery.data]);
  const topics = useMemo(() => ["Tất cả", ...Array.from(new Set(spotlight.map(quiz => quiz.category)))], [spotlight]);
  const visibleSpotlight = useMemo(() => spotlight.filter(quiz => (selectedTopic === "Tất cả" || quiz.category === selectedTopic) && (!search.trim() || `${quiz.title} ${quiz.category} ${quiz.subject} ${quiz.lesson}`.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN")))).sort((left, right) => {
    if (sortBy === "popular") return Number(right.attemptCount ?? 0) - Number(left.attemptCount ?? 0);
    if (sortBy === "reward") return Number(right.reward ?? 0) - Number(left.reward ?? 0);
    return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
  }), [search, selectedTopic, sortBy, spotlight]);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    document.querySelector("main > section:nth-of-type(2)")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,var(--primary-light)_0%,var(--background)_52%,var(--surface)_100%)]">
        <SiteHeader />
        <div className="container relative flex min-h-[620px] items-center py-16 sm:py-20 lg:min-h-[680px] lg:py-28">
          <div className="rise-in max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[.08em] text-primary shadow-[var(--shadow-sm)]"><span className="size-2 rounded-full bg-primary" />Tạo Quiz bằng AI</div>
            <h1 className="mt-7 max-w-4xl font-serif text-[clamp(2.5rem,6vw,4.75rem)] font-extrabold leading-[1.08] tracking-[-.05em] text-foreground">Tạo Quiz để học tập <span className="bg-[linear-gradient(135deg,var(--primary)_0%,var(--accent)_100%)] bg-clip-text text-transparent">rõ ràng hơn</span>.</h1>
            <p className="mt-6 max-w-3xl text-[17px] leading-8 text-text-secondary sm:text-[19px]">Tạo quiz từ văn bản, PDF, URL hoặc chủ đề bất kỳ. Làm bài, theo dõi tiến độ và nhận phản hồi AI trong một không gian học tập có tổ chức.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="cta-gradient rounded-full px-7"><Link href="/kham-pha">Khám phá miễn phí <ArrowRight size={18} /></Link></Button><Button asChild variant="outline" size="lg" className="rounded-full px-7"><Link href="/tao-quiz">Tạo Quiz mới</Link></Button></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-text-secondary"><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-success" /> Tạo Quiz thủ công</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-success" /> Có AI hỗ trợ</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-success" /> Không cần thẻ thanh toán</span></div>
          </div>
        </div>
      </section>

      <main>
        <section className="container py-16 lg:py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Khám phá có định hướng</p><h2 className="mt-3 max-w-2xl font-serif font-bold">Nội dung được tổ chức để bạn không phải học một mình.</h2></div><Link href="/kham-pha" className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-primary">Xem toàn bộ thư viện <span className="grid size-8 place-items-center rounded-full bg-primary-light transition-transform group-hover:translate-x-1"><ArrowRight size={15} /></span></Link></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{pathways.map((pathway, index) => <div key={pathway.step} className="relative rounded-[var(--radius-lg-token)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"><span className="text-xs font-bold text-primary">{pathway.step}</span><pathway.icon className="mt-7 text-primary" size={22} /><p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-text-muted">{pathway.label}</p><p className="mt-1 text-lg font-bold text-foreground">{pathway.value}</p><p className="mt-2 text-sm text-text-secondary">{pathway.note}</p>{index < pathways.length - 1 ? <ChevronRight className="absolute -right-5 top-1/2 z-10 hidden rounded-full border border-border bg-surface p-1 text-primary lg:block" size={27} /> : null}</div>)}</div>
        </section>

        <section className="border-y border-border-light bg-surface py-16 lg:py-24"><div className="container"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Bắt đầu từ hôm nay</p><h2 className="mt-3 font-serif font-bold">Bộ đề được quan tâm</h2></div><span className="w-fit rounded-full bg-muted px-4 py-2 text-xs font-semibold text-text-secondary">{catalogQuery.isLoading ? "Đang cập nhật" : catalogQuery.isError ? "Chưa thể cập nhật catalog" : `${visibleSpotlight.length} bộ đề phù hợp`}</span></div><form onSubmit={submitSearch} className="mt-8 rounded-[var(--radius-lg-token)] border border-border bg-background p-3 shadow-[var(--shadow-sm)]"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]"><label className="relative"><span className="sr-only">Tìm bộ đề</span><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={search} onChange={event => setSearch(event.target.value)} className="field pl-10" placeholder="Tìm theo tên Quiz, chủ đề hoặc môn học…" /></label><label className="relative"><span className="sr-only">Sắp xếp bộ đề</span><SlidersHorizontal aria-hidden="true" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><select value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)} className="field appearance-none pl-9 text-sm"><option value="newest">Mới công bố</option><option value="popular">Lượt làm nhiều</option><option value="reward">Thưởng cao</option></select></label></div><div className="mt-3 flex flex-wrap gap-2" aria-label="Lọc theo chủ đề">{topics.map(topic => <button key={topic} type="button" onClick={() => setSelectedTopic(topic)} aria-pressed={selectedTopic === topic} className={`min-h-9 rounded-full px-3 text-xs font-bold ${selectedTopic === topic ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]" : "bg-surface text-text-secondary hover:bg-muted hover:text-foreground"}`}>{topic}</button>)}</div></form>{catalogQuery.isError ? <div role="alert" className="mt-10 flex flex-col items-center rounded-[var(--radius-xl-token)] border border-dashed border-danger/35 bg-danger/5 p-9 text-center"><p className="text-xl font-bold text-foreground">Chưa thể cập nhật thư viện bộ đề.</p><p className="mt-2 max-w-xl text-sm text-text-secondary">Dữ liệu mới nhất tạm thời chưa khả dụng. Bạn có thể thử tải lại danh sách.</p><Button onClick={() => catalogQuery.refetch()} className="mt-5 rounded-full">Thử lại</Button></div> : visibleSpotlight.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{visibleSpotlight.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}</div> : <div className="mt-10 rounded-[var(--radius-xl-token)] border border-dashed border-border bg-muted p-9 text-center"><p className="text-xl font-bold text-foreground">Chưa tìm thấy bộ đề phù hợp.</p><p className="mt-2 text-sm text-text-secondary">Hãy thử từ khóa khác hoặc đặt lại danh mục để xem toàn bộ thư viện.</p><Button onClick={() => { setSearch(""); setSelectedTopic("Tất cả"); setSortBy("newest"); }} variant="outline" className="mt-5 rounded-full">Đặt lại bộ lọc</Button></div>}</div></section>

        <section className="container py-16 lg:py-24"><div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]"><div className="rounded-[var(--radius-xl-token)] border border-border bg-surface p-7 shadow-[var(--shadow-sm)] lg:p-10"><span className="grid size-11 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary"><Crown size={20} /></span><p className="mt-7 text-[11px] font-bold uppercase tracking-[.16em] text-primary">Không chỉ là bài kiểm tra</p><h2 className="mt-3 font-serif font-bold">Mỗi kết quả đều cho bạn biết bước tiếp theo.</h2><p className="mt-5 max-w-md text-sm leading-6 text-text-secondary">Xem tỷ lệ đúng, xem lại lời giải, lưu câu cần ôn và trở lại với một kế hoạch rõ ràng hơn.</p><Button asChild variant="outline" className="mt-7 rounded-full"><Link href="/ho-so">Khám phá hồ sơ học tập <ArrowRight size={14} /></Link></Button></div><div className="rounded-[var(--radius-xl-token)] bg-[linear-gradient(135deg,var(--primary)_0%,var(--accent)_100%)] p-7 text-white shadow-[var(--shadow-md)] lg:p-10"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/75">Chuẩn mực làm bài</p><h3 className="mt-2 text-3xl font-bold text-white">Tập trung và công bằng</h3></div><ShieldCheck className="text-white" size={34} /></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><Feature icon={Sparkles} title="Đề xáo trộn" description="Mỗi lượt làm có một thứ tự riêng." /><Feature icon={TimerReset} title="Theo thời gian" description="Tự động nộp bài khi hết giờ." /><Feature icon={BrainCircuit} title="Phản hồi sâu" description="Lời giải và trợ lý AI sau bài." /></div></div></div></section>
      </main>
      <footer id="ve-dshare" className="border-t border-border bg-surface"><div className="container flex flex-col gap-5 py-8 text-xs text-text-secondary md:flex-row md:items-center md:justify-between"><p><span className="text-sm font-bold text-foreground">dshare</span> · Nơi việc học được thiết kế có chủ đích.</p><div className="flex gap-5"><Link href="/bang-gia">Gói học</Link><Link href="/kham-pha">Thư viện</Link><Link href="/bang-xep-hang">Xếp hạng</Link></div></div></footer>
    </div>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
  return <div className="rounded-[var(--radius-md-token)] bg-white/12 p-4"><Icon size={18} className="text-white" /><p className="mt-4 text-sm font-bold text-white">{title}</p><p className="mt-2 text-xs leading-5 text-white/75">{description}</p></div>;
}
