import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Check, Copy, Gift, Link2, Loader2, Sparkles, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Referral() {
  const { user, loading } = useAuth();
  const referral = trpc.learner.referral.useQuery(undefined, { enabled: Boolean(user) });
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const apply = trpc.learner.applyReferralCode.useMutation({
    onSuccess: result => { referral.refetch(); setCode(""); toast.success(`Đã nhận ${result.recipientReward} XP chào mừng.`); },
    onError: error => toast.error("Không thể áp dụng mã", { description: error.message }),
  });
  const copyCode = async () => {
    if (!referral.data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(referral.data.referralCode);
      setCopied(true);
      toast.success("Đã sao chép mã giới thiệu.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Không thể sao chép mã", { description: "Hãy thử sao chép lại hoặc nhập thủ công." });
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><SiteHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center" role="status" aria-live="polite"><span className="flex items-center gap-3 text-sm text-text-secondary"><Loader2 className="animate-spin text-primary" />Đang mở không gian giới thiệu…</span></main></div>;
  if (!user) return <div className="min-h-screen bg-background"><SiteHeader /><main className="container grid min-h-[calc(100vh-76px)] place-items-center py-12"><div className="max-w-md rounded-[var(--radius-xl-token)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-md)]"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-light text-primary"><Gift size={27} /></span><h1 className="mt-6 font-serif text-3xl font-semibold tracking-[-.04em] text-foreground">Cùng học tốt hơn.</h1><p className="mt-3 text-sm leading-6 text-text-secondary">Đăng nhập để lấy mã giới thiệu của bạn và nhận XP khi bạn bè bắt đầu hành trình học.</p><Button onClick={() => startLogin()} className="mt-7 rounded-full px-6">Đăng nhập để giới thiệu</Button></div></main></div>;

  const data = referral.data;
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader />
    <main className="container py-8 sm:py-10 lg:py-12">
      <header className="relative isolate overflow-hidden rounded-[var(--radius-xl-token)] bg-gradient-to-br from-primary via-primary to-accent px-6 py-8 text-primary-foreground shadow-[var(--shadow-lg)] sm:px-9 sm:py-10 lg:px-11">
        <div className="absolute -right-16 -top-24 size-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-white"><UsersRound size={13} /> Giới thiệu bạn bè</span><h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-5xl">Cùng học, cùng nhận XP.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/82 sm:text-[15px]">Mời bạn bè tham gia Dshare. Khi họ nhập mã của bạn lần đầu, bạn nhận 20 XP và người học mới nhận 10 XP chào mừng.</p></div>
        <Gift className="absolute bottom-8 right-8 hidden text-white/15 lg:block" size={150} aria-hidden="true" />
      </header>

      {referral.error ? <section className="mt-6 flex flex-wrap items-center gap-3 rounded-[var(--radius-lg-token)] border border-danger/15 bg-danger/8 p-5 text-sm text-danger" role="alert"><p>Chưa tải được dữ liệu giới thiệu. {referral.error.message}</p><Button onClick={() => referral.refetch()} variant="outline" className="rounded-full border-danger/25 text-danger hover:bg-danger/10 hover:text-danger">Thử lại</Button></section> : <>
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
          <div className="relative overflow-hidden rounded-[var(--radius-xl-token)] bg-primary p-6 text-primary-foreground shadow-[var(--shadow-md)] sm:p-8"><div className="absolute -right-10 -bottom-16 hidden size-52 rounded-full border-[30px] border-white/10 sm:block" aria-hidden="true" /><div className="relative z-10"><span className="grid size-11 place-items-center rounded-2xl bg-white/12 text-white"><Link2 size={21} /></span><p className="mt-7 text-[10px] font-bold uppercase tracking-[.17em] text-white/65">Mã giới thiệu của bạn</p><div className="mt-3 flex flex-wrap items-center gap-3"><p className="font-serif text-4xl font-semibold tracking-[.1em] sm:text-5xl">{referral.isLoading ? "······" : data?.referralCode}</p><Button onClick={copyCode} variant="outline" className="rounded-full border-white/25 bg-white/8 text-white hover:bg-white/15 hover:text-white">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Đã sao chép" : "Sao chép mã"}</Button></div><p className="mt-5 max-w-lg text-sm leading-6 text-white/76">Gửi mã này cho người bạn muốn cùng học. Mỗi người chỉ có thể nhập một lần và hệ thống sẽ ghi nhận XP ngay sau khi áp dụng.</p></div></div>
          <div className="rounded-[var(--radius-xl-token)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)] sm:p-8"><span className="grid size-11 place-items-center rounded-2xl bg-warning/12 text-warning"><Sparkles size={21} /></span><p className="mt-7 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Phần thưởng đã nhận</p><p className="mt-2 font-serif text-5xl font-semibold tracking-[-.05em] text-foreground">{data?.totalRewarded ?? 0}<span className="ml-2 text-lg font-medium text-text-secondary">XP</span></p><p className="mt-3 text-sm leading-6 text-text-secondary">Từ {data?.invitations.length ?? 0} lượt giới thiệu đã ghi nhận.</p></div>
        </section>

        {data?.referredByCode ? <section className="mt-6 rounded-[var(--radius-lg-token)] border border-success/15 bg-success/10 p-5 text-sm leading-6 text-success"><Check className="mr-2 inline" size={17} />Bạn đã áp dụng mã giới thiệu <strong>{data.referredByCode}</strong>. Cảm ơn bạn đã bắt đầu cùng cộng đồng Dshare.</section> : <section className="mt-6 rounded-[var(--radius-xl-token)] border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Bạn được mời?</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-.04em] text-foreground">Nhập mã của người giới thiệu</h2><p className="mt-2 text-sm text-text-secondary">Nhận ngay 10 XP chào mừng. Mã chỉ áp dụng một lần.</p></div><div className="flex w-full max-w-md gap-2"><Input value={code} onChange={event => setCode(event.target.value.toUpperCase())} maxLength={20} placeholder="Ví dụ: DS000001" className="uppercase" /><Button disabled={apply.isPending || code.trim().length < 4} onClick={() => apply.mutate({ code })} className="shrink-0 rounded-full">{apply.isPending ? <Loader2 className="animate-spin" size={15} /> : "Áp dụng"}</Button></div></div></section>}

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]"><div className="rounded-[var(--radius-xl-token)] border border-border bg-surface p-6 shadow-[var(--shadow-sm)] sm:p-7"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-primary-light text-primary"><UsersRound size={20} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-primary">Người học được giới thiệu</p><h2 className="mt-1 font-serif text-2xl font-semibold text-foreground">{data?.invitations.length ?? 0} lượt ghi nhận</h2></div></div><div className="mt-6 divide-y divide-border-light">{data?.invitations.length ? data.invitations.map(item => <div key={item.profile.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{item.name ?? "Người học mới"}</p><p className="mt-1 truncate text-xs text-text-secondary">{item.email ?? "Đã liên kết tài khoản"}</p></div><span className="shrink-0 rounded-full bg-success/10 px-3 py-1.5 text-xs font-bold text-success">+20 XP</span></div>) : <p className="py-8 text-sm leading-6 text-text-secondary">Chưa có lượt giới thiệu nào. Hãy sao chép mã và gửi đến bạn bè để bắt đầu.</p>}</div></div><div className="rounded-[var(--radius-xl-token)] border border-primary/10 bg-muted p-6 sm:p-7"><span className="grid size-11 place-items-center rounded-2xl bg-surface text-primary shadow-[var(--shadow-sm)]"><Gift size={20} /></span><p className="mt-6 text-[10px] font-bold uppercase tracking-[.15em] text-primary">Lịch sử thưởng referral</p><div className="mt-4 space-y-3">{data?.rewards.length ? data.rewards.slice(0, 4).map(item => <div key={item.id} className="rounded-[var(--radius-md-token)] border border-border bg-surface p-4"><p className="text-sm font-bold text-success">+{item.amount} XP</p><p className="mt-1 text-xs leading-5 text-text-secondary">{item.reason}</p></div>) : <p className="text-sm leading-6 text-text-secondary">XP thưởng từ referral sẽ xuất hiện ở đây.</p>}</div></div></section>
      </>}
    </main>
  </div>;
}
