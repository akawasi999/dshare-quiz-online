import { useAuth } from "@/_core/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronDown, Globe2, LifeBuoy, Menu, Moon, Sparkles, Sun, UserRound, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "wouter";

type NavItem = { label: string; href?: string; items?: Array<{ label: string; href: string; description: string }> };

const navigation: NavItem[] = [
  { label: "Giới thiệu về chúng tôi", items: [{ label: "Về Dshare", href: "/#ve-dshare", description: "Tìm hiểu nền tảng và cách chúng tôi đồng hành cùng người học." }, { label: "Bắt đầu tạo Quiz", href: "/tao-quiz", description: "Tạo một bộ đề học tập phù hợp với mục tiêu của bạn." }] },
  { label: "Khám phá", items: [{ label: "Thư viện Quiz", href: "/kham-pha", description: "Khám phá bộ đề theo chủ đề và cấp độ." }, { label: "Luyện tập", href: "/luyen-tap", description: "Ôn lại những nội dung cần củng cố." }] },
  { label: "Bảng giá", href: "/bang-gia" },
  { label: "Blog", items: [{ label: "Góc học tập", href: "/kham-pha", description: "Tìm nguồn cảm hứng từ các bộ đề mới." }, { label: "Hướng dẫn tạo Quiz", href: "/tao-quiz", description: "Bắt đầu biên soạn Quiz theo từng bước." }] },
  { label: "Hỗ trợ khách hàng", items: [{ label: "Trung tâm hỗ trợ", href: "/ho-so", description: "Quản lý tài khoản và nhận hỗ trợ từ Dshare." }, { label: "Báo lỗi câu hỏi", href: "/kham-pha", description: "Gửi phản hồi khi gặp nội dung cần được xem lại." }] },
];

function NavDropdown({ item, open, onToggle, onNavigate }: { item: NavItem; open: boolean; onToggle: () => void; onNavigate: () => void }) {
  const menuId = useId();
  const isActive = item.items?.some(child => location.pathname === child.href.split("#")[0]);
  return <div className="relative"><button type="button" onClick={onToggle} aria-expanded={open} aria-controls={menuId} className={cn("group flex min-h-10 items-center gap-1 rounded-md px-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}><span>{item.label}</span><ChevronDown size={14} className={cn("transition-transform duration-200", open && "rotate-180")} /></button>{open ? <div id={menuId} role="menu" className="absolute left-0 top-[calc(100%+10px)] w-[320px] rounded-[var(--radius-lg-token)] border border-border bg-surface p-2 shadow-[var(--shadow-lg)]"><p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[.14em] text-primary">{item.label}</p>{item.items?.map(child => <Link key={child.label} href={child.href} role="menuitem" onClick={onNavigate} className="block rounded-[var(--radius-sm-token)] px-3 py-3 transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="block text-xs font-bold text-foreground">{child.label}</span><span className="mt-1 block text-[11px] leading-4 text-text-secondary">{child.description}</span></Link>)}</div> : null}</div>;
}

export default function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkLogo = variant === "dark" || theme === "dark";

  useEffect(() => { setOpenMenu(null); }, [location]);

  return <header className="relative z-40 border-b border-border bg-surface text-foreground" data-theme-variant={variant}>
    <div className="container flex h-[68px] items-center gap-4">
      <Link href="/" className="group flex shrink-0 items-center" aria-label="Dshare Quiz Online"><BrandLogo monochrome={isDarkLogo} className="h-8 max-w-[122px] transition-transform duration-200 group-hover:scale-[1.02] sm:h-9 sm:max-w-[142px]" /></Link>

      <nav className="hidden min-w-0 flex-1 items-center gap-4 xl:gap-5 lg:flex" aria-label="Điều hướng chính">
        {navigation.map(item => item.href ? <Link key={item.label} href={item.href} className={cn("min-h-10 rounded-md px-1.5 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20", location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground")}>{item.label}</Link> : <NavDropdown key={item.label} item={item} open={openMenu === item.label} onToggle={() => setOpenMenu(current => current === item.label ? null : item.label)} onNavigate={() => setOpenMenu(null)} />)}
      </nav>

      <div className="ml-auto hidden shrink-0 items-center gap-1.5 lg:flex">
        <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"} aria-pressed={theme === "dark"} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button type="button" aria-label="Ngôn ngữ hiển thị: Tiếng Việt" className="flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"><Globe2 size={15} />vi</button>
        {loading ? <span className="px-2 text-xs text-muted-foreground">Đang xác thực...</span> : user ? <><Link href="/ho-so" className="flex min-h-10 items-center gap-2 rounded-full bg-muted px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary"><UserRound size={14} />{user.name?.split(" ")[0] ?? "Hồ sơ"}</Link><button type="button" onClick={() => logout()} className="min-h-10 rounded-full px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Đăng xuất</button></> : <><Button size="sm" onClick={() => startLogin()} className="h-9 rounded-md px-4 text-xs shadow-none"><Sparkles size={14} />Bắt đầu</Button><button type="button" onClick={() => startLogin()} className="min-h-10 rounded-md px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary">Đăng nhập</button></>}
      </div>

      <button type="button" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(value => !value)} className="ml-auto grid size-11 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary transition-colors hover:bg-primary-light/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 lg:hidden">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
    </div>

    {menuOpen ? <div id="mobile-navigation" className="absolute left-0 top-[68px] w-full border-b border-border bg-surface px-5 py-4 shadow-[var(--shadow-md)] lg:hidden"><div className="mx-auto flex max-w-md flex-col gap-1">{navigation.map(item => <div key={item.label} className="rounded-[var(--radius-md-token)] border border-transparent bg-transparent"><p className="flex min-h-11 items-center px-4 text-sm font-bold text-foreground">{item.href ? <Link href={item.href} onClick={() => setMenuOpen(false)} className="w-full">{item.label}</Link> : item.label}</p>{item.items ? <div className="-mt-1 space-y-0.5 px-2 pb-2">{item.items.map(child => <Link key={child.label} href={child.href} onClick={() => setMenuOpen(false)} className="flex min-h-10 items-center gap-2 rounded-[var(--radius-sm-token)] px-3 text-xs font-medium text-text-secondary hover:bg-primary-light hover:text-primary"><BookOpen size={13} />{child.label}</Link>)}</div> : null}</div>)}<div className="mt-2 border-t border-border-light pt-3"><button type="button" onClick={toggleTheme} className="flex min-h-11 w-full items-center justify-between rounded-[var(--radius-md-token)] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><span>{theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}</span>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><div className="mt-3 px-1">{user ? <Button asChild className="w-full rounded-md"><Link href="/ho-so" onClick={() => setMenuOpen(false)}><UserRound size={15} /> Hồ sơ học tập</Link></Button> : <div className="grid grid-cols-2 gap-2"><Button className="rounded-md" onClick={() => startLogin()}><Sparkles size={15} /> Bắt đầu</Button><Button variant="outline" className="rounded-md" onClick={() => startLogin()}><LifeBuoy size={15} /> Đăng nhập</Button></div>}</div></div></div></div> : null}
  </header>;
}
