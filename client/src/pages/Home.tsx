import QuizCard from "@/components/QuizCard";
import SiteHeader from "@/components/SiteHeader";
import AuthActionLink from "@/components/AuthActionLink";
import { Button } from "@/components/ui/button";
import { showcaseQuizzes } from "@/data/demo";
import { trpc } from "@/lib/trpc";
import { ROUTES } from "@/lib/routes";
import { ArrowRight, BookMarked, BrainCircuit, CheckCircle2, ChevronRight, CircleHelp, Compass, Crown, Layers3, Search, ShieldCheck, SlidersHorizontal, Sparkles, TimerReset } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_76%_20%,rgba(171,145,255,.25),transparent_23%),radial-gradient(circle_at_87%_74%,rgba(148,244,194,.22),transparent_25%),linear-gradient(145deg,var(--primary-light)_0%,var(--background)_52%,var(--surface)_100%)]">
        <SiteHeader />
        <div className="container relative grid min-h-[620px] items-center gap-12 py-16 sm:py-20 lg:min-h-[680px] lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,.98fr)] lg:py-24">
          <div className="rise-in max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[.08em] text-primary shadow-[var(--shadow-sm)]"><span className="size-2 rounded-full bg-primary" />Quiz AI · Tạo · Chia sẻ · Học</div>
            <h1 className="mt-7 max-w-4xl font-serif text-[clamp(2.5rem,6vw,4.75rem)] font-extrabold leading-[1.08] tracking-[-.05em] text-foreground">Tạo Quiz để học tập <span className="bg-[linear-gradient(135deg,var(--primary)_0%,var(--accent)_100%)] bg-clip-text text-transparent">rõ ràng hơn</span>.</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-8 text-text-secondary sm:text-[19px]">Biến văn bản, PDF, URL hoặc chủ đề bất kỳ thành trải nghiệm học tập tương tác—từ tạo câu hỏi, hoàn thiện Quiz đến chia sẻ cho người học.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="cta-gradient rounded-full px-7"><Link href={ROUTES.explore}>Khám phá miễn phí <ArrowRight size={18} /></Link></Button><Button asChild variant="outline" size="lg" className="rounded-full px-7"><AuthActionLink href={ROUTES.quizBuilder}>Tạo Quiz mới</AuthActionLink></Button></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-text-secondary"><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-success" /> Tạo Quiz thủ công</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-success" /> Có AI hỗ trợ</span><span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-success" /> Không cần thẻ thanh toán</span></div>
          </div>
          <div data-testid="hero-creation-preview" className="rise-in-delay relative hidden min-h-[420px] items-center justify-center lg:flex" aria-label="Xem trước luồng tạo Quiz">
            <div className="absolute left-5 top-8 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#087458]">Bước 01</p><p className="mt-1 text-sm font-bold text-foreground">Tải tệp hoặc chọn chủ đề</p></div>
            <div className="relative w-full max-w-[500px] overflow-hidden rounded-[30px] border border-white/90 bg-[linear-gradient(135deg,#edfff0_0%,#eee8ff_100%)] p-4 shadow-[0_28px_70px_rgba(76,55,141,.16)]">
              <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3"><div><p className="text-xs font-bold text-[#5d249f]">AI Quiz Workspace</p><p className="mt-1 text-[11px] text-text-secondary">Từ nội dung đến bài học hoàn chỉnh</p></div><span className="rounded-full bg-[#e8dbff] px-3 py-1 text-[11px] font-bold text-[#7035c1]">2 bước</span></div>
              <img src="/manus-storage/quiz_landing_1_1_image_en_2x_27b3e0b5.webp" alt="" className="mt-2 h-[278px] w-full object-contain" />
            </div>
            <div className="absolute bottom-8 right-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[var(--shadow-md)] backdrop-blur"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#5d249f]">Bước 02</p><p className="mt-1 text-sm font-bold text-foreground">Chia sẻ bằng QR hoặc mã</p></div>
          </div>
        </div>
      </section>

      <main>
        <section aria-labelledby="quiz-ai-showcase-title" className="container py-16 lg:py-24">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Quiz AI</p>
              <h2 id="quiz-ai-showcase-title" className="mt-3 max-w-2xl font-serif font-bold">Tạo câu hỏi từ nội dung bạn đã có.</h2>
            </div>
            <AuthActionLink href={ROUTES.quizBuilder} className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-primary">Bắt đầu tạo Quiz <span className="grid size-8 place-items-center rounded-full bg-primary-light transition-transform duration-200 group-hover:translate-x-1"><ArrowRight size={15} /></span></AuthActionLink>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ScrollReveal className="lg:col-span-2">
            <article className="relative isolate overflow-hidden rounded-[28px] border border-[#b7e7c5] bg-[linear-gradient(115deg,#effff1_0%,#dff9e6_100%)] p-7 shadow-[0_16px_38px_rgba(24,105,64,.08)] sm:p-10 lg:min-h-[330px]">
              <div className="relative z-10 max-w-[450px]">
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#087458] shadow-sm">Tạo nhanh với AI</span>
                <h3 className="mt-5 text-[clamp(1.8rem,3vw,2.55rem)] font-extrabold leading-tight tracking-[-.035em] text-[#087458]">Tạo câu hỏi nhanh chóng, dễ dàng với QUIZ AI!</h3>
                <p className="mt-4 max-w-md text-[15px] font-medium leading-7 text-[#285848]">Chỉ cần tải lên tệp hoặc nhập chủ đề, AI sẽ tìm điểm chính để tạo câu hỏi và tự điều chỉnh độ khó.</p>
                <Button asChild className="mt-7 rounded-full bg-[#087458] px-6 text-white hover:bg-[#065f48]"><AuthActionLink href={ROUTES.quizBuilder}>Tạo Quiz với AI <ArrowRight size={16} /></AuthActionLink></Button>
              </div>
              <img src="/manus-storage/v3_2_1_image_en_2x_5b02546b.webp" alt="Minh họa AI biến tài liệu thành Quiz" className="pointer-events-none relative z-0 mx-auto mt-5 block w-full max-w-[510px] object-contain sm:absolute sm:-bottom-5 sm:right-5 sm:mt-0 sm:w-[51%]" />
            </article>
            </ScrollReveal>
            <ScrollReveal delay={70}>
            <article className="relative isolate min-h-[390px] overflow-hidden rounded-[28px] border border-[#b7e7c5] bg-[linear-gradient(135deg,#eaffeb_0%,#c9f8d5_100%)] p-7 shadow-[0_16px_38px_rgba(24,105,64,.07)] sm:p-10">
              <div className="relative z-10 max-w-[395px]">
                <h3 className="text-[clamp(1.55rem,2.5vw,2.2rem)] font-extrabold leading-tight tracking-[-.03em] text-[#087458]">Câu hỏi, đáp án và lựa chọn—tất cả đã sẵn sàng.</h3>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-7 text-[#285848]">Hãy để AI lo toàn bộ quá trình tạo Quiz, từ câu hỏi đến các lựa chọn đáp án.</p>
              </div>
              <img src="/manus-storage/v3_2_2_image_en_2x_e8570fbb.webp" alt="Minh họa AI tạo đáp án và lựa chọn" className="pointer-events-none absolute bottom-0 left-1/2 w-[118%] max-w-[620px] -translate-x-1/2 object-contain sm:w-[104%]" />
            </article>
            </ScrollReveal>
            <ScrollReveal delay={140}>
            <article className="relative isolate min-h-[390px] overflow-hidden rounded-[28px] border border-[#d8e4d7] bg-[linear-gradient(135deg,#fbfffb_0%,#eef8ed_100%)] p-7 shadow-[0_16px_38px_rgba(34,72,41,.07)] sm:p-10">
              <div className="relative z-10 max-w-[410px]">
                <h3 className="text-[clamp(1.55rem,2.5vw,2.2rem)] font-extrabold leading-tight tracking-[-.03em] text-[#087458]">AI biến một câu hỏi thành nhiều phiên bản chỉ trong tích tắc.</h3>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-7 text-[#285848]">Tạo các câu hỏi mới dựa trên nội dung đã soạn, lý tưởng cho ôn bài và nâng cao năng lực học tập.</p>
              </div>
              <span aria-hidden="true" className="absolute -bottom-2 -left-6 size-20 rounded-full bg-[#cdc8ff]/55 blur-[1px]" />
              <span aria-hidden="true" className="absolute bottom-8 right-5 size-14 rounded-full bg-[#71baf7]/50" />
              <img src="/manus-storage/v3_2_3_image_en_2x_33af5b55.webp" alt="Minh họa AI gợi ý nhiều phiên bản câu hỏi" className="pointer-events-none absolute bottom-0 left-1/2 w-[124%] max-w-[640px] -translate-x-1/2 object-contain sm:w-[106%]" />
            </article>
            </ScrollReveal>
          </div>
        </section>

        <section aria-labelledby="quiz-journey-title" className="container pb-16 lg:pb-24">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-accent">Tạo và chia sẻ</p>
              <h2 id="quiz-journey-title" className="mt-3 max-w-2xl font-serif font-bold">Từ ý tưởng đến trải nghiệm học tập.</h2>
            </div>
            <AuthActionLink href={ROUTES.quizBuilder} className="group inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-accent">Tạo Quiz trong 2 bước <span className="grid size-8 place-items-center rounded-full bg-accent/10 transition-transform duration-200 group-hover:translate-x-1"><ArrowRight size={15} /></span></AuthActionLink>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ScrollReveal className="lg:col-span-2">
            <article className="relative isolate overflow-hidden rounded-[28px] border border-[#decff9] bg-[linear-gradient(118deg,#f8f3ff_0%,#eee2ff_100%)] p-7 shadow-[0_16px_38px_rgba(112,64,180,.08)] sm:p-10 lg:min-h-[340px]">
              <div className="relative z-10 max-w-[460px]">
                <span className="inline-flex items-center rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#6a32b8] shadow-sm">Tạo Quiz siêu tốc</span>
                <h3 className="mt-5 text-[clamp(1.8rem,3vw,2.55rem)] font-extrabold leading-tight tracking-[-.035em] text-[#5d249f]">Chọn một mẫu, thêm câu hỏi, và nhận ngay Quiz của bạn!</h3>
                <p className="mt-4 max-w-md text-[15px] font-medium leading-7 text-[#4c4262]">Không có nhiều thời gian? Bạn vẫn có thể tạo bài Quiz nhanh chóng chỉ với hai bước rõ ràng.</p>
                <Button asChild className="mt-7 rounded-full bg-[#7035c1] px-6 text-white hover:bg-[#5d249f]"><AuthActionLink href={ROUTES.quizBuilder}>Tạo Quiz ngay <ArrowRight size={16} /></AuthActionLink></Button>
              </div>
              <img src="/manus-storage/quiz_landing_1_1_image_en_2x_27b3e0b5.webp" alt="Minh họa hai bước tạo Quiz từ mẫu có sẵn" className="pointer-events-none relative z-0 mx-auto mt-6 block w-full max-w-[590px] object-contain sm:absolute sm:-bottom-3 sm:right-1 sm:mt-0 sm:w-[54%]" />
            </article>
            </ScrollReveal>
            <ScrollReveal delay={70}>
            <article className="relative isolate min-h-[410px] overflow-hidden rounded-[28px] border border-[#decff9] bg-[linear-gradient(135deg,#f2e6ff_0%,#e4d0ff_100%)] p-7 shadow-[0_16px_38px_rgba(112,64,180,.07)] sm:p-10">
              <div className="relative z-10 max-w-[440px]">
                <h3 className="text-[clamp(1.55rem,2.5vw,2.2rem)] font-extrabold leading-tight tracking-[-.03em] text-[#5d249f]">Dễ dàng tìm và sử dụng các câu hỏi có sẵn phù hợp với chương trình học.</h3>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-7 text-[#4c4262]">Tìm kiếm, sao chép và tùy chỉnh câu hỏi nhanh chóng để hoàn thiện bài học cho lớp của bạn.</p>
              </div>
              <img src="/manus-storage/quiz_landing_1_2_image_en_2x_abdeac42.webp" alt="Minh họa sao chép và tùy chỉnh câu hỏi có sẵn" className="pointer-events-none absolute bottom-0 left-1/2 w-[122%] max-w-[650px] -translate-x-1/2 object-contain sm:w-[108%]" />
            </article>
            </ScrollReveal>
            <ScrollReveal delay={140}>
            <article className="relative isolate min-h-[410px] overflow-hidden rounded-[28px] border border-[#e5e2ea] bg-[linear-gradient(135deg,#fdfbff_0%,#f5f1fa_100%)] p-7 shadow-[0_16px_38px_rgba(68,50,95,.07)] sm:p-10">
              <div className="relative z-10 max-w-[440px]">
                <h3 className="text-[clamp(1.55rem,2.5vw,2.2rem)] font-extrabold leading-tight tracking-[-.03em] text-[#5d249f]">Truy cập nhanh bằng mã QR hoặc mã tham gia.</h3>
                <p className="mt-4 max-w-sm text-[15px] font-medium leading-7 text-[#4c4262]">Học viên vào bài ngay trên trình duyệt, không cần tải ứng dụng và không phải chờ đợi.</p>
              </div>
              <span aria-hidden="true" className="absolute -bottom-4 -right-4 size-24 rounded-full bg-[#e7ddff]" />
              <img src="/manus-storage/quiz_landing_1_3_image_kr_2x_31ee6c2a.webp" alt="Minh họa tham gia Quiz bằng mã QR trên nhiều thiết bị" className="pointer-events-none absolute bottom-0 left-1/2 w-[124%] max-w-[650px] -translate-x-1/2 object-contain sm:w-[108%]" />
            </article>
            </ScrollReveal>
          </div>
        </section>

        <section className="container py-16 lg:py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Khám phá có định hướng</p><h2 className="mt-3 max-w-2xl font-serif font-bold">Nội dung được tổ chức để bạn không phải học một mình.</h2></div><Link href="/kham-pha" className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-primary">Xem toàn bộ thư viện <span className="grid size-8 place-items-center rounded-full bg-primary-light transition-transform group-hover:translate-x-1"><ArrowRight size={15} /></span></Link></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{pathways.map((pathway, index) => <div key={pathway.step} className="relative rounded-[var(--radius-lg-token)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"><span className="text-xs font-bold text-primary">{pathway.step}</span><pathway.icon className="mt-7 text-primary" size={22} /><p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-text-muted">{pathway.label}</p><p className="mt-1 text-lg font-bold text-foreground">{pathway.value}</p><p className="mt-2 text-sm text-text-secondary">{pathway.note}</p>{index < pathways.length - 1 ? <ChevronRight className="absolute -right-5 top-1/2 z-10 hidden rounded-full border border-border bg-surface p-1 text-primary lg:block" size={27} /> : null}</div>)}</div>
        </section>

        <section className="border-y border-border-light bg-surface py-16 lg:py-24"><div className="container"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Bắt đầu từ hôm nay</p><h2 className="mt-3 font-serif font-bold">Bộ đề được quan tâm</h2></div><span className="w-fit rounded-full bg-muted px-4 py-2 text-xs font-semibold text-text-secondary">{catalogQuery.isLoading ? "Đang cập nhật" : catalogQuery.isError ? "Chưa thể cập nhật catalog" : `${visibleSpotlight.length} bộ đề phù hợp`}</span></div><form onSubmit={submitSearch} className="mt-8 rounded-[var(--radius-lg-token)] border border-border bg-background p-3 shadow-[var(--shadow-sm)]"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]"><label className="relative"><span className="sr-only">Tìm bộ đề</span><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><input value={search} onChange={event => setSearch(event.target.value)} className="field pl-10" placeholder="Tìm theo tên Quiz, chủ đề hoặc môn học…" /></label><label className="relative"><span className="sr-only">Sắp xếp bộ đề</span><SlidersHorizontal aria-hidden="true" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" /><select value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)} className="field appearance-none pl-9 text-sm"><option value="newest">Mới công bố</option><option value="popular">Lượt làm nhiều</option><option value="reward">Thưởng cao</option></select></label></div><div className="mt-3 flex flex-wrap gap-2" aria-label="Lọc theo chủ đề">{topics.map(topic => <button key={topic} type="button" onClick={() => setSelectedTopic(topic)} aria-pressed={selectedTopic === topic} className={`min-h-9 rounded-full px-3 text-xs font-bold ${selectedTopic === topic ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]" : "bg-surface text-text-secondary hover:bg-muted hover:text-foreground"}`}>{topic}</button>)}</div></form>{catalogQuery.isError ? <div role="alert" className="mt-10 flex flex-col items-center rounded-[var(--radius-xl-token)] border border-dashed border-danger/35 bg-danger/5 p-9 text-center"><p className="text-xl font-bold text-foreground">Chưa thể cập nhật thư viện bộ đề.</p><p className="mt-2 max-w-xl text-sm text-text-secondary">Dữ liệu mới nhất tạm thời chưa khả dụng. Bạn có thể thử tải lại danh sách.</p><Button onClick={() => catalogQuery.refetch()} className="mt-5 rounded-full">Thử lại</Button></div> : visibleSpotlight.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{visibleSpotlight.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}</div> : <div className="mt-10 rounded-[var(--radius-xl-token)] border border-dashed border-border bg-muted p-9 text-center"><p className="text-xl font-bold text-foreground">Chưa tìm thấy bộ đề phù hợp.</p><p className="mt-2 text-sm text-text-secondary">Hãy thử từ khóa khác hoặc đặt lại danh mục để xem toàn bộ thư viện.</p><Button onClick={() => { setSearch(""); setSelectedTopic("Tất cả"); setSortBy("newest"); }} variant="outline" className="mt-5 rounded-full">Đặt lại bộ lọc</Button></div>}</div></section>

        <section className="container pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-14 lg:pt-12"><div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]"><div className="rounded-[var(--radius-xl-token)] border border-border bg-surface p-7 shadow-[var(--shadow-sm)] lg:p-10"><span className="grid size-11 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary"><Crown size={20} /></span><p className="mt-7 text-[11px] font-bold uppercase tracking-[.16em] text-primary">Không chỉ là bài kiểm tra</p><h2 className="mt-3 font-serif font-bold">Mỗi kết quả đều cho bạn biết bước tiếp theo.</h2><p className="mt-5 max-w-md text-sm leading-6 text-text-secondary">Xem tỷ lệ đúng, xem lại lời giải, lưu câu cần ôn và trở lại với một kế hoạch rõ ràng hơn.</p><Button asChild variant="outline" className="mt-7 rounded-full"><Link href="/ho-so">Khám phá hồ sơ học tập <ArrowRight size={14} /></Link></Button></div><div className="rounded-[var(--radius-xl-token)] bg-[linear-gradient(135deg,var(--primary)_0%,var(--accent)_100%)] p-7 text-white shadow-[var(--shadow-md)] lg:p-10"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/75">Chuẩn mực làm bài</p><h3 className="mt-2 text-3xl font-bold text-white">Tập trung và công bằng</h3></div><ShieldCheck className="text-white" size={34} /></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><Feature icon={Sparkles} title="Đề xáo trộn" description="Mỗi lượt làm có một thứ tự riêng." /><Feature icon={TimerReset} title="Theo thời gian" description="Tự động nộp bài khi hết giờ." /><Feature icon={BrainCircuit} title="Phản hồi sâu" description="Lời giải và trợ lý AI sau bài." /></div></div></div></section>
      </main>
    </div>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
  return <div className="rounded-[var(--radius-md-token)] bg-white/12 p-4"><Icon size={18} className="text-white" /><p className="mt-4 text-sm font-bold text-white">{title}</p><p className="mt-2 text-xs leading-5 text-white/75">{description}</p></div>;
}

function ScrollReveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof window === "undefined" || !window.IntersectionObserver || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setRevealed(true);
        observer.disconnect();
      }
    }, { threshold: 0.14 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} data-scroll-reveal="true" data-revealed={revealed ? "true" : "false"} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties} className={`home-scroll-reveal ${className}`}>{children}</div>;
}
