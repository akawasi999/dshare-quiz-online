import QuizCard from "@/components/QuizCard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { showcaseQuizzes } from "@/data/demo";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookMarked, BrainCircuit, CheckCircle2, ChevronRight, CircleHelp, Compass, Crown, Layers3, Search, ShieldCheck, Sparkles, TimerReset, Trophy } from "lucide-react";
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
  const [, setLocation] = useLocation();
  const catalogQuery = trpc.catalog.list.useQuery();
  const spotlight = useMemo(() => catalogQuery.data?.length ? showcaseQuizzes : showcaseQuizzes, [catalogQuery.data]);
  const visibleSpotlight = spotlight.filter(quiz => (selectedTopic === "Tất cả" || quiz.category === selectedTopic) && (!search.trim() || `${quiz.title} ${quiz.category} ${quiz.subject} ${quiz.lesson}`.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN"))));
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    document.querySelector("main > section:nth-of-type(2)")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#ebf4ff]">
      <section className="relative overflow-hidden bg-[#ebf4ff]">
        <SiteHeader />
        <div className="container relative flex min-h-[620px] items-center py-20 lg:min-h-[650px] lg:py-28">
          <div className="rise-in max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2563eb]/10 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[.08em] text-[#4f46e5] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#4f46e5]" /> 🏆 Tạo Quiz bằng AI</div>
            <h1 className="mt-8 font-serif text-[48px] font-semibold leading-[1.15] tracking-[-.05em] text-[#172554] sm:text-[64px] lg:text-[74px]">Tạo Quiz bằng <span className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] bg-clip-text text-transparent">Trí tuệ nhân tạo - AI</span></h1>
            <p className="mt-8 max-w-3xl text-[18px] leading-8 text-[#516172] sm:text-[20px]">Tạo quiz từ văn bản, file PDF, URL hoặc chủ đề bất kỳ. Chấm điểm AI, không gian làm bài và xuất Excel trong cùng một nền tảng.</p>
            <Button asChild className="cta-gradient mt-10 h-16 rounded-full px-8 text-base font-bold text-white"><Link href="/kham-pha">Khám phá miễn phí <ArrowRight size={20} /></Link></Button>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-[#516172]"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Tạo FlipCard miễn phí</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Tạo Quiz thủ công</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Không cần thẻ thanh toán</span></div>
          </div>
        </div>
      </section>

      <main>
        <section className="container py-20 lg:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#f59e0b]">Khám phá có định hướng</p><h2 className="mt-3 max-w-2xl font-serif text-[35px] font-semibold leading-[1.13] tracking-[-.04em] text-[#172554] sm:text-[44px]">Nội dung được tổ chức để bạn không phải học một mình.</h2></div><Link href="/kham-pha" className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#172554]">Xem toàn bộ thư viện <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef4ff] transition-transform group-hover:translate-x-1"><ArrowRight size={15} /></span></Link></div>
          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{pathways.map((pathway, index) => <div key={pathway.step} className="relative rounded-[22px] border border-[#172554]/8 bg-[#fff7e6] p-5"><span className="font-mono text-[10px] text-[#f59e0b]">{pathway.step}</span><pathway.icon className="mt-8 text-[#172554]" size={22} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#617786]">{pathway.label}</p><p className="mt-1 font-serif text-[21px] font-semibold leading-tight text-[#172554]">{pathway.value}</p><p className="mt-2 text-xs text-[#617786]">{pathway.note}</p>{index < pathways.length - 1 && <ChevronRight className="absolute -right-5 top-1/2 z-10 hidden rounded-full bg-[#fff7e6] p-1 text-[#d97706] lg:block" size={27} />}</div>)}</div>
        </section>

        <section className="bg-[#fff7e6] py-20 lg:py-28"><div className="container"><div className="flex items-end justify-between gap-5"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#f59e0b]">Bắt đầu từ hôm nay</p><h2 className="mt-3 font-serif text-[35px] font-semibold tracking-[-.04em] text-[#172554] sm:text-[44px]">Bộ đề được quan tâm</h2></div><span className="hidden rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-semibold text-[#617786] md:block">{catalogQuery.isLoading ? "Đang cập nhật" : catalogQuery.isError ? "Chưa thể cập nhật catalog" : selectedTopic === "Tất cả" ? "Mới nhất trong thư viện" : `Chủ đề: ${selectedTopic}`}</span></div>{catalogQuery.isError ? <div role="alert" className="mt-10 flex flex-col items-center rounded-[24px] border border-dashed border-[#d97706]/30 bg-white/70 p-9 text-center"><p className="font-serif text-[25px] font-semibold text-[#172554]">Chưa thể cập nhật thư viện bộ đề.</p><p className="mt-2 max-w-xl text-sm text-[#617786]">Dữ liệu mới nhất tạm thời chưa khả dụng. Bạn có thể thử tải lại danh sách.</p><Button onClick={() => catalogQuery.refetch()} className="mt-5 rounded-full bg-[#172554] text-xs">Thử lại</Button></div> : visibleSpotlight.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{visibleSpotlight.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}</div> : <div className="mt-10 rounded-[24px] border border-dashed border-[#172554]/15 bg-white/60 p-9 text-center"><p className="font-serif text-[25px] font-semibold text-[#172554]">Chưa tìm thấy bộ đề phù hợp.</p><p className="mt-2 text-sm text-[#617786]">Hãy thử từ khóa khác hoặc đặt lại danh mục để xem toàn bộ thư viện.</p><Button onClick={() => { setSearch(""); setSelectedTopic("Tất cả"); }} className="mt-5 rounded-full bg-[#172554] text-xs">Đặt lại bộ lọc</Button></div>}</div></section>

        <section className="container py-20 lg:py-28"><div className="grid gap-7 lg:grid-cols-[.95fr_1.05fr]"><div className="rounded-[30px] bg-[#fff7e6] p-8 lg:p-10"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#172554] text-[#fff7e6]"><Crown size={19} /></span><p className="mt-8 text-[11px] font-bold uppercase tracking-[.16em] text-[#d97706]">Không chỉ là bài kiểm tra</p><h2 className="mt-3 font-serif text-[34px] font-semibold leading-[1.12] tracking-[-.045em] text-[#172554]">Mỗi kết quả đều cho bạn biết bước tiếp theo.</h2><p className="mt-5 max-w-md text-sm leading-6 text-[#172554]">Xem tỷ lệ đúng, xem lại lời giải, lưu câu cần ôn và trở lại với một kế hoạch rõ ràng hơn.</p><Link href="/ho-so" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#172554] px-5 py-3 text-xs font-bold text-[#fff7e6] hover:bg-[#172554]">Khám phá hồ sơ học tập <ArrowRight size={14} /></Link></div><div className="rounded-[30px] bg-[#172554] p-8 text-[#fff7e6] lg:p-10"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#fbbf24]">Chuẩn mực làm bài</p><h3 className="mt-2 font-serif text-[31px] font-semibold tracking-[-.035em]">Tập trung và công bằng</h3></div><ShieldCheck className="text-[#fbbf24]" size={34} /></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[.07] p-4"><Sparkles className="text-[#fbbf24]" size={17} /><p className="mt-4 text-xs font-bold">Đề xáo trộn</p><p className="mt-2 text-[11px] leading-5 text-[#eef4ff]">Mỗi lượt làm có một thứ tự riêng.</p></div><div className="rounded-2xl bg-white/[.07] p-4"><TimerReset className="text-[#fbbf24]" size={17} /><p className="mt-4 text-xs font-bold">Theo thời gian</p><p className="mt-2 text-[11px] leading-5 text-[#eef4ff]">Tự động nộp bài khi hết giờ.</p></div><div className="rounded-2xl bg-white/[.07] p-4"><BrainCircuit className="text-[#fbbf24]" size={17} /><p className="mt-4 text-xs font-bold">Phản hồi sâu</p><p className="mt-2 text-[11px] leading-5 text-[#eef4ff]">Lời giải và trợ lý AI sau bài.</p></div></div></div></div></section>
      </main>
      <footer id="ve-dshare" className="border-t border-[#172554]/10 bg-[#fff7e6]"><div className="container flex flex-col gap-6 py-9 text-xs text-[#617786] md:flex-row md:items-center md:justify-between"><p><span className="font-serif text-base font-semibold text-[#172554]">dshare</span> · Nơi việc học được thiết kế có chủ đích.</p><div className="flex gap-5"><Link href="/bang-gia">Gói học</Link><Link href="/kham-pha">Thư viện</Link><Link href="/bang-xep-hang">Xếp hạng</Link></div></div></footer>
    </div>
  );
}
