import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import { ROUTES } from "@/lib/routes";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Compass, Home, SearchX, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

export default function NotFound() {
  const { mutate: reportNotFound } = trpc.telemetry.reportNotFound.useMutation();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const eventKey = `dshare:not-found:${path}`;
    if (window.sessionStorage.getItem(eventKey)) return;
    window.sessionStorage.setItem(eventKey, "1");
    let referrerPath: string | null = null;
    try {
      const referrer = new URL(document.referrer);
      if (referrer.origin === window.location.origin) referrerPath = referrer.pathname;
    } catch {
      referrerPath = null;
    }
    reportNotFound({ path, referrerPath });
  }, [reportNotFound]);
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_78%_16%,rgba(139,92,246,.14),transparent_24%),radial-gradient(circle_at_18%_76%,rgba(32,201,151,.13),transparent_26%),var(--background)] text-foreground">
      <SiteHeader />
      <main className="container grid min-h-[calc(100vh-68px)] items-center py-12 sm:py-16">
        <section className="grid gap-10 overflow-hidden rounded-[32px] border border-border bg-surface p-7 shadow-[var(--shadow-lg)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-primary"><SearchX size={14} />Lỗi điều hướng</span>
            <p className="mt-7 font-mono text-[clamp(5rem,14vw,9rem)] font-black leading-none tracking-[-.09em] text-primary/18">404</p>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-[-.045em] text-foreground">Không tìm thấy trang này</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-text-secondary">Đường dẫn có thể đã thay đổi, đã hết hiệu lực hoặc chưa tồn tại. Bạn có thể quay về trang chủ hoặc tiếp tục với những điểm đến phổ biến bên dưới.</p>
            <div id="not-found-button-group" className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="cta-gradient rounded-full px-6"><Link href={ROUTES.home}><Home size={16} />Về trang chủ</Link></Button><Button asChild variant="outline" size="lg" className="rounded-full px-6"><Link href={ROUTES.explore}><Compass size={16} />Khám phá Quiz</Link></Button></div>
          </div>
          <aside className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(145deg,var(--primary-light),#f1ecff)] p-6 sm:p-8">
            <span aria-hidden="true" className="absolute -right-6 -top-7 size-32 rounded-full bg-accent/20 blur-xl" />
            <div className="relative grid size-14 place-items-center rounded-2xl bg-surface text-primary shadow-[var(--shadow-md)]"><Sparkles size={25} /></div>
            <p className="relative mt-8 text-[11px] font-bold uppercase tracking-[.15em] text-primary">Lối tắt hữu ích</p>
            <div className="relative mt-4 space-y-2"><QuickLink href={ROUTES.pricing} label="Xem bảng giá" /><QuickLink href={ROUTES.quizBuilder} label="Tạo Quiz mới" /><QuickLink href={ROUTES.leaderboard} label="Bảng xếp hạng" /></div>
            <p className="relative mt-8 text-xs leading-5 text-text-secondary">Hãy dùng các liên kết hiện hành để tiếp tục học, tạo Quiz hoặc quản lý tài khoản.</p>
          </aside>
        </section>
      </main>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="group flex min-h-11 items-center justify-between rounded-xl border border-white/70 bg-white/65 px-4 text-sm font-bold text-foreground shadow-sm transition-[background-color,transform] duration-200 hover:translate-x-0.5 hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"><span>{label}</span><ArrowRight size={15} className="text-primary transition-transform duration-200 group-hover:translate-x-0.5" /></Link>;
}
