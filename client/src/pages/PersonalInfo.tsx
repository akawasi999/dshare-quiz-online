import { useAuth } from "@/_core/hooks/useAuth";
import AccountLayout from "@/components/AccountLayout";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { sharedDataQueryOptions } from "@/lib/sharedDataSync";
import { trpc } from "@/lib/trpc";
import { BellRing, CheckCircle2, LogIn, PencilLine, UserRound } from "lucide-react";
import { toast } from "sonner";

const preferenceLabels = [
  ["studyReminders", "Nhắc học", "Gợi nhắc duy trì nhịp học"],
  ["resultUpdates", "Kết quả bài làm", "Điểm số và lời giải sau khi nộp"],
  ["platformUpdates", "Cập nhật nền tảng", "Tính năng và nội dung mới"],
] as const;

export default function PersonalInfo() {
  const { user, loading } = useAuth();
  const summary = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const updateProfile = trpc.learner.updateProfile.useMutation({
    onSuccess: () => { summary.refetch(); toast.success("Đã cập nhật thông tin cá nhân."); },
    onError: error => toast.error("Không thể lưu hồ sơ", { description: error.message }),
  });

  if (loading || summary.isLoading) return <AccountLayout><main className="container py-8"><section className="animate-pulse rounded-2xl bg-muted p-6"><p role="status" className="text-sm text-text-secondary">Đang tải thông tin cá nhân…</p></section></main></AccountLayout>;
  if (!user) return <AccountLayout><main className="container grid min-h-[60vh] place-items-center py-10"><section className="max-w-md rounded-2xl border border-border bg-surface p-8 text-center"><LogIn className="mx-auto text-primary" /><h1 className="mt-4 text-2xl font-black">Đăng nhập để tiếp tục</h1><Button className="mt-5" onClick={() => startLogin()}>Đăng nhập</Button></section></main></AccountLayout>;
  if (summary.error || !summary.data) return <AccountLayout><main className="container py-8"><section className="rounded-2xl border border-danger/20 bg-surface p-6"><p className="font-bold text-danger">Chưa tải được thông tin cá nhân.</p><Button className="mt-4" onClick={() => summary.refetch()}>Thử lại</Button></section></main></AccountLayout>;

  const profile = summary.data.profile;
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

  return <AccountLayout><main className="container max-w-4xl py-5 sm:py-7"><section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-sm)]"><header className="border-b border-border-light bg-[linear-gradient(110deg,#fafaff,#f6f4ff)] px-5 py-5 sm:px-7"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700"><UserRound size={20} /></span><h1 className="mt-3 text-2xl font-black tracking-[-.04em] text-foreground">Thông tin cá nhân</h1><p className="mt-1 text-sm text-text-secondary">Quản lý ảnh đại diện, mục tiêu học tập và các thông báo phù hợp với bạn.</p></header><form onSubmit={submit} className="p-5 sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><Field label="Ảnh đại diện (URL)" description="Dùng liên kết ảnh HTTPS để hiển thị ảnh cá nhân."><input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} placeholder="https://..." className="field" /></Field><Field label="Mục tiêu học tập" description="Tối đa 220 ký tự, hiển thị trên trang Tổng quan."><input id="learningGoal" name="learningGoal" defaultValue={profile.learningGoal ?? ""} maxLength={220} placeholder="Ví dụ: Đạt 7.0 IELTS trong 12 tuần" className="field" /></Field><Field label="Giới thiệu bản thân" full description="Một vài dòng về điều bạn muốn chinh phục."><textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={500} placeholder="Mục tiêu học tập hoặc điều bạn muốn chinh phục…" className="field min-h-32 resize-y" /></Field></div><fieldset className="mt-6 rounded-xl border border-border-light bg-muted/55 p-4"><legend className="px-1 text-sm font-bold text-foreground"><BellRing className="mr-1 inline-block text-primary" size={15} />Thông báo</legend><div className="mt-3 grid gap-3 md:grid-cols-3">{preferenceLabels.map(([name, title, note]) => <label key={name} className="flex cursor-pointer gap-3 rounded-lg border border-border-light bg-surface p-3 text-xs transition-colors hover:border-primary/25"><input name={name} type="checkbox" defaultChecked={profile.notificationPreferences?.[name] ?? true} className="mt-0.5 size-4 accent-primary" /><span><strong className="text-foreground">{title}</strong><span className="mt-1 block leading-4 text-text-muted">{note}</span></span></label>)}</div></fieldset><div className="mt-6 flex flex-wrap items-center gap-3"><Button disabled={updateProfile.isPending} className="rounded-full">{updateProfile.isPending ? "Đang lưu thay đổi…" : <><PencilLine size={15} />Lưu thay đổi</>}</Button><span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 size={14} />Thông tin được bảo vệ theo tài khoản của bạn.</span></div></form></section></main></AccountLayout>;
}

function Field({ label, description, full, children }: { label: string; description: string; full?: boolean; children: React.ReactNode }) { return <label className={`block text-xs font-semibold text-text-secondary ${full ? "sm:col-span-2" : ""}`}><span className="text-foreground">{label}</span><span className="mt-1 block text-[11px] font-normal leading-4 text-text-muted">{description}</span><span className="mt-2 block">{children}</span></label>; }
