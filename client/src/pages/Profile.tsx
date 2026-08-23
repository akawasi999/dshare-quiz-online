import { useAuth } from "@/_core/hooks/useAuth";
import AccountLayout from "@/components/AccountLayout";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { sharedDataQueryOptions } from "@/lib/sharedDataSync";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Award, BellRing, BookOpenCheck, CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign, Clock3, Flame, Gift, GraduationCap, LogIn, PencilLine, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const preferenceLabels = [
  ["studyReminders", "Nhắc học", "Gợi nhắc duy trì nhịp học"],
  ["resultUpdates", "Kết quả bài làm", "Điểm số và lời giải sau khi nộp"],
  ["platformUpdates", "Cập nhật nền tảng", "Tính năng và nội dung mới"],
] as const;

const tierLabel: Record<string, string> = { basic: "Basic", pro: "Pro", premium: "Premium" };

function formatNumber(value: number) { return Number(value ?? 0).toLocaleString("vi-VN"); }
function formatStudyDate(value: Date | null | undefined) { return value ? new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" }) : "Đang cập nhật"; }

export default function Profile() {
  const { user, loading } = useAuth();
  const summary = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const history = trpc.learner.history.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const gamification = trpc.learner.gamification.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const updateProfile = trpc.learner.updateProfile.useMutation({
    onSuccess: () => { summary.refetch(); toast.success("Đã cập nhật hồ sơ học tập."); },
    onError: error => toast.error("Không thể lưu hồ sơ", { description: error.message }),
  });

  if (loading) return <ProfileShell><ProfileLoadingState label="Đang mở không gian học tập…" /></ProfileShell>;
  if (!user) return <ProfileShell><SignInState /></ProfileShell>;
  if (summary.isLoading) return <ProfileShell><ProfileLoadingState label="Đang đồng bộ hồ sơ học viên…" /></ProfileShell>;
  if (summary.error || !summary.data) return <ProfileShell><ProfileErrorState message={summary.error?.message} onRetry={() => summary.refetch()} /></ProfileShell>;

  const { profile, stats } = summary.data;
  const game = gamification.data;
  const currentLevel = game?.currentLevel;
  const nextLevel = game?.nextLevel;
  const xpBalance = profile.xpBalance ?? 0;
  const levelFloor = currentLevel?.minXp ?? 0;
  const xpProgress = nextLevel ? Math.min(100, Math.max(0, Math.round(((xpBalance - levelFloor) / Math.max(1, nextLevel.minXp - levelFloor)) * 100))) : 100;
  const missionTotal = game?.missions.length ?? 0;
  const missionDone = game?.missions.filter((item: any) => item.assignment.status === "claimed").length ?? 0;
  const completionRate = stats.completed ? Math.round((stats.passedCount / stats.completed) * 100) : 0;
  const profileKey = `${profile.avatarUrl ?? ""}-${profile.learningGoal ?? ""}-${profile.updatedAt ?? ""}`;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProfile.mutate({
      avatarUrl: String(form.get("avatarUrl") ?? ""),
      bio: String(form.get("bio") ?? ""),
      learningGoal: String(form.get("learningGoal") ?? ""),
      notificationPreferences: {
        studyReminders: form.get("studyReminders") === "on",
        resultUpdates: form.get("resultUpdates") === "on",
        platformUpdates: form.get("platformUpdates") === "on",
      },
    });
  };

  return <ProfileShell><main className="container profile-workspace py-6 sm:py-8 lg:py-10">
    <section className="profile-hero relative overflow-hidden rounded-[30px] border border-primary/10 bg-[radial-gradient(circle_at_88%_12%,rgba(255,255,255,.3),transparent_25%),linear-gradient(125deg,#0751c9_0%,#2563eb_52%,#7c3aed_100%)] p-5 text-white shadow-[0_22px_55px_rgba(30,64,175,.22)] sm:p-7 lg:p-9">
      <div aria-hidden="true" className="absolute -right-14 -top-20 size-60 rounded-full border border-white/15 bg-white/5" />
      <div aria-hidden="true" className="absolute -bottom-24 right-1/3 size-52 rounded-full border border-white/10 bg-white/5" />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5"><ProfileAvatar name={user.name ?? "Học viên Dshare"} src={profile.avatarUrl} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/70">Không gian học tập</p><span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">{tierLabel[profile.tier] ?? profile.tier}</span></div><h1 className="mt-2 truncate text-2xl font-black tracking-[-.045em] sm:text-3xl">{user.name ?? "Học viên Dshare"}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{profile.learningGoal || "Thiết lập mục tiêu học tập để Dshare đồng hành sát với lộ trình của bạn."}</p></div></div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href="/missions"><Target size={15} />Xem nhiệm vụ</Link></Button><Button asChild className="bg-white text-primary hover:bg-white/90"><Link href="/pricing">Nâng cấp hành trình <ArrowRight size={15} /></Link></Button></div>
      </div>
    </section>

    <section className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_.52fr_.52fr]">
      <article className="rounded-[24px] border border-primary/15 bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">Level & tiến trình</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-foreground">{currentLevel?.name ?? "Beginner"}</h2></div><span className="rounded-full bg-primary-light px-3 py-1.5 text-xs font-bold text-primary">Level {currentLevel?.displayOrder ?? 1}</span></div><div className="mt-6" role="progressbar" aria-label="Tiến độ XP tới Level tiếp theo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={xpProgress}><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),#8b5cf6)] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${xpProgress}%` }} /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-bold text-foreground">{formatNumber(xpBalance)} XP</span><span className="text-text-secondary">{nextLevel ? `Còn ${formatNumber(game?.xpToNextLevel ?? 0)} XP tới ${nextLevel.name}` : "Bạn đã chạm mốc cao nhất"}</span></div></div>{gamification.isError ? <p className="mt-4 rounded-[var(--radius-md-token)] bg-warning/10 px-3 py-2 text-xs text-warning">Tiến trình Gamification đang tạm thời chưa đồng bộ.</p> : null}</article>
      <Link href="/missions" className="group rounded-[24px] border border-amber-500/15 bg-[linear-gradient(145deg,#fffaf0,#fff5d8)] p-5 text-amber-950 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none"><Target size={20} className="text-amber-600" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-amber-700">Nhiệm vụ đang mở</p><p className="mt-1 text-3xl font-black tracking-[-.05em]">{missionDone}<span className="ml-1 text-base font-semibold text-amber-700">/ {missionTotal}</span></p><p className="mt-2 text-xs leading-5 text-amber-900/70">Hoàn thành thử thách để nhận XP.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-800">Khám phá nhiệm vụ <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></span></Link>
      <Link href="/achievements" className="group rounded-[24px] border border-violet-500/15 bg-[linear-gradient(145deg,#faf7ff,#f1e8ff)] p-5 text-violet-950 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none"><Flame size={20} className="text-violet-600" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-violet-700">Chuỗi học tập</p><p className="mt-1 text-3xl font-black tracking-[-.05em]">{profile.currentStreak ?? 0}<span className="ml-1 text-base font-semibold text-violet-700">ngày</span></p><p className="mt-2 text-xs leading-5 text-violet-900/70">Giữ nhịp mỗi ngày để chinh phục huy hiệu.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-800">Xem thành tích <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></span></Link>
    </section>

    <section className="mt-5 grid gap-3 sm:grid-cols-3"><Metric icon={BookOpenCheck} label="Bài đã hoàn thành" value={stats.completed} suffix="bài" note="Toàn bộ lượt nộp hợp lệ" /><Metric icon={Target} label="Điểm trung bình" value={stats.averageScore} suffix="%" note="Từ các lượt làm đã chấm" /><Metric icon={CheckCircle2} label="Tỷ lệ đạt mục tiêu" value={completionRate} suffix="%" note={`${stats.passedCount} bài đạt ngưỡng`} /></section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.18fr_.82fr]">
      <article className="rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Tổng quan học tập</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-foreground">Nhịp học của bạn</h2><p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Các chỉ số được tổng hợp từ lịch sử làm Quiz thực tế, không dùng dữ liệu minh họa.</p></div><span className="grid size-10 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary"><GraduationCap size={19} /></span></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Insight icon={Award} label="Kết quả tốt nhất" value={stats.averageScore >= 80 ? "Đang tăng tốc" : stats.completed ? "Tiếp tục bứt phá" : "Sẵn sàng bắt đầu"} /><Insight icon={CalendarDays} label="Tần suất" value={stats.completed ? `${stats.completed} lượt đã ghi nhận` : "Chưa có lượt làm"} /><Insight icon={ShieldCheck} label="Mục tiêu" value={profile.learningGoal || "Chưa thiết lập"} /></div><Button asChild variant="outline" className="mt-6 rounded-full"><Link href="/explore">Tiếp tục học ngay <ArrowRight size={14} /></Link></Button></article>
      <article className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#0f4bbd,#2563eb_58%,#7c3aed)] p-5 text-white shadow-[var(--shadow-md)] sm:p-6"><Sparkles aria-hidden="true" className="absolute right-5 top-5 text-white/35" size={36} /><CircleDollarSign size={23} className="text-white/80" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.17em] text-white/70">Ví Point</p><p className="mt-1 text-4xl font-black tracking-[-.06em]">{formatNumber(profile.pointBalance)}</p><p className="mt-1 text-xs text-white/75">Point khả dụng cho dịch vụ premium</p><div className="mt-5 rounded-[var(--radius-md-token)] border border-white/15 bg-white/10 p-4 text-xs leading-5 text-white/90"><Gift className="mb-2" size={16} />Point dùng cho dịch vụ có phí. XP phản ánh tiến trình học tập và không thay thế Point.</div><Button asChild variant="outline" className="mt-5 w-full border-white/25 bg-white text-primary hover:bg-white/90"><Link href="/wallet">Mở ví Point <ArrowRight size={14} /></Link></Button></article>
    </section>

    <details className="group mt-5 rounded-[24px] border border-border bg-surface shadow-[var(--shadow-sm)]" key={profileKey}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6"><span><span className="inline-flex items-center gap-2 text-sm font-bold text-foreground"><PencilLine size={16} className="text-primary" />Thiết lập hồ sơ & thông báo</span><span className="mt-1 block text-xs leading-5 text-text-secondary">Cập nhật mục tiêu, ảnh đại diện và kênh thông báo bạn muốn nhận.</span></span><ChevronDown className="shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-180" size={19} /></summary><form onSubmit={submit} className="border-t border-border-light p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Ảnh đại diện (URL)" description="Dùng liên kết ảnh HTTPS để hiển thị ảnh cá nhân."><input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} placeholder="https://..." className="field" /></Field><Field label="Mục tiêu học tập" description="Tối đa 220 ký tự, hiển thị trên không gian cá nhân."><input id="learningGoal" name="learningGoal" defaultValue={profile.learningGoal ?? ""} maxLength={220} placeholder="Ví dụ: Đạt 7.0 IELTS trong 12 tuần" className="field" /></Field><Field label="Giới thiệu bản thân" full description="Một vài dòng về điều bạn muốn chinh phục."><textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={500} placeholder="Mục tiêu học tập hoặc điều bạn muốn chinh phục…" className="field min-h-28 resize-y" /></Field></div><fieldset className="mt-5 rounded-[var(--radius-lg-token)] border border-border-light bg-muted/65 p-4"><legend className="px-1 text-xs font-bold text-foreground"><BellRing className="mr-1 inline-block text-primary" size={14} />Tùy chọn nhận thông báo</legend><div className="mt-3 grid gap-3 md:grid-cols-3">{preferenceLabels.map(([name, title, note]) => <label key={name} className="flex cursor-pointer gap-3 rounded-[var(--radius-md-token)] border border-border-light bg-surface p-3 text-xs transition-colors hover:border-primary/25"><input name={name} type="checkbox" defaultChecked={profile.notificationPreferences?.[name] ?? true} className="mt-0.5 size-4 accent-primary" /><span><strong className="text-foreground">{title}</strong><span className="mt-1 block leading-4 text-text-muted">{note}</span></span></label>)}</div></fieldset><div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled={updateProfile.isPending} className="rounded-full">{updateProfile.isPending ? "Đang lưu thay đổi…" : "Lưu thiết lập"}</Button><p className="text-xs text-text-muted">Các thay đổi chỉ có hiệu lực sau khi lưu.</p></div></form></details>

    <section className="mt-5 rounded-[24px] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Lịch sử làm bài</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-foreground">Dấu mốc gần đây</h2><p className="mt-2 text-sm text-text-secondary">Theo dõi các lượt hoàn thành gần nhất để điều chỉnh nhịp học.</p></div><CalendarDays className="text-primary" size={21} /></div>{history.isLoading ? <ActivitySkeleton /> : history.error ? <div className="mt-6 rounded-[var(--radius-md-token)] border border-danger/15 bg-danger/5 p-5"><p className="text-sm font-semibold text-danger">Chưa tải được lịch sử</p><p className="mt-1 text-xs text-text-secondary">{history.error.message}</p><Button variant="outline" onClick={() => history.refetch()} className="mt-4">Thử lại</Button></div> : history.data?.length ? <div className="mt-5 divide-y divide-border-light">{history.data.map(item => <article key={item.attempt.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-1"><span className="grid size-10 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary"><Clock3 size={17} /></span><div className="min-w-[12rem] flex-1"><p className="text-sm font-bold text-foreground">{item.quizTitle}</p><p className="mt-1 text-[11px] text-text-muted">{item.quizMode === "testing" ? "Kiểm tra" : "Ôn tập"} · {formatStudyDate(item.attempt.completedAt)}</p></div><div className="text-right"><p className="text-xl font-black tracking-[-.04em] text-foreground">{item.attempt.score ?? 0}<span className="ml-0.5 text-xs font-semibold text-text-muted">đ</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-success">Đã ghi nhận</p></div></article>)}</div> : <EmptyActivity />}</section>
  </main></ProfileShell>;
}

function ProfileShell({ children }: { children: React.ReactNode }) { return <AccountLayout>{children}</AccountLayout>; }

function ProfileAvatar({ name, src }: { name: string; src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || "D";
  return <span className="grid size-15 shrink-0 place-items-center overflow-hidden rounded-[22px] border border-white/20 bg-white/15 text-2xl font-black text-white shadow-[0_10px_22px_rgba(0,0,0,.14)] sm:size-18">{src && !failed ? <img src={src} alt={`Ảnh đại diện của ${name}`} className="size-full object-cover" onError={() => setFailed(true)} /> : initial}</span>;
}

function SignInState() { return <main className="container grid min-h-[calc(100vh-76px)] place-items-center py-12"><section className="max-w-md rounded-[28px] border border-border bg-surface p-8 text-center shadow-[var(--shadow-md)]"><span className="mx-auto grid size-12 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary"><LogIn size={21} /></span><h1 className="mt-6 text-3xl font-black tracking-[-.04em] text-foreground">Không gian học tập của bạn</h1><p className="mt-3 text-sm leading-6 text-text-secondary">Đăng nhập để lưu kết quả, theo dõi tiến độ và quản lý ví Point cá nhân.</p><Button onClick={() => startLogin()} className="mt-7 rounded-full">Đăng nhập để tiếp tục <ArrowRight size={15} /></Button></section></main>; }
function ProfileLoadingState({ label }: { label: string }) { return <main className="container py-8"><section className="animate-pulse rounded-[30px] bg-muted/70 p-7 sm:p-9"><p role="status" aria-live="polite" className="text-sm font-medium text-text-secondary">{label}</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><span className="h-24 rounded-[var(--radius-lg-token)] bg-surface/80" /><span className="h-24 rounded-[var(--radius-lg-token)] bg-surface/80" /><span className="h-24 rounded-[var(--radius-lg-token)] bg-surface/80" /></div></section></main>; }
function ProfileErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) { return <main className="container grid min-h-[70vh] place-items-center py-12"><section className="max-w-md rounded-[var(--radius-xl-token)] border border-danger/20 bg-surface p-8 text-center shadow-[var(--shadow-sm)]"><h1 className="text-2xl font-black text-foreground">Chưa tải được hồ sơ</h1><p className="mt-3 text-sm leading-6 text-text-secondary">{message ?? "Vui lòng kiểm tra kết nối rồi thử lại."}</p><Button onClick={onRetry} className="mt-6 rounded-full">Thử lại</Button></section></main>; }
function Field({ label, description, full, children }: { label: string; description: string; full?: boolean; children: React.ReactNode }) { return <label className={`block text-xs font-semibold text-text-secondary ${full ? "sm:col-span-2" : ""}`}><span className="text-foreground">{label}</span><span className="mt-1 block text-[11px] font-normal leading-4 text-text-muted">{description}</span><span className="mt-2 block">{children}</span></label>; }
function Metric({ icon: Icon, label, value, suffix, note }: { icon: typeof Target; label: string; value: number; suffix: string; note: string }) { return <article className="rounded-[20px] border border-border bg-surface p-4 shadow-[var(--shadow-sm)]"><Icon size={18} className="text-primary" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-text-muted">{label}</p><p className="mt-1 text-3xl font-black tracking-[-.05em] text-foreground">{formatNumber(value)}<span className="ml-1 text-xs font-semibold text-text-muted">{suffix}</span></p><p className="mt-2 text-[11px] text-text-secondary">{note}</p></article>; }
function Insight({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) { return <div className="rounded-[var(--radius-md-token)] border border-border-light bg-background p-4"><Icon size={17} className="text-primary" /><p className="mt-3 text-[10px] font-bold uppercase tracking-[.13em] text-text-muted">{label}</p><p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-foreground">{value}</p></div>; }
function ActivitySkeleton() { return <div className="mt-6 space-y-3" aria-label="Đang tải lịch sử làm bài"><div className="h-16 animate-pulse rounded-[var(--radius-md-token)] bg-muted" /><div className="h-16 animate-pulse rounded-[var(--radius-md-token)] bg-muted" /></div>; }
function EmptyActivity() { return <div className="mt-6 rounded-[var(--radius-lg-token)] border border-dashed border-border bg-muted/50 p-7 text-center"><BookOpenCheck className="mx-auto text-primary" size={23} /><p className="mt-3 text-sm font-bold text-foreground">Bạn chưa có lượt làm bài được lưu</p><p className="mt-2 text-xs leading-5 text-text-secondary">Chọn một bộ đề để bắt đầu hành trình và xem tiến độ thực tế tại đây.</p><Button asChild variant="outline" className="mt-5 rounded-full"><Link href="/explore">Khám phá bộ đề <ArrowRight size={14} /></Link></Button></div>; }
