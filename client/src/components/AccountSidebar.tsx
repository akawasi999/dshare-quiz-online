import { useAuth } from "@/_core/hooks/useAuth";
import { CreditCard, GraduationCap, HandHeart, History, LayoutDashboard, LogOut, Medal, PanelLeftClose, PanelLeftOpen, PlusCircle, Sparkles, Target, Trophy, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/routes";

const SIDEBAR_STATE_KEY = "dshare-account-sidebar-collapsed";
const links = [
  [LayoutDashboard, "Bảng điều khiển", ROUTES.account], [Target, "Nhiệm vụ", ROUTES.missions], [Medal, "Thành tích", ROUTES.achievements], [PlusCircle, "Quiz của tôi", ROUTES.myQuizzes], [GraduationCap, "Làm Quiz", ROUTES.explore], [Trophy, "Bảng xếp hạng", ROUTES.leaderboard], [UsersRound, "Mời bạn bè", ROUTES.referrals], [UserRound, "Thông tin cá nhân", `${ROUTES.account}#thiet-lap`], [CreditCard, "Nạp Point", ROUTES.billing], [Sparkles, "Nâng cấp tài khoản", ROUTES.pricing], [History, "Lịch sử giao dịch", ROUTES.wallet], [HandHeart, "Hỗ trợ", "mailto:support@dshare.vn"],
] as const;

export default function AccountSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => { setCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === "true"); }, []);
  useEffect(() => { setNavigatingTo(null); }, [location]);
  const toggleCollapsed = () => setCollapsed(current => { const next = !current; window.localStorage.setItem(SIDEBAR_STATE_KEY, String(next)); return next; });
  const navigate = (href: string) => {
    if (href.startsWith("mailto:")) { window.location.assign(href); return; }
    setNavigatingTo(href);
    setLocation(href);
  };
  const userName = user?.name ?? "Tài khoản Dshare";

  return <aside aria-label="Thanh điều hướng tài khoản" className={`sticky top-[76px] hidden h-[calc(100dvh-76px)] shrink-0 self-start overflow-hidden border-r border-border bg-surface/90 p-3 backdrop-blur lg:flex lg:flex-col ${collapsed ? "w-[76px]" : "w-64"} transition-[width] duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none`}>
    <div className={`flex shrink-0 items-center ${collapsed ? "justify-center" : "justify-between"}`}>
      <button type="button" onClick={toggleCollapsed} title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} aria-pressed={collapsed} className="grid size-10 place-items-center rounded-[var(--radius-md-token)] text-text-muted transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="sr-only">{collapsed ? "Mở rộng" : "Thu gọn"}</span>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
    </div>
    <div className={`mt-2 shrink-0 overflow-hidden rounded-[var(--radius-lg-token)] bg-primary-light transition-[padding] duration-200 motion-reduce:transition-none ${collapsed ? "p-2" : "p-4"}`}><div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md-token)] bg-primary font-serif text-lg font-bold text-primary-foreground">{userName.slice(0, 1).toUpperCase()}</div><div className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${collapsed ? "grid-rows-[0fr] opacity-0" : "mt-3 grid-rows-[1fr] opacity-100"}`}><div className="min-w-0 overflow-hidden"><p className="truncate text-sm font-bold text-foreground">{userName}</p><p className="mt-1 text-[11px] text-muted-foreground">Không gian học tập cá nhân</p></div></div></div>
    <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1" aria-label="Điều hướng tài khoản">{links.map(([Icon, label, href]) => { const active = location === href.split("#")[0]; const navigating = navigatingTo === href; return <button key={label} type="button" onClick={() => navigate(href)} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className={`group relative flex min-h-11 w-full items-center rounded-[var(--radius-md-token)] text-left text-xs font-semibold transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ease-out)] hover:-translate-y-px active:scale-[.98] motion-reduce:transition-none ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${active ? "bg-primary-light text-primary shadow-[inset_3px_0_0_var(--primary)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${navigating ? "scale-[.98] opacity-75" : ""}`} aria-current={active ? "page" : undefined}><Icon size={16} className={`shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none ${active ? "text-primary" : ""}`} /><span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none ${collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-44 translate-x-0 opacity-100"}`}>{label}</span></button>; })}</nav>
    <button type="button" onClick={logout} title={collapsed ? "Đăng xuất" : undefined} aria-label={collapsed ? "Đăng xuất" : undefined} className={`mt-4 flex min-h-11 w-full shrink-0 items-center rounded-[var(--radius-md-token)] border border-border text-left text-xs font-bold text-destructive transition-[background-color,color,transform] duration-200 hover:bg-destructive/8 active:scale-[.98] motion-reduce:transition-none ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}><LogOut size={16} className="shrink-0" /><span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 motion-reduce:transition-none ${collapsed ? "max-w-0 opacity-0" : "max-w-32 opacity-100"}`}>Đăng xuất</span></button>
  </aside>;
}
