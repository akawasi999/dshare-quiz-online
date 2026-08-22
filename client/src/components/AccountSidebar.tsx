import { useAuth } from "@/_core/hooks/useAuth";
import { CreditCard, GraduationCap, HandHeart, History, LayoutDashboard, LogOut, PlusCircle, Sparkles, Trophy, UserRound, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const links = [
  [LayoutDashboard, "Bảng điều khiển", "/ho-so"], [PlusCircle, "Quiz của tôi", "/quiz-cua-toi"], [GraduationCap, "Làm Quiz", "/kham-pha"], [Trophy, "Bảng xếp hạng", "/bang-xep-hang"], [UsersRound, "Mời bạn bè", "/gioi-thieu"], [UserRound, "Thông tin cá nhân", "/ho-so#thiet-lap"], [CreditCard, "Nạp Point", "/nap-point"], [Sparkles, "Nâng cấp tài khoản", "/bang-gia"], [History, "Lịch sử giao dịch", "/vi"], [HandHeart, "Hỗ trợ", "mailto:support@dshare.vn"],
] as const;

export default function AccountSidebar() {
  const { user, logout } = useAuth(); const [location, setLocation] = useLocation();
  return <aside className="sticky top-[76px] hidden h-[calc(100vh-76px)] w-64 shrink-0 border-r border-border bg-surface/90 p-4 backdrop-blur lg:flex lg:flex-col"><div className="rounded-[var(--radius-lg-token)] bg-primary-light p-4"><div className="grid h-11 w-11 place-items-center rounded-[var(--radius-md-token)] bg-primary font-serif text-lg font-bold text-primary-foreground">{user?.name?.slice(0, 1).toUpperCase() ?? "D"}</div><p className="mt-3 truncate text-sm font-bold text-foreground">{user?.name ?? "Tài khoản Dshare"}</p><p className="mt-1 text-[11px] text-muted-foreground">Không gian học tập cá nhân</p></div><nav className="mt-5 space-y-1" aria-label="Điều hướng tài khoản">{links.map(([Icon, label, href]) => { const active = location === href.split("#")[0]; return <button key={label} type="button" onClick={() => href.startsWith("mailto:") ? window.location.assign(href) : setLocation(href)} className={`flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md-token)] px-3 text-left text-xs font-semibold transition-colors ${active ? "bg-primary-light text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} aria-current={active ? "page" : undefined}><Icon size={16} />{label}</button>; })}</nav><button type="button" onClick={logout} className="mt-auto flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md-token)] border border-border px-3 text-left text-xs font-bold text-destructive hover:bg-destructive/8"><LogOut size={16} />Đăng xuất</button></aside>;
}
