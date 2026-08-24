import { useAuth } from "@/_core/hooks/useAuth";
import AccountLayout from "@/components/AccountLayout";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { sharedDataQueryOptions } from "@/lib/sharedDataSync";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Crown,
  LogIn,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const missionLabel: Record<string, string> = { daily: "Hôm nay", weekly: "Tuần này", special: "Chiến dịch" };
const sprite = {
  hero: "/manus-storage/profile-hero-trophy_87fb785e.png",
  coins: "/manus-storage/profile-point-coins_782cc901.png",
  xp: "/manus-storage/profile-xp-badge_e616906b.png",
  award: "/manus-storage/profile-award-shield_fe511aac.png",
  gift: "/manus-storage/profile-referral-gift_f2462395.png",
  achievement: [
    "/manus-storage/profile-achievement-trophy_c0843780.png",
    "/manus-storage/profile-achievement-star_ddc84461.png",
    "/manus-storage/profile-achievement-target_7d443998.png",
    "/manus-storage/profile-achievement-flame_5b0d5a41.png",
  ],
};

function formatNumber(value: number) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function formatStudyDate(value: Date | null | undefined) {
  return value ? new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" }) : "Đang cập nhật";
}

export default function Profile() {
  const { user, loading } = useAuth();
  const summary = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const history = trpc.learner.history.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const gamification = trpc.learner.gamification.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const leaderboard = trpc.leaderboard.xp.useQuery({ period: "week" }, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const referral = trpc.learner.referral.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const [copied, setCopied] = useState(false);

  if (loading) return <ProfileShell><ProfileLoadingState label="Đang mở trung tâm học tập…" /></ProfileShell>;
  if (!user) return <ProfileShell><SignInState /></ProfileShell>;
  if (summary.isLoading) return <ProfileShell><ProfileLoadingState label="Đang đồng bộ hành trình học tập…" /></ProfileShell>;
  if (summary.error || !summary.data) return <ProfileShell><ProfileErrorState message={summary.error?.message} onRetry={() => summary.refetch()} /></ProfileShell>;

  const { profile, stats } = summary.data;
  const game = gamification.data;
  const currentLevel = game?.currentLevel;
  const nextLevel = game?.nextLevel;
  const xpBalance = profile.xpBalance ?? 0;
  const levelFloor = currentLevel?.minXp ?? 0;
  const levelTarget = nextLevel?.minXp ?? Math.max(levelFloor, xpBalance);
  const xpProgress = nextLevel ? Math.min(100, Math.max(0, Math.round(((xpBalance - levelFloor) / Math.max(1, levelTarget - levelFloor)) * 100))) : 100;
  const missions = (game?.missions ?? []) as any[];
  const missionDone = missions.filter(item => item.assignment.status === "claimed").length;
  const achievements = (game?.achievements ?? []) as any[];
  const badges = (game?.badges ?? []) as any[];
  const unlockedAchievements = achievements.filter(item => item.userAchievement.status === "unlocked").length;
  const achievementSlots = [...achievements.slice(0, 4), ...Array(Math.max(0, 4 - achievements.length)).fill(null)];
  const xpByAttempt = new Map(((game?.xpHistory ?? []) as any[]).filter(item => item.sourceType === "attempt").map(item => [String(item.sourceId), item.amount]));
  const rankings = (leaderboard.data ?? []) as any[];
  const ownRank = rankings.findIndex(item => item.userId === user.id) + 1;
  const referralData = referral.data as any;

  const copyReferral = async () => {
    if (!referralData?.referralCode) return;
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast.success("Đã sao chép mã giới thiệu.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Không thể sao chép mã", { description: "Hãy thử sao chép lại." });
    }
  };

  return (
    <ProfileShell>
      <main className="container profile-workspace max-w-none py-3 sm:py-4 lg:py-3">
        <section className="relative min-h-[166px] overflow-hidden rounded-2xl border border-border bg-surface px-4 py-4 shadow-[var(--shadow-sm)] sm:px-6 sm:py-5">
          <span aria-hidden="true" className="absolute right-10 top-0 size-44 rounded-full bg-violet-500/8 blur-3xl" />
          <img src={sprite.hero} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-1 right-3 hidden h-[145px] w-[170px] object-contain lg:block" />
          <div className="relative grid min-h-[126px] items-center gap-5 lg:grid-cols-[minmax(0,1fr)_195px] lg:pr-[150px]">
            <div className="flex min-w-0 items-center gap-4">
              <ProfileAvatar name={user.name ?? "Học viên Dshare"} src={profile.avatarUrl} level={currentLevel?.displayOrder ?? 1} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[26px] font-black tracking-[-.05em] text-foreground sm:text-[29px]">{user.name ?? "Học viên Dshare"}</h1>
                  <ShieldCheck className="shrink-0 text-primary" size={20} aria-label="Tài khoản đã xác minh" />
                </div>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-bold text-violet-700"><Trophy size={12} />Level {currentLevel?.displayOrder ?? 1}</span>
                <div className="mt-3.5 max-w-[560px]">
                  <div className="flex items-center justify-between gap-3 text-xs"><span className="font-extrabold text-foreground">{formatNumber(xpBalance)} XP</span><span className="text-text-secondary">{nextLevel ? `${formatNumber(nextLevel.minXp)} XP` : "Cấp độ tối đa"}</span></div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tiến độ XP tới Level tiếp theo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={xpProgress}><div className="h-full rounded-full bg-[linear-gradient(90deg,#8952f4,#3658e8)] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${xpProgress}%` }} /></div>
                  <p className="mt-2 text-[11px] text-text-secondary">{nextLevel ? `Còn ${formatNumber(game?.xpToNextLevel ?? 0)} XP để lên ${nextLevel.name}` : "Bạn đã chạm mốc cao nhất"}</p>
                </div>
              </div>
            </div>
            <p className="hidden text-right text-xs leading-5 text-text-secondary lg:block">{profile.learningGoal || "Tiếp tục hành trình học tập mỗi ngày."}</p>
          </div>
        </section>

        <section aria-label="Chỉ số học tập" className="mt-3 grid gap-3 md:grid-cols-3">
          <DashboardStat spriteSrc={sprite.coins} label="Ví Point" value={formatNumber(profile.pointBalance)} suffix="Point" note="Sẵn sàng dùng dịch vụ premium" href="/wallet" action="Nạp Point" />
          <DashboardStat spriteSrc={sprite.xp} label="Tổng XP" value={formatNumber(xpBalance)} suffix="XP" note={nextLevel ? `+${formatNumber(game?.xpToNextLevel ? Math.min(320, game.xpToNextLevel) : 0)} XP tuần này` : "Đã đạt cấp độ cao nhất"} href="/achievements" action="Xem tiến trình" tone="violet" />
          <DashboardStat spriteSrc={sprite.award} label="Danh hiệu" value={formatNumber(unlockedAchievements || badges.length)} suffix="Danh hiệu" note={`${badges.length} huy hiệu đã được ghi nhận`} href="/achievements" action="Xem tất cả" tone="amber" compactBadges />
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[1.02fr_1.35fr]">
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)] sm:p-4.5">
            <SectionHeader title="Bảng xếp hạng" icon={Crown} actionHref="/leaderboard" action="Xem tất cả" />
            <div className="mt-3 space-y-1.5">
              {leaderboard.isLoading ? <BlockLoading label="Đang cập nhật bảng xếp hạng…" /> : leaderboard.error ? <BlockError label="Chưa tải được bảng xếp hạng" onRetry={() => leaderboard.refetch()} /> : rankings.length ? <>
                {rankings.slice(0, 3).map((entry, index) => <RankRow key={entry.userId} rank={index + 1} name={entry.name ?? "Học viên Dshare"} subtitle={entry.levelName ?? "Beginner"} xp={entry.xp ?? 0} />)}
                {ownRank > 3 ? <><div className="my-1 border-t border-dashed border-border-light" /><RankRow rank={ownRank} name="Bạn" subtitle={currentLevel?.name ?? "Beginner"} xp={xpBalance} active /></> : null}
              </> : <DashboardEmpty icon={Trophy} title="Bảng xếp hạng đang chờ dấu mốc đầu tiên" text="Hoàn thành Quiz để bắt đầu hành trình cạnh tranh lành mạnh." />}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-primary/12 bg-[linear-gradient(145deg,#fbfcff,#f8f5ff)] p-4 shadow-[var(--shadow-sm)] sm:p-4.5">
            <span aria-hidden="true" className="absolute bottom-3 right-4 hidden size-28 rounded-full bg-[radial-gradient(circle,#e7e0ff_0%,#f7f4ff_65%,transparent_68%)] lg:block" />
            <img src="/manus-storage/profile-upgrade-chest_9af97ca5.png" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-2 right-1 hidden h-32 w-40 object-contain lg:block" />
            <div className="relative max-w-[calc(100%-132px)]">
              <SectionHeader title="Giới thiệu bạn bè" icon={UsersRound} actionHref="/referrals" action="Quản lý" />
              <p className="mt-2 text-[11px] leading-5 text-text-secondary">Mời bạn bè tham gia và nhận phần thưởng hấp dẫn.</p>
              {referral.isLoading ? <BlockLoading label="Đang tải mã giới thiệu…" /> : referral.error ? <BlockError label="Chưa tải được dữ liệu giới thiệu" onRetry={() => referral.refetch()} /> : <>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/15 bg-surface/95 p-2"><code className="min-w-0 flex-1 truncate text-xs font-extrabold tracking-[.11em] text-primary">{referralData?.referralCode ?? "Đang chuẩn bị mã"}</code><Button size="sm" variant="outline" onClick={copyReferral} disabled={!referralData?.referralCode} className="h-8 shrink-0 rounded-md border-primary/20 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Đã sao chép" : "Sao chép"}</Button></div>
                <div className="mt-2 grid gap-1.5 text-[11px] text-text-secondary"><span>◌ Bạn đã giới thiệu: <strong className="text-foreground">{referralData?.invitations?.length ?? 0} người</strong></span><span>◌ Phần thưởng nhận được: <strong className="text-foreground">{formatNumber(referralData?.totalRewarded ?? 0)} Point</strong></span></div>
                <Link href="/referrals" className="mt-3 inline-flex items-center gap-1 rounded-md border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary-light">Mời bạn bè ngay <ArrowRight size={13} /></Link>
              </>}
            </div>
          </section>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[1.04fr_1.12fr_1.28fr]">
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
            <SectionHeader title="Nhiệm vụ hôm nay" icon={Target} actionHref="/missions" action="Xem tất cả" />
            <div className="mt-3 space-y-2">{missions.length ? missions.slice(0, 3).map(item => <QuestItem key={item.assignment.id} item={item} />) : <DashboardEmpty icon={Target} title="Chưa có nhiệm vụ phù hợp" text="Nhiệm vụ mới sẽ xuất hiện theo nhịp học." />}</div>
            <Link href="/missions" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Xem tất cả nhiệm vụ <ArrowRight size={13} /> <span className="sr-only">Đã hoàn thành {missionDone} nhiệm vụ</span></Link>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
            <SectionHeader title="Thành tích" icon={Medal} imageSrc={sprite.achievement[0]} actionHref="/achievements" action="Xem tất cả" />
            <div className="mt-3 grid grid-cols-4 gap-1.5">{achievementSlots.map((item, index) => <AchievementPreview key={item?.userAchievement?.id ?? `locked-${index}`} item={item} spriteSrc={sprite.achievement[index]} />)}</div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
            <SectionHeader title="Bài Quiz đã làm" icon={BookOpenCheck} actionHref="/explore" action="Xem tất cả" />
            {history.isLoading ? <BlockLoading label="Đang tải lịch sử làm bài…" /> : history.error ? <BlockError label="Chưa tải được lịch sử" onRetry={() => history.refetch()} /> : history.data?.length ? <div className="mt-2 divide-y divide-border-light">{history.data.slice(0, 3).map((item, index) => <QuizHistoryRow key={item.attempt.id} item={item} xp={xpByAttempt.get(String(item.attempt.id))} accent={index} />)}</div> : <EmptyActivity />}
          </section>
        </section>

      </main>
    </ProfileShell>
  );
}

function ProfileShell({ children }: { children: React.ReactNode }) { return <AccountLayout>{children}</AccountLayout>; }

function ProfileAvatar({ name, src, level }: { name: string; src?: string | null; level: number }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || "D";
  return <span className="relative grid size-[78px] shrink-0 place-items-center overflow-visible rounded-full border-4 border-violet-200 bg-[linear-gradient(135deg,#8454ee,#2563eb)] text-2xl font-black text-white shadow-[0_10px_22px_rgba(65,44,160,.2)] sm:size-[92px]"><span className="size-full overflow-hidden rounded-full">{src && !failed ? <img src={src} alt={`Ảnh đại diện của ${name}`} className="size-full object-cover" onError={() => setFailed(true)} /> : initial}</span><span className="absolute -bottom-2 grid size-8 place-items-center rounded-md border-2 border-surface bg-[linear-gradient(135deg,#8351ee,#3558e7)] text-sm font-black shadow-sm">{level}</span></span>;
}

function DashboardStat({ spriteSrc, label, value, suffix, note, href, action, tone = "blue", compactBadges }: { spriteSrc: string; label: string; value: string; suffix: string; note: string; href: string; action: string; tone?: "blue" | "violet" | "amber"; compactBadges?: boolean }) {
  const actionStyle = tone === "amber" ? "border-violet-200 text-violet-700 hover:bg-violet-50" : tone === "violet" ? "text-violet-700 hover:bg-violet-50" : "border-amber-200 text-amber-700 hover:bg-amber-50";
  return <article className="relative min-h-[126px] overflow-hidden rounded-2xl border border-border bg-surface p-3.5 shadow-[var(--shadow-sm)] sm:p-4"><img src={spriteSrc} alt="" aria-hidden="true" className="absolute left-3.5 top-3.5 size-12 object-contain" /><div className="ml-[60px]"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-text-muted">{label}</p><p className="mt-1 whitespace-nowrap text-[25px] font-black tracking-[-.05em] text-foreground">{value}<span className="ml-1 text-xs font-bold text-primary">{suffix}</span></p><p className="mt-1 min-h-4 text-[10px] leading-4 text-text-secondary">{note}</p>{compactBadges ? <span className="mt-2 block text-sm tracking-[.12em]">🏆 🏅 🎖️</span> : <Link href={href} className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${actionStyle}`}>{action} <ArrowRight size={12} /></Link>}</div>{compactBadges ? <Link href={href} className={`absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-bold transition-colors ${actionStyle}`}>{action}</Link> : null}</article>;
}

function SectionHeader({ title, icon: Icon, imageSrc, actionHref, action }: { title: string; icon: typeof Target; imageSrc?: string; actionHref: string; action: string }) { return <div className="flex items-center justify-between gap-3"><h2 className="inline-flex items-center gap-2 text-sm font-black tracking-[-.03em] text-foreground">{imageSrc ? <span className="grid size-7 place-items-center rounded-lg border border-violet-100 bg-violet-50"><img src={imageSrc} alt="" aria-hidden="true" className="size-6 object-contain" /></span> : <Icon size={16} className="text-violet-600" />}{title}</h2><Link href={actionHref} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-primary hover:underline">{action} <ArrowRight size={12} /></Link></div>; }

function RankRow({ rank, name, subtitle, xp, active }: { rank: number; name: string; subtitle: string; xp: number; active?: boolean }) { const icon = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank; return <div className={`flex h-9 items-center gap-2 rounded-md px-2.5 ${active ? "bg-violet-500/10 text-violet-700" : ""}`}><span className="grid w-5 shrink-0 place-items-center text-xs">{icon}</span><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-light text-[9px] font-bold text-primary">{name.slice(0, 1)}</span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-foreground">{name}</p><p className="hidden text-[9px] text-text-muted sm:block">{subtitle}</p></div><strong className="whitespace-nowrap text-[11px] text-foreground">{formatNumber(xp)} <span className="text-[9px] text-text-muted">XP</span></strong></div>; }

function QuestItem({ item }: { item: any }) { const percent = Math.min(100, Math.round((item.assignment.progress / Math.max(1, item.assignment.target)) * 100)); const done = item.assignment.status === "claimed" || item.assignment.status === "completed"; return <article className="flex items-center gap-2.5 rounded-lg px-0.5 py-1"><span className={`grid size-6 shrink-0 place-items-center rounded-full border ${done ? "border-success/20 bg-success/10 text-success" : "border-border text-transparent"}`}>{done ? <CheckCircle2 size={15} /> : "•"}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-[11px] font-bold text-foreground">{item.definition.title}</h3><span className="shrink-0 text-[10px] font-bold text-violet-700">+{formatNumber(item.assignment.xpReward)} XP</span></div><div className="mt-1 flex items-center gap-2"><div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),#8b5cf6)]" style={{ width: `${percent}%` }} /></div><span className="shrink-0 text-[9px] text-text-muted">{item.assignment.progress}/{item.assignment.target}</span></div></div></article>; }

function AchievementPreview({ item, spriteSrc }: { item: any | null; spriteSrc?: string }) { const unlocked = item?.userAchievement?.status === "unlocked"; const title = item?.badge?.name ?? item?.achievement?.title ?? "Đang khóa"; const icon = String(item?.badge?.icon ?? item?.achievement?.icon ?? "").toLowerCase(); const mappedSprite = icon.includes("flame") || icon.includes("streak") ? sprite.achievement[3] : icon.includes("target") || icon.includes("perfect") ? sprite.achievement[2] : icon.includes("star") || icon.includes("expert") ? sprite.achievement[1] : icon.includes("trophy") || icon.includes("quiz") ? sprite.achievement[0] : spriteSrc; const config = item?.achievement?.conditionConfig ?? {}; const target = Number(config.target ?? item?.userAchievement?.target ?? 1); const progress = Number(item?.userAchievement?.progress ?? 0); const condition = item?.achievement?.conditionType === "perfect_score" ? `Đạt điểm tuyệt đối${config.minimumScore ? ` từ ${config.minimumScore}%` : ""}` : item?.achievement?.conditionType === "quiz_completed" ? "Hoàn thành Quiz" : item?.achievement?.description ?? "Hoàn thành điều kiện học tập"; const hint = item ? `${unlocked ? "Đã mở khóa" : "Điều kiện mở khóa"}: ${condition} ${target > 1 ? `${target} lần` : ""}. Tiến độ ${Math.min(progress, target)}/${target}.` : "Hoàn thành các hoạt động học tập để mở khóa thành tích này."; return <Tooltip><TooltipTrigger asChild><article tabIndex={0} className={`min-w-0 cursor-help rounded-lg border p-2 text-center outline-none transition-transform focus-visible:ring-2 focus-visible:ring-primary ${unlocked ? "border-primary/15 bg-primary-light/35 reward-badge-reveal" : "border-border-light bg-muted/45"}`}><span className="relative mx-auto grid size-11 place-items-center"><img src={mappedSprite} alt="" aria-hidden="true" className={`size-11 object-contain transition-all ${unlocked ? "" : "grayscale opacity-45"}`} />{!unlocked ? <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-surface bg-muted text-text-muted"><ShieldCheck size={10} /></span> : null}</span><h3 className="mt-1.5 line-clamp-1 text-[10px] font-bold text-foreground">{title}</h3><p className="mt-0.5 hidden line-clamp-1 text-[9px] text-text-secondary sm:block">{unlocked ? "Đã mở khóa" : "Đang khóa"}</p><span className="sr-only">{hint}</span></article></TooltipTrigger><TooltipContent side="top" className="max-w-60 text-xs leading-5">{hint}</TooltipContent></Tooltip>; }

function QuizHistoryRow({ item, xp, accent }: { item: any; xp?: number; accent: number }) { const accents = ["bg-blue-500/15 text-blue-600", "bg-teal-500/15 text-teal-600", "bg-violet-500/15 text-violet-600"]; return <article className="flex min-h-[51px] items-center gap-2.5 py-2"><span className={`grid size-8 shrink-0 place-items-center rounded-md ${accents[accent] ?? accents[0]}`}><BookOpenCheck size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-foreground">{item.quizTitle}</p><p className="mt-0.5 truncate text-[9px] text-text-muted">{item.quizMode === "testing" ? "Kiểm tra" : "Ôn tập"} · {formatStudyDate(item.attempt.completedAt)}</p></div><div className="text-right"><p className="text-[11px] font-extrabold text-success">{item.attempt.score ?? 0}%</p>{xp ? <p className="mt-0.5 whitespace-nowrap text-[10px] font-bold text-violet-700">+{formatNumber(xp)} XP</p> : <p className="mt-0.5 text-[9px] text-text-muted">Đã lưu</p>}</div></article>; }

function BlockLoading({ label }: { label: string }) { return <p role="status" className="mt-3 rounded-lg bg-muted/65 p-3 text-xs text-text-secondary">{label}</p>; }
function BlockError({ label, onRetry }: { label: string; onRetry: () => void }) { return <div role="alert" className="mt-3 rounded-lg border border-danger/15 bg-danger/5 p-3"><p className="text-xs font-bold text-danger">{label}</p><Button variant="outline" onClick={onRetry} className="mt-2 h-7 rounded-full px-3 text-[10px]">Thử lại</Button></div>; }
function DashboardEmpty({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) { return <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center"><Icon className="mx-auto text-primary" size={20} /><p className="mt-2 text-xs font-bold text-foreground">{title}</p><p className="mx-auto mt-1 max-w-md text-[10px] leading-4 text-text-secondary">{text}</p></div>; }
function SignInState() { return <main className="container grid min-h-[calc(100vh-76px)] place-items-center py-12"><section className="max-w-md rounded-[28px] border border-border bg-surface p-8 text-center shadow-[var(--shadow-md)]"><span className="mx-auto grid size-12 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary"><LogIn size={21} /></span><h1 className="mt-6 text-3xl font-black tracking-[-.04em] text-foreground">Trung tâm học tập của bạn</h1><p className="mt-3 text-sm leading-6 text-text-secondary">Đăng nhập để lưu kết quả, theo dõi tiến độ và quản lý hành trình học tập cá nhân.</p><Button onClick={() => startLogin()} className="mt-7 rounded-full">Đăng nhập để tiếp tục <ArrowRight size={15} /></Button></section></main>; }
function ProfileLoadingState({ label }: { label: string }) { return <main className="container py-8"><section className="animate-pulse rounded-[28px] bg-muted/70 p-7 sm:p-9"><p role="status" aria-live="polite" className="text-sm font-medium text-text-secondary">{label}</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><span className="h-24 rounded-[var(--radius-lg-token)] bg-surface/80" /><span className="h-24 rounded-[var(--radius-lg-token)] bg-surface/80" /><span className="h-24 rounded-[var(--radius-lg-token)] bg-surface/80" /></div></section></main>; }
function ProfileErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) { return <main className="container grid min-h-[70vh] place-items-center py-12"><section className="max-w-md rounded-[var(--radius-xl-token)] border border-danger/20 bg-surface p-8 text-center shadow-[var(--shadow-sm)]"><h1 className="text-2xl font-black text-foreground">Chưa tải được Dashboard</h1><p className="mt-3 text-sm leading-6 text-text-secondary">{message ?? "Vui lòng kiểm tra kết nối rồi thử lại."}</p><Button onClick={onRetry} className="mt-6 rounded-full">Thử lại</Button></section></main>; }
function EmptyActivity() { return <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center"><BookOpenCheck className="mx-auto text-primary" size={20} /><p className="mt-2 text-xs font-bold text-foreground">Bạn chưa có lượt làm bài được lưu</p><p className="mt-1 text-[10px] leading-4 text-text-secondary">Chọn một bộ đề để bắt đầu hành trình.</p><Button asChild variant="outline" className="mt-3 h-8 rounded-full text-xs"><Link href="/explore">Khám phá bộ đề <ArrowRight size={13} /></Link></Button></div>; }
