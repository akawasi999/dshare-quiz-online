import { useAuth } from "@/_core/hooks/useAuth";
import { CreditCard, GraduationCap, HandHeart, History, LayoutDashboard, LogOut, PlusCircle, Sparkles, Trophy, UserRound, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

const links = [
  [LayoutDashboard, "Bảng điều khiển", "/ho-so"], [PlusCircle, "Tạo Quiz", "/tao-quiz"], [GraduationCap, "Làm Quiz", "/kham-pha"], [Trophy, "Bảng xếp hạng", "/bang-xep-hang"], [UsersRound, "Mời bạn bè", "/gioi-thieu"], [UserRound, "Thông tin cá nhân", "/ho-so#thiet-lap"], [CreditCard, "Nạp Point", "/nap-point"], [Sparkles, "Nâng cấp tài khoản", "/bang-gia"], [History, "Lịch sử giao dịch", "/vi"], [HandHeart, "Hỗ trợ", "mailto:support@dshare.vn"],
] as const;

export default function AccountSidebar() {
  const { user, logout } = useAuth(); const [location, setLocation] = useLocation();
  return <aside className="sticky top-0 hidden h-[calc(100vh-76px)] w-64 shrink-0 border-r border-[#172554]/10 bg-white/70 p-4 backdrop-blur lg:flex lg:flex-col"><div className="rounded-2xl bg-[#eef4ff] p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2563eb] font-serif text-lg font-bold text-white">{user?.name?.slice(0, 1).toUpperCase() ?? "D"}</div><p className="mt-3 truncate text-sm font-bold text-[#172554]">{user?.name ?? "Tài khoản Dshare"}</p><p className="mt-1 text-[11px] text-[#617786]">Không gian học tập cá nhân</p></div><nav className="mt-5 space-y-1" aria-label="Điều hướng tài khoản">{links.map(([Icon, label, href]) => <button key={label} type="button" onClick={() => href.startsWith("mailto:") ? window.location.assign(href) : setLocation(href)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${location === href.split("#")[0] && label === "Bảng điều khiển" ? "bg-[#172554] text-white" : "text-[#617786] hover:bg-[#eef4ff] hover:text-[#172554]"}`}><Icon size={16} />{label}</button>)}</nav><button type="button" onClick={logout} className="mt-auto flex w-full items-center gap-3 rounded-xl border border-[#172554]/10 px-3 py-2.5 text-left text-xs font-bold text-[#aa5146] hover:bg-[#fff7f5]"><LogOut size={16} />Đăng xuất</button></aside>;
}
