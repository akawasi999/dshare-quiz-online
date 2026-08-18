import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { createLeaderboardInput, getLeaderboardHeading, type LeaderboardScope } from "@/lib/leaderboardUtils";
import { Award, Crown, Loader2, Medal, Target, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function Leaderboard() {
  const [scope, setScope] = useState<LeaderboardScope>("all");
  const [quizId, setQuizId] = useState<number | null>(null);
  const catalog = trpc.catalog.list.useQuery();
  const leaderboardInput = useMemo(() => createLeaderboardInput(scope, quizId), [scope, quizId]);
  const leaderboard = trpc.leaderboard.list.useQuery(leaderboardInput);
  const selectedQuiz = catalog.data?.find(quiz => quiz.quizId === quizId);
  const isQuizScope = scope === "quiz" && Boolean(quizId);
  const heading = getLeaderboardHeading(scope, selectedQuiz?.title);

  return <div className="min-h-screen bg-[#fff7e6]"><SiteHeader />
    <main className="container py-12 lg:py-16">
      <section className="relative overflow-hidden rounded-[32px] bg-[#172554] p-7 text-white shadow-[0_20px_50px_rgba(17,48,70,.18)] lg:p-11"><div className="relative z-10 max-w-xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#fbbf24]">Bảng xếp hạng</p><h1 className="mt-3 font-serif text-[42px] font-semibold tracking-[-.05em] sm:text-[55px]">Ghi nhận một hành trình bền bỉ.</h1><p className="mt-4 text-sm leading-6 text-[#eef4ff]">So sánh thành tích trên toàn Dshare hoặc tập trung vào một bộ đề cụ thể. Điểm số là dấu mốc để nhìn lại quá trình học có mục tiêu.</p></div><Trophy className="absolute right-[max(8%,calc((100%-1180px)/2))] top-28 hidden text-[#fbbf24]/20 lg:block" size={180} /></section>
      <section className="mt-9 grid gap-6 lg:grid-cols-[1fr_.32fr]">
        <div className="rounded-[28px] border border-[#172554]/8 bg-white p-5 sm:p-7"><div className="border-b border-[#172554]/8 pb-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#f59e0b]">Phạm vi đang xem</p><h2 className="mt-2 font-serif text-[29px] font-semibold tracking-[-.035em] text-[#172554]">{heading}</h2><p className="mt-1 text-xs text-[#617786]">Xếp theo điểm cao nhất, sau đó là số lượt hoàn thành.</p></div><div className="flex w-fit gap-1 rounded-full bg-[#eef4ff] p-1"><button type="button" onClick={() => setScope("all")} className={`rounded-full px-3 py-2 text-[11px] font-semibold transition ${scope === "all" ? "bg-[#172554] text-white" : "text-[#617786] hover:text-[#172554]"}`}>Toàn hệ thống</button><button type="button" onClick={() => setScope("quiz")} className={`rounded-full px-3 py-2 text-[11px] font-semibold transition ${scope === "quiz" ? "bg-[#172554] text-white" : "text-[#617786] hover:text-[#172554]"}`}>Theo bộ đề</button></div></div>
          {scope === "quiz" ? <div className="mt-5"><label htmlFor="leaderboard-quiz" className="text-[10px] font-bold uppercase tracking-[.13em] text-[#617786]">Chọn bộ đề</label><select id="leaderboard-quiz" value={quizId ?? ""} onChange={event => setQuizId(event.target.value ? Number(event.target.value) : null)} className="mt-2 h-11 w-full rounded-xl border border-[#172554]/10 bg-[#fff7e6] px-3 text-sm text-[#172554] outline-none focus:border-[#f59e0b]" disabled={catalog.isLoading}><option value="">{catalog.isLoading ? "Đang tải bộ đề…" : "Chọn một bộ đề"}</option>{catalog.data?.map(quiz => <option key={quiz.quizId} value={quiz.quizId}>{quiz.title} · {quiz.categoryTitle}</option>)}</select>{catalog.isError ? <p className="mt-2 text-xs text-[#a35449]">Chưa tải được danh sách bộ đề. Vui lòng thử lại sau.</p> : null}</div> : null}</div>
          {scope === "quiz" && !quizId ? <ScopePrompt /> : leaderboard.isLoading ? <div className="flex items-center justify-center gap-2 py-16 text-center text-sm text-[#617786]" role="status"><Loader2 className="animate-spin text-[#2563eb]" size={17} />Đang tải thành tích…</div> : leaderboard.isError ? <div className="py-14 text-center" role="alert"><CircleAlertIcon /><h3 className="mt-4 font-serif text-2xl font-semibold text-[#172554]">Chưa tải được bảng thành tích</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617786]">Vui lòng thử lại để xem các dấu mốc mới nhất.</p><Button onClick={() => leaderboard.refetch()} className="mt-6 rounded-full bg-[#172554]">Thử lại</Button></div> : leaderboard.data?.length ? <div className="divide-y divide-[#172554]/7">{leaderboard.data.map((entry, index) => <div key={entry.userId} className="flex items-center gap-4 py-5"><RankBadge rank={index + 1} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#172554]">{entry.name ?? "Học viên Dshare"}</p><p className="mt-1 text-[11px] text-[#617786]">{entry.completedCount} lượt hoàn thành {isQuizScope ? "bộ đề này" : "hợp lệ"}</p></div><p className="font-serif text-[23px] font-semibold text-[#172554]">{entry.bestScore}<span className="ml-1 text-xs text-[#617786]">đ</span></p></div>)}</div> : <EmptyLeaderboard isQuizScope={isQuizScope} />}</div>
        <aside className="rounded-[28px] bg-[#fff7e6] p-6"><Crown className="text-[#d97706]" size={23} /><p className="mt-6 text-[10px] font-bold uppercase tracking-[.17em] text-[#d97706]">Cách ghi nhận</p><h2 className="mt-2 font-serif text-[28px] font-semibold leading-tight text-[#172554]">Một cuộc đua với chính mình.</h2><div className="mt-7 space-y-5 text-xs leading-5 text-[#617786]"><p><strong className="text-[#172554]">Điểm cao nhất:</strong> Kết quả tốt nhất của mỗi học viên trong phạm vi đang xem.</p><p><strong className="text-[#172554]">Nhịp học:</strong> Các lượt hoàn thành giúp duy trì sự nhất quán.</p><p><strong className="text-[#172554]">Công bằng:</strong> Mỗi đề kiểm tra được xáo trộn cho từng lượt làm.</p></div><Medal className="mt-8 text-[#d97706]" size={24} /></aside>
      </section>
    </main>
  </div>;
}

function RankBadge({ rank }: { rank: number }) {
  const icon = rank === 1 ? <Trophy size={15} /> : rank === 2 ? <Medal size={15} /> : rank === 3 ? <Award size={15} /> : rank;
  return <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-serif text-lg font-bold ${rank < 4 ? "bg-[#fbbf24] text-[#d97706]" : "bg-[#eef4ff] text-[#617786]"}`}>{icon}</span>;
}

function ScopePrompt() {
  return <div className="py-14 text-center"><Target className="mx-auto text-[#f59e0b]" size={28} /><h3 className="mt-4 font-serif text-2xl font-semibold text-[#172554]">Chọn bộ đề để xem thành tích</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617786]">Phạm vi này hiển thị điểm tốt nhất và số lượt hoàn thành của từng học viên cho bộ đề bạn chọn.</p></div>;
}

function EmptyLeaderboard({ isQuizScope }: { isQuizScope: boolean }) {
  return <div className="py-14 text-center"><Award className="mx-auto text-[#f59e0b]" size={28} /><h3 className="mt-4 font-serif text-2xl font-semibold text-[#172554]">{isQuizScope ? "Bộ đề này đang chờ dấu mốc đầu tiên" : "Bảng thành tích đang chờ dấu mốc đầu tiên"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617786]">Hoàn thành một bài kiểm tra để xuất hiện trong bảng xếp hạng của Dshare.</p><Button asChild className="mt-6 rounded-full bg-[#172554]"><Link href="/kham-pha">Khám phá bộ đề</Link></Button></div>;
}

function CircleAlertIcon() {
  return <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-[#f8eae6] text-sm font-bold text-[#a35449]">!</span>;
}
