import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { createLeaderboardInput, getLeaderboardHeading, type LeaderboardScope } from "@/lib/leaderboardUtils";
import { Award, Crown, Loader2, Medal, Sparkles, Target, Trophy } from "lucide-react";
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

  return <div className="min-h-screen bg-background text-foreground"><SiteHeader />
    <main className="container py-8 sm:py-10 lg:py-12">
      <section className="relative isolate overflow-hidden rounded-[var(--radius-xl-token)] bg-gradient-to-br from-primary via-primary to-accent px-6 py-8 text-primary-foreground shadow-[var(--shadow-lg)] sm:px-9 sm:py-10 lg:px-11 lg:py-12">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-28 hidden size-56 rounded-full border-[28px] border-white/10 sm:block" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-white"><Trophy size={13} /> Bảng xếp hạng</span>
          <h1 className="mt-5 max-w-xl font-serif text-4xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-5xl">Ghi nhận từng bước tiến của bạn.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/82 sm:text-[15px]">Theo dõi dấu mốc trên toàn Dshare hoặc trong từng bộ đề. Mỗi kết quả là một phần của hành trình học tập có mục tiêu.</p>
        </div>
        <Trophy className="absolute bottom-8 right-8 hidden text-white/15 lg:block" size={166} aria-hidden="true" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-[var(--radius-xl-token)] border border-border bg-surface shadow-[var(--shadow-sm)]">
          <div className="border-b border-border-light px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Phạm vi đang xem</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-.04em] text-foreground">{heading}</h2>
                <p className="mt-2 text-sm text-text-secondary">Ưu tiên điểm cao nhất, sau đó là số lượt hoàn thành hợp lệ.</p>
              </div>
              <div className="inline-flex w-fit rounded-full bg-muted p-1" role="group" aria-label="Chọn phạm vi xếp hạng">
                <button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")} className={`min-h-10 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${scope === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-primary"}`}>Toàn hệ thống</button>
                <button type="button" aria-pressed={scope === "quiz"} onClick={() => setScope("quiz")} className={`min-h-10 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${scope === "quiz" ? "bg-primary text-primary-foreground shadow-sm" : "text-text-secondary hover:text-primary"}`}>Theo bộ đề</button>
              </div>
            </div>
            {scope === "quiz" ? <div className="mt-6"><label htmlFor="leaderboard-quiz" className="text-[10px] font-bold uppercase tracking-[.13em] text-text-secondary">Chọn bộ đề</label><select id="leaderboard-quiz" value={quizId ?? ""} onChange={event => setQuizId(event.target.value ? Number(event.target.value) : null)} className="mt-2 h-11 w-full rounded-[var(--radius-sm-token)] border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/20" disabled={catalog.isLoading}><option value="">{catalog.isLoading ? "Đang tải bộ đề…" : "Chọn một bộ đề"}</option>{catalog.data?.map(quiz => <option key={quiz.quizId} value={quiz.quizId}>{quiz.title} · {quiz.categoryTitle}</option>)}</select>{catalog.isError ? <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-xs text-danger"><p>Chưa tải được danh sách bộ đề. Vui lòng thử lại sau.</p><Button variant="outline" onClick={() => catalog.refetch()} className="h-8 rounded-full px-3 text-[10px]">Thử lại</Button></div> : null}</div> : null}
          </div>

          <div className="px-5 py-2 sm:px-7">
            {scope === "quiz" && !quizId ? <ScopePrompt /> : leaderboard.isLoading ? <div className="flex items-center justify-center gap-2 py-20 text-center text-sm text-text-secondary" role="status"><Loader2 className="animate-spin text-primary" size={17} />Đang cập nhật thành tích…</div> : leaderboard.isError ? <div className="py-16 text-center" role="alert"><CircleAlertIcon /><h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">Chưa tải được bảng thành tích</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">Vui lòng thử lại để xem các dấu mốc mới nhất.</p><Button onClick={() => leaderboard.refetch()} className="mt-6 rounded-full">Thử lại</Button></div> : leaderboard.data?.length ? <ol className="divide-y divide-border-light">{leaderboard.data.map((entry, index) => <li key={entry.userId} className="flex items-center gap-4 py-5 first:pt-6"><RankBadge rank={index + 1} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{entry.name ?? "Học viên Dshare"}</p><p className="mt-1 text-xs text-text-secondary">{entry.completedCount} lượt hoàn thành {isQuizScope ? "bộ đề này" : "hợp lệ"}</p></div><div className="text-right"><p className="font-serif text-2xl font-semibold tracking-[-.03em] text-foreground">{entry.bestScore}<span className="ml-1 text-xs font-medium text-text-secondary">đ</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-success">Điểm cao nhất</p></div></li>)}</ol> : <EmptyLeaderboard isQuizScope={isQuizScope} />}
          </div>
        </div>

        <aside className="rounded-[var(--radius-xl-token)] border border-border bg-muted p-6 sm:p-7 xl:self-start"><span className="grid size-11 place-items-center rounded-2xl bg-primary-light text-primary"><Crown size={21} /></span><p className="mt-6 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Cách ghi nhận</p><h2 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-[-.04em] text-foreground">Mỗi lần làm tốt hơn là một chiến thắng.</h2><div className="mt-7 space-y-5 text-sm leading-6 text-text-secondary"><p><strong className="text-foreground">Điểm cao nhất.</strong> Mỗi học viên được ghi nhận bằng kết quả tốt nhất trong phạm vi đang xem.</p><p><strong className="text-foreground">Nhịp học.</strong> Các lượt hoàn thành hợp lệ phản ánh sự kiên trì của bạn.</p><p><strong className="text-foreground">Công bằng.</strong> Bộ đề luôn xáo trộn riêng cho từng lượt làm.</p></div><div className="mt-7 flex items-center gap-2 rounded-[var(--radius-md-token)] border border-primary/10 bg-surface px-4 py-3 text-xs font-semibold text-primary"><Sparkles size={15} />Tiếp tục học để tạo dấu mốc mới.</div></aside>
      </section>
    </main>
  </div>;
}

function RankBadge({ rank }: { rank: number }) {
  const icon = rank === 1 ? <Trophy size={16} /> : rank === 2 ? <Medal size={16} /> : rank === 3 ? <Award size={16} /> : rank;
  const tone = rank === 1 ? "bg-warning/15 text-warning" : rank === 2 ? "bg-primary-light text-primary" : rank === 3 ? "bg-accent/15 text-accent" : "bg-muted text-text-secondary";
  return <span aria-label={`Hạng ${rank}`} className={`grid size-10 shrink-0 place-items-center rounded-2xl font-serif text-base font-bold ${tone}`}>{icon}</span>;
}

function ScopePrompt() {
  return <div className="py-16 text-center"><Target className="mx-auto text-primary" size={30} /><h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">Chọn bộ đề để xem thành tích</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">Phạm vi này hiển thị điểm tốt nhất và số lượt hoàn thành của từng học viên cho bộ đề bạn chọn.</p></div>;
}

function EmptyLeaderboard({ isQuizScope }: { isQuizScope: boolean }) {
  return <div className="py-16 text-center"><Award className="mx-auto text-primary" size={30} /><h3 className="mt-4 font-serif text-2xl font-semibold text-foreground">{isQuizScope ? "Bộ đề này đang chờ dấu mốc đầu tiên" : "Bảng thành tích đang chờ dấu mốc đầu tiên"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">Hoàn thành một bài kiểm tra để xuất hiện trong bảng xếp hạng của Dshare.</p><Button asChild className="mt-6 rounded-full"><Link href="/kham-pha">Khám phá bộ đề</Link></Button></div>;
}

function CircleAlertIcon() {
  return <span className="mx-auto grid size-10 place-items-center rounded-full bg-danger/10 text-sm font-bold text-danger">!</span>;
}
