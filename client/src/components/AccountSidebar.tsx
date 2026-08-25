import { useAuth } from "@/_core/hooks/useAuth";
import { Award, Compass, CreditCard, GraduationCap, HandHeart, History, LayoutDashboard, LogOut, Medal, PanelLeftClose, PanelLeftOpen, PlusCircle, Sparkles, Target, Trophy, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/routes";

const SIDEBAR_STATE_KEY = "dshare-account-sidebar-collapsed";
const upgradeChest = "/manus-storage/profile-upgrade-chest_9af97ca5.png";
const navigationGroups = [
  { label: "Tổng quan", items: [[LayoutDashboard, "Tổng quan", ROUTES.dashboard]] },
  { label: "Quiz", items: [[Compass, "Khám phá", ROUTES.explore], [GraduationCap, "Làm Quiz", ROUTES.practice], [PlusCircle, "Quiz của tôi", ROUTES.myQuizzes]] },
  { label: "Tài khoản", items: [[CreditCard, "Nạp Point", ROUTES.billing], [Sparkles, "Nâng cấp tài khoản", ROUTES.pricing], [UserRound, "Thông tin cá nhân", ROUTES.account]] },
  { label: "Giao dịch", items: [[History, "Lịch sử giao dịch", ROUTES.wallet]] },
  { label: "Hỗ trợ", items: [[HandHeart, "Hỗ trợ", "mailto:support@dshare.vn"]] },
] as const;

export default function AccountSidebar() {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  useEffect(() => { setCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === "true"); }, []);
  useEffect(() => { setNavigatingTo(null); }, [location]);
  const toggleCollapsed = () => setCollapsed(current => { const next = !current; window.localStorage.setItem(SIDEBAR_STATE_KEY, String(next)); return next; });
  const navigate = (href: string) => { if (href.startsWith("mailto:")) { window.location.assign(href); return; } setNavigatingTo(href); setLocation(href); };

  return <aside aria-label="Thanh điều hướng tài khoản" className={`hidden shrink-0 self-stretch border-r border-border bg-surface/90 p-3 lg:flex lg:flex-col ${collapsed ? "w-[76px]" : "w-64"} transition-[width] duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none`}>
    <div className={`flex shrink-0 items-center border-b border-border-light pb-3 ${collapsed ? "justify-center" : "justify-between"}`}><p className={`overflow-hidden text-[10px] font-extrabold uppercase tracking-[.18em] text-text-muted transition-[max-width,opacity] duration-200 motion-reduce:transition-none ${collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"}`}>Điều hướng</p><button type="button" onClick={toggleCollapsed} title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} aria-pressed={collapsed} className="grid size-10 place-items-center rounded-[var(--radius-md-token)] text-text-muted transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="sr-only">{collapsed ? "Mở rộng" : "Thu gọn"}</span>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
    <nav className="mt-2 space-y-2" aria-label="Điều hướng tài khoản">{navigationGroups.map(group => <section key={group.label}><p className={`mb-0.5 overflow-hidden px-3 text-[9px] font-extrabold uppercase tracking-[.15em] text-text-muted transition-[max-width,opacity] duration-200 motion-reduce:transition-none ${collapsed ? "max-h-0 max-w-0 py-0 opacity-0" : "max-h-5 max-w-40 py-0.5 opacity-100"}`}>{group.label}</p><div className="space-y-0.5">{group.items.map(([Icon, label, href]) => { const active = location === href.split("#")[0]; const navigating = navigatingTo === href; return <button key={label} type="button" onClick={() => navigate(href)} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className={`group relative flex min-h-8 w-full items-center rounded-[var(--radius-md-token)] text-left text-[11px] font-semibold transition-[background-color,color,transform] duration-200 [transition-timing-function:var(--ease-out)] hover:-translate-y-px active:scale-[.98] motion-reduce:transition-none ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${active ? "bg-[linear-gradient(135deg,#7445ed,#4b55e8)] text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${navigating ? "scale-[.98] opacity-75" : ""}`} aria-current={active ? "page" : undefined}><Icon size={15} className="shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none" /><span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none ${collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-44 translate-x-0 opacity-100"}`}>{label}</span></button>; })}</div></section>)}</nav>
    <section className={`relative mt-3 overflow-hidden rounded-xl bg-[linear-gradient(145deg,#7750f2,#3656e8)] p-3 text-white shadow-sm ${collapsed ? "hidden" : "block"}`} aria-label="Nâng cấp tài khoản"><img src={upgradeChest} alt="" aria-hidden="true" className="pointer-events-none absolute -right-4 bottom-0 h-20 w-24 object-contain opacity-90" /><div className="relative max-w-[130px]"><p className="text-xs font-extrabold">Nâng cấp tài khoản</p><p className="mt-1 text-[10px] leading-4 text-white/85">Nhận nhiều đặc quyền và phần thưởng hấp dẫn</p><button type="button" onClick={() => navigate(ROUTES.pricing)} className="mt-2 w-full rounded-md bg-white px-2 py-1.5 text-[10px] font-bold text-violet-700 transition-transform active:scale-[.98]">Nâng cấp ngay</button></div></section>
    <button type="button" onClick={logout} title={collapsed ? "Đăng xuất" : undefined} aria-label={collapsed ? "Đăng xuất" : undefined} className={`mt-3 flex min-h-10 w-full shrink-0 items-center rounded-[var(--radius-md-token)] border border-border text-left text-xs font-bold text-destructive transition-[background-color,color,transform] duration-200 hover:bg-destructive/8 active:scale-[.98] motion-reduce:transition-none ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}><LogOut size={16} className="shrink-0" /><span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 motion-reduce:transition-none ${collapsed ? "max-w-0 opacity-0" : "max-w-32 opacity-100"}`}>Đăng xuất</span></button>
  </aside>;
}
