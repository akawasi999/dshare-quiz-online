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
    <div className="min-h-screen overflow-hidden bg-[#ebf8ff]">
      <section className="grain relative overflow-hidden bg-[#2a4365] text-white">
        <div className="pointer-events-none absolute inset-0 ink-grid opacity-60" />
        <div className="pointer-events-none absolute -right-32 top-14 h-[440px] w-[440px] rounded-full border border-[#4299e1]/35" />
        <div className="pointer-events-none absolute -right-6 top-36 h-[250px] w-[250px] rounded-full border border-[#4299e1]/40" />
        <SiteHeader variant="dark" />
        <div className="container relative grid min-h-[590px] gap-10 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pb-28 lg:pt-20">
          <div className="rise-in max-w-2xl">
            <div className="mb-7 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.19em] text-[#4299e1]"><span className="h-px w-8 bg-[#4299e1]" /> Học sâu hơn mỗi ngày</div>
            <h1 className="font-serif text-[42px] font-semibold leading-[1.04] tracking-[-.055em] sm:text-[58px] lg:text-[68px]">Một không gian<br /><em className="font-medium text-[#4299e1]">để tư duy tốt hơn.</em></h1>
            <p className="mt-7 max-w-xl text-[15px] leading-7 text-[#d3dfe2]">Dshare kết hợp lộ trình học có chủ đích, bộ đề được tuyển chọn và phản hồi rõ ràng để mỗi lần làm bài trở thành một bước tiến có ý nghĩa.</p>
            <form onSubmit={submitSearch} className="mt-9 flex max-w-xl items-center rounded-[18px] border border-white/15 bg-white/10 p-1.5 shadow-2xl backdrop-blur-sm">
              <Search className="ml-3 shrink-0 text-[#4299e1]" size={19} />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm bộ đề, môn học hoặc chủ đề..." className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-[#b9c7ca]" />
              <Button type="submit" className="h-12 rounded-[13px] bg-[#4299e1] px-5 text-xs font-bold text-white hover:bg-[#3182ce]">Tìm đề <ArrowRight size={15} /></Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">{["Tất cả", "Công nghệ", "Ngoại ngữ", "Kỹ năng"].map(topic => <button key={topic} onClick={() => setSelectedTopic(topic)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition-colors ${selectedTopic === topic ? "border-[#4299e1] bg-[#4299e1] text-white" : "border-white/15 bg-white/5 text-[#d8e1e1] hover:bg-white/10"}`}>{topic}</button>)}</div>
            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 text-xs text-[#bfd0d4]"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4299e1]" /> Lộ trình rõ ràng</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4299e1]" /> Tiến độ riêng tư</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4299e1]" /> Kết quả có giải thích</span></div>
          </div>
          <div className="rise-in-delay relative mx-auto w-full max-w-[470px] lg:mr-0">
            <div className="absolute -left-6 top-10 h-24 w-24 rounded-[28px] bg-[#4299e1]/35 blur-2xl" />
            <div className="relative rounded-[32px] border border-white/15 bg-[#163a52]/90 p-5 shadow-[0_35px_80px_rgba(0,0,0,.28)] backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between"><span className="font-serif text-[21px] font-medium">Hành trình hôm nay</span><span className="rounded-full bg-[#4299e1] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">19 Aug</span></div>
              <div className="mt-7 rounded-[22px] bg-[#0e293c] p-5">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[.14em] text-[#aabfc6]"><span>Chuyên đề đang học</span><span className="text-[#4299e1]">72%</span></div>
                <p className="mt-3 font-serif text-[26px] leading-tight">Lập trình Python</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#4299e1] to-[#3182ce]" /></div>
                <div className="mt-5 flex items-center justify-between text-xs text-[#c1d0d3]"><span>18 / 25 bài học</span><span className="flex items-center gap-1"><Trophy size={13} className="text-[#4299e1]" /> 1.240 Point</span></div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-[18px] border border-white/10 bg-white/[.05] p-4"><TimerReset size={17} className="text-[#4299e1]" /><p className="mt-3 text-[10px] font-bold uppercase tracking-[.13em] text-[#a9c0c6]">Nhịp học</p><p className="mt-1 font-serif text-[22px]">04 ngày</p></div><div className="rounded-[18px] border border-white/10 bg-white/[.05] p-4"><BrainCircuit size={17} className="text-[#4299e1]" /><p className="mt-3 text-[10px] font-bold uppercase tracking-[.13em] text-[#a9c0c6]">Độ chính xác</p><p className="mt-1 font-serif text-[22px]">86%</p></div></div>
              <Link href="/ho-so" className="mt-5 flex items-center justify-between rounded-[17px] bg-[#4299e1] px-5 py-4 text-xs font-bold text-white transition-colors hover:bg-[#3182ce]">Mở không gian học tập <ChevronRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="container py-20 lg:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a37b3a]">Khám phá có định hướng</p><h2 className="mt-3 max-w-2xl font-serif text-[35px] font-semibold leading-[1.13] tracking-[-.04em] text-[#16364d] sm:text-[44px]">Nội dung được tổ chức để bạn không phải học một mình.</h2></div><Link href="/kham-pha" className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#28516b]">Xem toàn bộ thư viện <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8ece9] transition-transform group-hover:translate-x-1"><ArrowRight size={15} /></span></Link></div>
          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{pathways.map((pathway, index) => <div key={pathway.step} className="relative rounded-[22px] border border-[#17334a]/8 bg-[#faf9f3] p-5"><span className="font-mono text-[10px] text-[#a88546]">{pathway.step}</span><pathway.icon className="mt-8 text-[#2c566e]" size={22} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#8a836f]">{pathway.label}</p><p className="mt-1 font-serif text-[21px] font-semibold leading-tight text-[#18364c]">{pathway.value}</p><p className="mt-2 text-xs text-[#71808a]">{pathway.note}</p>{index < pathways.length - 1 && <ChevronRight className="absolute -right-5 top-1/2 z-10 hidden rounded-full bg-[#e6dbb6] p-1 text-[#926f34] lg:block" size={27} />}</div>)}</div>
        </section>

        <section className="bg-[#f1f2ec] py-20 lg:py-28"><div className="container"><div className="flex items-end justify-between gap-5"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a37b3a]">Bắt đầu từ hôm nay</p><h2 className="mt-3 font-serif text-[35px] font-semibold tracking-[-.04em] text-[#16364d] sm:text-[44px]">Bộ đề được quan tâm</h2></div><span className="hidden rounded-full bg-[#dde3dd] px-4 py-2 text-xs font-semibold text-[#547066] md:block">{catalogQuery.isLoading ? "Đang cập nhật" : selectedTopic === "Tất cả" ? "Mới nhất trong thư viện" : `Chủ đề: ${selectedTopic}`}</span></div>{visibleSpotlight.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{visibleSpotlight.map(quiz => <QuizCard key={quiz.id} quiz={quiz} />)}</div> : <div className="mt-10 rounded-[24px] border border-dashed border-[#17334a]/15 bg-white/60 p-9 text-center"><p className="font-serif text-[25px] font-semibold text-[#173a51]">Chưa tìm thấy bộ đề phù hợp.</p><p className="mt-2 text-sm text-[#71818a]">Hãy thử từ khóa khác hoặc đặt lại danh mục để xem toàn bộ thư viện.</p><Button onClick={() => { setSearch(""); setSelectedTopic("Tất cả"); }} className="mt-5 rounded-full bg-[#173a51] text-xs">Đặt lại bộ lọc</Button></div>}</div></section>

        <section className="container py-20 lg:py-28"><div className="grid gap-7 lg:grid-cols-[.95fr_1.05fr]"><div className="rounded-[30px] bg-[#e9ddbd] p-8 lg:p-10"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#173a51] text-[#f8e2aa]"><Crown size={19} /></span><p className="mt-8 text-[11px] font-bold uppercase tracking-[.16em] text-[#856829]">Không chỉ là bài kiểm tra</p><h2 className="mt-3 font-serif text-[34px] font-semibold leading-[1.12] tracking-[-.045em] text-[#173a51]">Mỗi kết quả đều cho bạn biết bước tiếp theo.</h2><p className="mt-5 max-w-md text-sm leading-6 text-[#455a5f]">Xem tỷ lệ đúng, xem lại lời giải, lưu câu cần ôn và trở lại với một kế hoạch rõ ràng hơn.</p><Link href="/ho-so" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#173a51] px-5 py-3 text-xs font-bold text-[#fff9ec] hover:bg-[#28516b]">Khám phá hồ sơ học tập <ArrowRight size={14} /></Link></div><div className="rounded-[30px] bg-[#173a51] p-8 text-[#fffaf0] lg:p-10"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#e0c98d]">Chuẩn mực làm bài</p><h3 className="mt-2 font-serif text-[31px] font-semibold tracking-[-.035em]">Tập trung và công bằng</h3></div><ShieldCheck className="text-[#e0c98d]" size={34} /></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/[.07] p-4"><Sparkles className="text-[#e0c98d]" size={17} /><p className="mt-4 text-xs font-bold">Đề xáo trộn</p><p className="mt-2 text-[11px] leading-5 text-[#bfcfd4]">Mỗi lượt làm có một thứ tự riêng.</p></div><div className="rounded-2xl bg-white/[.07] p-4"><TimerReset className="text-[#e0c98d]" size={17} /><p className="mt-4 text-xs font-bold">Theo thời gian</p><p className="mt-2 text-[11px] leading-5 text-[#bfcfd4]">Tự động nộp bài khi hết giờ.</p></div><div className="rounded-2xl bg-white/[.07] p-4"><BrainCircuit className="text-[#e0c98d]" size={17} /><p className="mt-4 text-xs font-bold">Phản hồi sâu</p><p className="mt-2 text-[11px] leading-5 text-[#bfcfd4]">Lời giải và trợ lý AI sau bài.</p></div></div></div></div></section>
      </main>
      <footer id="ve-dshare" className="border-t border-[#17334a]/10 bg-[#fffdf8]"><div className="container flex flex-col gap-6 py-9 text-xs text-[#6b7982] md:flex-row md:items-center md:justify-between"><p><span className="font-serif text-base font-semibold text-[#173a51]">dshare</span> · Nơi việc học được thiết kế có chủ đích.</p><div className="flex gap-5"><Link href="/bang-gia">Gói học</Link><Link href="/kham-pha">Thư viện</Link><Link href="/bang-xep-hang">Xếp hạng</Link></div></div></footer>
    </div>
  );
}
