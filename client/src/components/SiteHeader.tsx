import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronDown, Crown, Menu, Sparkles, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const links = [
  { href: "/kham-pha", label: "Khám phá" },
  { href: "/bang-xep-hang", label: "Xếp hạng" },
  { href: "/bang-gia", label: "Gói học" },
];

export default function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const isDark = variant === "dark";

  return (
    <header className={cn("relative z-40 border-b", isDark ? "border-white/10 text-white" : "border-[#13293d]/8 text-[#13293d]") }>
      <div className="container flex h-[76px] items-center justify-between gap-5">
        <Link href="/" className="group flex items-center gap-3" aria-label="Dshare Quiz Online">
          <span className={cn("grid h-10 w-10 place-items-center rounded-[14px] shadow-sm transition-transform duration-200 group-hover:-rotate-3", isDark ? "bg-[#e3c27c] text-[#10273a]" : "bg-[#102d43] text-[#f8f3e7]") }>
            <BookOpen size={19} strokeWidth={2.3} />
          </span>
          <span className="leading-none">
            <span className="block font-serif text-[19px] font-semibold tracking-[-0.04em]">dshare</span>
            <span className={cn("mt-1 block text-[9px] font-bold uppercase tracking-[0.22em]", isDark ? "text-[#d8bb7c]" : "text-[#9b7536]")}>quiz online</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Điều hướng chính">
          {links.map(link => (
            <Link key={link.href} href={link.href} className={cn("text-[13px] font-medium transition-colors hover:text-[#b48639]", location === link.href && "text-[#b48639]")}>{link.label}</Link>
          ))}
          <span className={cn("h-4 w-px", isDark ? "bg-white/20" : "bg-[#13293d]/15")} />
          <a href="#ve-dshare" className="text-[13px] font-medium transition-colors hover:text-[#b48639]">Về Dshare</a>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {loading ? <span className="text-xs opacity-70">Đang xác thực...</span> : user ? (
            <div className="flex items-center gap-2">
              <Link href="/ho-so" className={cn("flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors", isDark ? "bg-white/10 hover:bg-white/15" : "bg-[#eff1ed] hover:bg-[#e3e6e0]")}><UserRound size={14} />{user.name?.split(" ")[0] ?? "Hồ sơ"}</Link>
              <button onClick={() => logout()} className="rounded-full px-3 py-2 text-xs font-medium opacity-65 transition-opacity hover:opacity-100">Đăng xuất</button>
            </div>
          ) : (
            <>
              <button onClick={() => startLogin()} className="px-3 py-2 text-xs font-semibold transition-colors hover:text-[#b48639]">Đăng nhập</button>
              <Button onClick={() => startLogin()} className="h-10 rounded-full bg-[#b88f44] px-5 text-xs font-bold text-[#fffaf0] shadow-[0_10px_25px_rgba(184,143,68,.2)] hover:bg-[#9e7532]">Bắt đầu học</Button>
            </>
          )}
        </div>
        <button aria-label="Mở menu" onClick={() => setMenuOpen(value => !value)} className={cn("grid h-10 w-10 place-items-center rounded-xl lg:hidden", isDark ? "bg-white/10" : "bg-[#eff1ed]")}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {menuOpen && <div className={cn("absolute left-0 top-[76px] w-full border-b px-5 py-5 shadow-xl lg:hidden", isDark ? "border-white/10 bg-[#102d43]" : "border-[#13293d]/8 bg-[#fffdf8]") }>
        <div className="mx-auto flex max-w-md flex-col gap-1">
          {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-black/5">{link.label}</Link>)}
          <div className="mt-3 flex gap-2 px-2">{user ? <Button asChild className="w-full rounded-full"><Link href="/ho-so"><UserRound size={15} /> Hồ sơ học tập</Link></Button> : <Button className="w-full rounded-full bg-[#b88f44]" onClick={() => startLogin()}><Sparkles size={15} /> Đăng nhập để học</Button>}</div>
        </div>
      </div>}
    </header>
  );
}
