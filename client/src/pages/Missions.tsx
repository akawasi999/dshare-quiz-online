import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ROUTES } from "@/lib/routes";
import { ArrowRight, CalendarDays, CheckCircle2, CircleDashed, Flame, Sparkles, Target } from "lucide-react";
import { Link } from "wouter";

type MissionItem = { assignment: { id: number; progress: number; target: number; xpReward: number; status: string; expiresAt: Date }; definition: { title: string; description: string; repeatType: "daily" | "weekly" | "special"; endsAt: Date | null } };

const sectionCopy = {
  daily: { eyebrow: "Daily missions", title: "Hôm nay", text: "Hoàn thành đều đặn để duy trì nhịp học và chuỗi ngày liên tiếp." },
  weekly: { eyebrow: "Weekly missions", title: "Tuần này", text: "Mục tiêu dài hơi hơn để biến việc ôn tập thành thói quen." },
  special: { eyebrow: "Event campaign", title: "Chiến dịch giới hạn", text: "Thử thách theo sự kiện. Hãy hoàn thành trước thời điểm kết thúc." },
} as const;

function formatExpiry(value: Date | null | undefined) {
  if (!value) return "Không giới hạn";
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function MissionCard({ item }: { item: MissionItem }) {
  const { assignment, definition } = item;
  const percent = Math.min(100, Math.round((assignment.progress / assignment.target) * 100));
  const done = assignment.status === "claimed" || assignment.status === "completed";
  const campaign = definition.repeatType === "special";
  return <article className="rounded-[var(--radius-lg-token)] border border-border bg-background p-4"><div className="flex gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-[var(--radius-md-token)] ${done ? "bg-success/10 text-success" : campaign ? "bg-violet-500/10 text-violet-600" : "bg-primary-light text-primary"}`}>{done ? <CheckCircle2 size={19} /> : campaign ? <Sparkles size={19} /> : <Target size={19} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-foreground">{definition.title}</h3><span className="rounded-full bg-[#fef3c7] px-2.5 py-1 text-[10px] font-bold text-[#92400e]">+{assignment.xpReward.toLocaleString("vi-VN")} XP</span></div><p className="mt-1 text-xs leading-5 text-text-secondary">{definition.description}</p>{campaign ? <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-violet-700"><CalendarDays size={12} />Kết thúc: {formatExpiry(definition.endsAt ?? assignment.expiresAt)}</p> : null}<div className="mt-3 flex items-center gap-3"><div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),#8b5cf6)] transition-[width] duration-300" style={{ width: `${percent}%` }} /></div><span className="shrink-0 font-mono text-[11px] font-bold text-text-secondary">{assignment.progress}/{assignment.target}</span></div>{done ? <p className="mt-2 text-[11px] font-semibold text-success">Đã ghi nhận phần thưởng</p> : null}</div></div></article>;
}

function MissionGroup({ type, items }: { type: keyof typeof sectionCopy; items: MissionItem[] }) {
  const copy = sectionCopy[type];
  return <section className="mt-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{copy.eyebrow}</p><h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-foreground">{copy.title}</h2><p className="mt-1 text-xs leading-5 text-text-secondary">{copy.text}</p></div>{type === "special" ? <Sparkles className="text-violet-600" size={20} /> : type === "weekly" ? <CalendarDays className="text-primary" size={20} /> : <CircleDashed className="text-primary" size={20} />}</div><div className="mt-4 space-y-3">{items.length ? items.map(item => <MissionCard key={item.assignment.id} item={item} />) : <p className="rounded-[var(--radius-lg-token)] bg-muted p-4 text-sm text-text-secondary">Chưa có nhiệm vụ {type === "daily" ? "trong ngày" : type === "weekly" ? "trong tuần" : "chiến dịch"} phù hợp.</p>}</div></section>;
}

export default function Missions() {
  const progress = trpc.learner.gamification.useQuery();
  if (progress.isLoading) return <main className="container grid min-h-[65vh] place-items-center py-10"><p role="status" className="text-sm text-text-secondary">Đang chuẩn bị nhiệm vụ hôm nay…</p></main>;
  if (progress.error || !progress.data) return <main className="container py-10"><section className="rounded-[var(--radius-xl-token)] border border-danger/20 bg-surface p-7 text-center"><h1 className="text-2xl font-bold text-foreground">Chưa tải được nhiệm vụ</h1><p className="mt-2 text-sm text-text-secondary">{progress.error?.message ?? "Vui lòng thử lại sau ít phút."}</p><Button onClick={() => progress.refetch()} className="mt-5">Thử lại</Button></section></main>;
  const { profile, currentLevel, nextLevel, xpToNextLevel } = progress.data;
  const missions = progress.data.missions as MissionItem[];
  const groups = { daily: missions.filter(item => item.definition.repeatType === "daily"), weekly: missions.filter(item => item.definition.repeatType === "weekly"), special: missions.filter(item => item.definition.repeatType === "special") };
  return <main className="container py-8 lg:py-10"><section className="overflow-hidden rounded-[var(--radius-xl-token)] bg-[radial-gradient(circle_at_88%_20%,rgba(250,204,21,.3),transparent_28%),linear-gradient(135deg,#1d4ed8_0%,#7c3aed_100%)] p-6 text-white shadow-[var(--shadow-md)] sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">Learning quest</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Nhiệm vụ giúp bạn đi xa hơn.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/80">Mỗi tiến bộ được máy chủ ghi nhận tự động. Hoàn thành nhiệm vụ để nhận XP và mở khóa cột mốc mới.</p></div><div className="rounded-[var(--radius-lg-token)] border border-white/15 bg-white/10 px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/70">Level hiện tại</p><p className="mt-1 text-2xl font-bold">{currentLevel?.name ?? "Beginner"}</p><p className="mt-1 text-xs text-white/75">{profile.xpBalance.toLocaleString("vi-VN")} XP · còn {xpToNextLevel.toLocaleString("vi-VN")} XP tới {nextLevel?.name ?? "cột mốc tiếp theo"}</p></div></div></section><section className="mt-6 grid gap-5 lg:grid-cols-[1fr_.34fr]"><div className="rounded-[var(--radius-xl-token)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6"><MissionGroup type="daily" items={groups.daily} /><MissionGroup type="weekly" items={groups.weekly} /><MissionGroup type="special" items={groups.special} /></div><aside className="h-fit rounded-[var(--radius-xl-token)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)]"><Flame className="text-[#f59e0b]" size={23} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-text-muted">Chuỗi học tập</p><p className="mt-1 text-4xl font-bold tracking-[-.05em] text-foreground">{profile.currentStreak}<span className="ml-1 text-sm font-semibold text-text-muted">ngày</span></p><p className="mt-3 text-xs leading-5 text-text-secondary">Học vào một ngày mới để giữ chuỗi. Mốc 3, 7, 14 và 30 ngày có phần thưởng XP riêng.</p><Button asChild variant="outline" className="mt-6 w-full"><Link href={ROUTES.practice}>Làm Quiz ngay <ArrowRight size={14} /></Link></Button></aside></section></main>;
}
