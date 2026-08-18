import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { progressPreview } from "@/data/demo";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, BookOpenCheck, CalendarDays, ChartNoAxesCombined, CircleDollarSign, Clock3, Gift, LogIn, Target, Trophy } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const preferenceLabels = [
  ["studyReminders", "Nhắc học", "Gợi nhắc duy trì nhịp học"],
  ["resultUpdates", "Kết quả bài làm", "Điểm số và lời giải sau khi nộp"],
  ["platformUpdates", "Cập nhật nền tảng", "Tính năng và nội dung mới"],
] as const;

export default function Profile() {
  const { user, loading } = useAuth();
  const summary = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user) });
  const history = trpc.learner.history.useQuery(undefined, { enabled: Boolean(user) });
  const updateProfile = trpc.learner.updateProfile.useMutation({
    onSuccess: () => { summary.refetch(); toast.success("Đã cập nhật hồ sơ học tập."); },
    onError: error => toast.error("Không thể lưu hồ sơ", { description: error.message }),
  });

  if (loading) return <ProfileShell><LoadingState label="Đang mở không gian học tập…" /></ProfileShell>;
  if (!user) return <ProfileShell><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-12"><div className="max-w-md rounded-[28px] border border-[#2a4365]/10 bg-white p-8 text-center shadow-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#ebf8ff] text-[#3182ce]"><LogIn size={21} /></span><h1 className="mt-6 font-serif text-[34px] font-semibold tracking-[-.04em] text-[#2a4365]">Không gian học tập của bạn</h1><p className="mt-3 text-sm leading-6 text-[#617786]">Đăng nhập để lưu kết quả, theo dõi tiến độ và quản lý ví Point cá nhân.</p><Button onClick={() => startLogin()} className="mt-7 rounded-full bg-[#3182ce] hover:bg-[#2a4365]">Đăng nhập để tiếp tục <ArrowRight size={15} /></Button></div></main></ProfileShell>;
  if (summary.isLoading) return <ProfileShell><LoadingState label="Đang tải hồ sơ học viên…" /></ProfileShell>;
  if (summary.error) return <ProfileShell><main className="container grid min-h-[70vh] place-items-center py-12"><div className="max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm"><h1 className="font-serif text-2xl font-semibold text-[#2a4365]">Chưa tải được hồ sơ</h1><p className="mt-3 text-sm leading-6 text-[#617786]">{summary.error.message}</p><Button onClick={() => summary.refetch()} className="mt-6 rounded-full bg-[#3182ce]">Thử lại</Button></div></main></ProfileShell>;

  const profile = summary.data?.profile;
  const stats = summary.data?.stats;
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

  return <ProfileShell><main className="container py-9 lg:py-12"><section className="overflow-hidden rounded-[30px] bg-[#2a4365] p-6 text-white sm:p-8 lg:p-10"><div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div className="flex items-center gap-5"><div className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#4299e1] font-serif text-2xl font-bold text-white">{user.name?.slice(0, 1).toUpperCase() ?? "D"}</div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9cd0f6]">Không gian học tập</p><h1 className="mt-1 font-serif text-[32px] font-semibold tracking-[-.04em]">{user.name ?? "Học viên Dshare"}</h1><p className="mt-1 text-xs text-[#c8deeb]">Thành viên {profile?.tier ?? "basic"} · {profile?.learningGoal || "Học với mục tiêu rõ ràng"}</p></div></div><Link href="/bang-gia" className="inline-flex items-center gap-2 text-xs font-bold text-[#9cd0f6]">Xem gói học <ArrowRight size={14} /></Link></div></section><section className="mt-6 grid gap-4 sm:grid-cols-3"><Metric icon={BookOpenCheck} label="Bài đã hoàn thành" value={stats?.completed ?? 0} suffix="bài" /><Metric icon={Target} label="Điểm trung bình" value={stats?.averageScore ?? 0} suffix="đ" /><Metric icon={Trophy} label="Bài đạt mục tiêu" value={stats?.passedCount ?? 0} suffix="bài" /></section><details className="mt-6 rounded-[22px] border border-[#2a4365]/10 bg-white p-5"><summary className="cursor-pointer text-sm font-bold text-[#2a4365]">Thiết lập hồ sơ & thông báo</summary><form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Ảnh đại diện (URL)"><input name="avatarUrl" defaultValue={profile?.avatarUrl ?? ""} placeholder="https://..." className="field" /></Field><Field label="Mục tiêu học tập"><input name="learningGoal" defaultValue={profile?.learningGoal ?? ""} maxLength={220} placeholder="Ví dụ: Đạt 7.0 IELTS trong 12 tuần" className="field" /></Field><Field label="Giới thiệu bản thân" full><textarea name="bio" defaultValue={profile?.bio ?? ""} placeholder="Mục tiêu học tập hoặc điều bạn muốn chinh phục…" className="field min-h-22 resize-none" /></Field><fieldset className="sm:col-span-2 rounded-2xl bg-[#ebf8ff] p-4"><legend className="px-1 text-xs font-bold text-[#2a4365]">Tùy chọn nhận thông báo</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{preferenceLabels.map(([name, title, note]) => <label key={name} className="flex cursor-pointer gap-2 rounded-xl bg-white p-3 text-xs"><input name={name} type="checkbox" defaultChecked={profile?.notificationPreferences?.[name] ?? true} className="mt-0.5 accent-[#3182ce]" /><span><strong className="text-[#2a4365]">{title}</strong><span className="mt-1 block text-[10px] leading-4 text-[#71838d]">{note}</span></span></label>)}</div></fieldset><Button disabled={updateProfile.isPending} className="w-fit rounded-full bg-[#3182ce] text-xs hover:bg-[#2a4365]">{updateProfile.isPending ? "Đang lưu…" : "Lưu thiết lập"}</Button></form></details><section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-[28px] border border-[#2a4365]/10 bg-white p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3182ce]">Tiến độ theo môn học</p><h2 className="mt-2 font-serif text-[28px] font-semibold text-[#2a4365]">Học đều, thấy rõ tiến bộ.</h2></div><ChartNoAxesCombined className="text-[#3182ce]" size={22} /></div><div className="mt-8 space-y-6">{progressPreview.map(item => <div key={item.label}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#2a4365]">{item.label}</span><span className="font-mono text-[#71838d]">{item.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#ebf8ff]"><div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.accent }} /></div></div>)}</div><Button asChild variant="outline" className="mt-8 rounded-full"><Link href="/kham-pha">Tiếp tục lộ trình <ArrowRight size={14} /></Link></Button></div><div className="rounded-[28px] bg-[#4299e1] p-6 text-white"><CircleDollarSign size={23} /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.17em] text-white/75">Ví Point</p><p className="mt-2 font-serif text-[44px] font-semibold tracking-[-.05em]">{profile?.pointBalance ?? 0}</p><p className="text-xs text-white/75">Point khả dụng</p><div className="mt-6 rounded-2xl bg-white/15 p-4 text-xs leading-5 text-white/90"><Gift className="mb-2" size={16} />Nhận Point khi hoàn thành bài kiểm tra đạt mục tiêu hoặc khi báo lỗi câu hỏi được duyệt.</div><Button asChild className="mt-5 w-full rounded-full bg-[#2a4365] hover:bg-[#3182ce]"><Link href="/vi">Mở ví Point <ArrowRight size={14} /></Link></Button></div></section><section className="mt-6 rounded-[28px] border border-[#2a4365]/10 bg-white p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3182ce]">Lịch sử làm bài</p><h2 className="mt-2 font-serif text-[28px] font-semibold text-[#2a4365]">Dấu mốc gần đây</h2></div><CalendarDays className="text-[#3182ce]" size={21} /></div>{history.isLoading ? <p className="mt-6 text-sm text-[#617786]">Đang tải lịch sử…</p> : history.error ? <p className="mt-6 rounded-2xl bg-[#fff7f5] p-5 text-sm text-[#a8493e]">Chưa tải được lịch sử: {history.error.message}</p> : history.data?.length ? <div className="mt-6 divide-y divide-[#2a4365]/10">{history.data.map(item => <div key={item.attempt.id} className="flex flex-wrap items-center gap-4 py-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ebf8ff] text-[#3182ce]"><Clock3 size={16} /></span><div className="min-w-40 flex-1"><p className="text-sm font-semibold text-[#2a4365]">{item.quizTitle}</p><p className="mt-1 text-[11px] text-[#71838d]">{item.quizMode === "testing" ? "Kiểm tra" : "Ôn tập"} · {item.attempt.completedAt?.toLocaleDateString("vi-VN")}</p></div><p className="font-serif text-2xl font-semibold text-[#2a4365]">{item.attempt.score}đ</p></div>)}</div> : <div className="mt-6 rounded-2xl bg-[#ebf8ff] p-6 text-sm text-[#617786]">Bạn chưa có lượt làm bài được lưu. Hãy chọn một bộ đề để bắt đầu hành trình học tập.</div>}</section></main></ProfileShell>;
}

function ProfileShell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#ebf8ff]"><SiteHeader />{children}</div>; }
function LoadingState({ label }: { label: string }) { return <main className="container grid min-h-[70vh] place-items-center py-12"><p className="text-sm text-[#617786]">{label}</p></main>; }
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) { return <label className={`text-xs font-semibold text-[#526d80] ${full ? "sm:col-span-2" : ""}`}>{label}<span className="mt-2 block">{children}</span></label>; }
function Metric({ icon: Icon, label, value, suffix }: { icon: typeof Target; label: string; value: number; suffix: string }) { return <div className="rounded-[22px] border border-[#2a4365]/10 bg-white p-5"><Icon size={18} className="text-[#3182ce]" /><p className="mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#71838d]">{label}</p><p className="mt-1 font-serif text-[30px] font-semibold text-[#2a4365]">{value}<span className="ml-1 text-xs font-sans font-medium text-[#71838d]">{suffix}</span></p></div>; }
