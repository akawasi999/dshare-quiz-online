import { useAuth } from "@/_core/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { sharedDataQueryOptions } from "@/lib/sharedDataSync";
import { cn } from "@/lib/utils";
import { BadgeAlert, Bell, BookOpen, ChevronDown, CircleHelp, Globe2, LayoutDashboard, LifeBuoy, LogOut, Megaphone, Menu, Moon, ShieldCheck, Sparkles, Sun, UserRound, WalletCards, X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

type NavMenuItem = { label: string; href: string; description?: string; depth?: number; icon?: LucideIcon; iconClassName?: string };
type NavItem = { label: string; href?: string; kind?: "topics" | "support"; items?: NavMenuItem[] };

const navigation: NavItem[] = [
  { label: "Giới thiệu về chúng tôi", href: "/#ve-dshare" },
  { label: "Khám phá", kind: "topics" },
  { label: "Bảng giá", href: "/bang-gia" },
  { label: "Blog", href: "/kham-pha" },
  { label: "Hỗ trợ khách hàng", kind: "support", items: [
    { label: "Câu hỏi thường gặp", href: "/ho-so", icon: CircleHelp, iconClassName: "bg-sky-100 text-sky-500" },
    { label: "Hướng dẫn sử dụng", href: "/tao-quiz", icon: BadgeAlert, iconClassName: "bg-violet-100 text-violet-500" },
    { label: "Tin cập nhật", href: "/kham-pha", icon: Bell, iconClassName: "bg-pink-100 text-pink-500" },
    { label: "Thông báo", href: "/ho-so", icon: Megaphone, iconClassName: "bg-rose-100 text-rose-500" },
  ] },
];

function NavDropdown({ item, open, onOpen, onClose, onToggle, onNavigate }: { item: NavItem; open: boolean; onOpen: () => void; onClose: () => void; onToggle: () => void; onNavigate: () => void }) {
  const menuId = useId();
  const isActive = item.items?.some(child => location.pathname === child.href.split("?")[0]);
  const isSupport = item.kind === "support";
  return <div className="relative -mx-2 inline-flex h-10 items-center px-2 after:absolute after:inset-x-0 after:top-full after:h-2 after:content-['']" onMouseEnter={onOpen} onMouseLeave={onClose}>
    <button type="button" onFocus={onOpen} onClick={onToggle} aria-expanded={open} aria-controls={menuId} className={cn("site-header-text site-header-nav-item group gap-1 rounded-md px-0 transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}><span className="site-header-nav-label">{item.label}</span><ChevronDown size={14} className={cn("site-header-nav-chevron transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]", open && "rotate-180")} /></button>
    {open ? <div id={menuId} role="menu" className={cn("absolute top-[calc(100%+0.25rem)] origin-top-left border border-border bg-surface p-2 shadow-[var(--shadow-lg)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:zoom-in-95 motion-safe:duration-200", isSupport ? "right-0 w-[230px] rounded-xl" : "left-0 max-h-[min(420px,calc(100vh-96px))] w-[260px] overflow-y-auto rounded-[var(--radius-lg-token)]")}>
      {item.items?.length ? item.items.map(child => {
        const Icon = child.icon ?? BookOpen;
        return <Link key={child.label} href={child.href} role="menuitem" onClick={onNavigate} className={cn("group/menu flex rounded-[var(--radius-sm-token)] transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isSupport ? "items-center gap-3 px-3 py-2.5 hover:bg-muted" : "items-center px-3 py-2.5 hover:bg-primary-light")}>
          {isSupport ? <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", child.iconClassName)}><Icon size={15} /></span> : null}
          <span className={cn("site-header-text min-w-0 transition-colors", isSupport ? "text-foreground group-hover/menu:text-primary" : "text-foreground")}>{child.label}</span>
        </Link>;
      }) : !isSupport ? <p className="px-3 py-4 text-sm leading-5 text-text-secondary">Chưa có Chủ đề đang hoạt động.</p> : null}
    </div> : null}
  </div>;
}

export default function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuCloseTimer = useRef<number | null>(null);
  const accountCloseTimer = useRef<number | null>(null);
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkLogo = variant === "dark" || theme === "dark";
  const publicTopics = trpc.catalog.topics.useQuery(undefined, sharedDataQueryOptions);
  const accountSummary = trpc.learner.summary.useQuery(undefined, { enabled: Boolean(user), ...sharedDataQueryOptions });
  const topicNavigationItems: NavMenuItem[] = (publicTopics.data ?? []).filter(topic => topic.parentId === null).map(topic => ({ label: topic.name, href: `/kham-pha?topic=${encodeURIComponent(topic.slug)}`, depth: 0 }));
  const navigationItems: NavItem[] = navigation.map(item => item.kind === "topics" ? { ...item, items: topicNavigationItems } : item);
  const isAdmin = user?.role === "admin";
  const accountAvatarUrl = accountSummary.data?.profile?.avatarUrl?.trim() || null;
  const pointBalance = accountSummary.data?.profile?.pointBalance ?? 0;
  const pointBalanceLabel = pointBalance.toLocaleString("vi-VN");
  const clearMenuCloseTimer = () => { if (menuCloseTimer.current !== null) { window.clearTimeout(menuCloseTimer.current); menuCloseTimer.current = null; } };
  const clearAccountCloseTimer = () => { if (accountCloseTimer.current !== null) { window.clearTimeout(accountCloseTimer.current); accountCloseTimer.current = null; } };
  const openDropdown = (label: string) => { clearMenuCloseTimer(); setOpenMenu(label); };
  const scheduleDropdownClose = (label: string) => { clearMenuCloseTimer(); menuCloseTimer.current = window.setTimeout(() => { setOpenMenu(current => current === label ? null : current); menuCloseTimer.current = null; }, 180); };
  const openAccountDropdown = () => { clearAccountCloseTimer(); setAccountOpen(true); };
  const scheduleAccountClose = () => { clearAccountCloseTimer(); accountCloseTimer.current = window.setTimeout(() => { setAccountOpen(false); accountCloseTimer.current = null; }, 180); };
  const closeAccountDropdown = () => { clearAccountCloseTimer(); setAccountOpen(false); };

  useEffect(() => { setOpenMenu(null); setAccountOpen(false); clearMenuCloseTimer(); clearAccountCloseTimer(); }, [location]);
  useEffect(() => () => { clearMenuCloseTimer(); clearAccountCloseTimer(); }, []);

  return <header className="relative z-40 border-b border-border bg-surface text-foreground" data-theme-variant={variant}>
    <div className="container flex h-[68px] items-center gap-4">
      <Link href="/" className="group flex shrink-0 items-center" aria-label="Dshare Quiz Online"><BrandLogo monochrome={isDarkLogo} className="h-8 max-w-[122px] transition-transform duration-200 group-hover:scale-[1.02] sm:h-9 sm:max-w-[142px]" /></Link>
      <nav className="site-header-navigation hidden min-w-0 flex-1 items-center gap-5 xl:gap-8 lg:flex" aria-label="Điều hướng chính">
        {navigationItems.map(item => item.href ? <Link key={item.label} href={item.href} className={cn("site-header-text site-header-nav-item rounded-md px-0 transition-[color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20", location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground")}><span className="site-header-nav-label">{item.label}</span></Link> : <NavDropdown key={item.label} item={item} open={openMenu === item.label} onOpen={() => openDropdown(item.label)} onClose={() => scheduleDropdownClose(item.label)} onToggle={() => { clearMenuCloseTimer(); setOpenMenu(item.label); }} onNavigate={() => { clearMenuCloseTimer(); setOpenMenu(null); }} />)}
      </nav>
      <div className="ml-auto hidden shrink-0 items-center gap-1.5 lg:flex">
        <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"} aria-pressed={theme === "dark"} className="grid size-9 place-items-center rounded-full text-muted-foreground transition-[color,background-color,transform] duration-200 hover:scale-105 hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button type="button" aria-label="Ngôn ngữ hiển thị: Tiếng Việt" className="site-header-text flex h-9 items-center gap-1 rounded-md px-2 text-muted-foreground transition-[color,background-color,transform] duration-200 hover:-translate-y-px hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"><Globe2 size={15} />vi</button>
        {loading ? <span className="site-header-text px-2 text-muted-foreground">Đang xác thực...</span> : user ? <div className="relative -mx-2 inline-flex h-10 items-center px-2 after:absolute after:inset-x-0 after:top-full after:h-2 after:content-['']" onMouseEnter={openAccountDropdown} onMouseLeave={scheduleAccountClose} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closeAccountDropdown(); }}>
          <Link href="/ho-so" aria-label={`Tài khoản ${user.name?.split(" ")[0] ?? "Hồ sơ"}`} aria-expanded={accountOpen} aria-controls="account-navigation" onFocus={openAccountDropdown} onClick={closeAccountDropdown} className="site-header-text flex h-10 items-center gap-2 rounded-full bg-muted px-2.5 text-foreground transition-[color,background-color,transform] duration-200 hover:-translate-y-px hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20">{accountAvatarUrl ? <img src={accountAvatarUrl} alt={`Ảnh đại diện của ${user.name?.split(" ")[0] ?? "tài khoản"}`} className="size-6 rounded-full object-cover ring-1 ring-border/70" /> : <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{user.name?.slice(0, 1).toUpperCase() ?? "D"}</span>}{user.name?.split(" ")[0] ?? "Hồ sơ"}<ChevronDown size={14} className={cn("site-header-nav-chevron transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]", accountOpen && "rotate-180")} /></Link>
          {accountOpen ? <div id="account-navigation" role="menu" className="account-dropdown absolute right-2 top-[calc(100%+0.25rem)] w-[236px] origin-top-right rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-lg)]">
            <Link href="/ho-so" role="menuitem" onClick={closeAccountDropdown} className="site-header-text flex items-center gap-3 rounded-[var(--radius-sm-token)] px-3 py-2.5 text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LayoutDashboard size={16} />Bảng điều khiển</Link>
            <Link href="/vi" role="menuitem" onClick={closeAccountDropdown} className="site-header-text flex items-center gap-3 rounded-[var(--radius-sm-token)] px-3 py-2.5 text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><WalletCards size={16} /><span className="flex-1">Ví Point</span><span className="text-xs font-bold text-primary">{pointBalanceLabel}</span></Link>
            {isAdmin ? <Link href="/quan-tri" role="menuitem" onClick={closeAccountDropdown} className="site-header-text flex items-center gap-3 rounded-[var(--radius-sm-token)] px-3 py-2.5 text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ShieldCheck size={16} />Admin CPanel</Link> : null}
            <div className="my-1 border-t border-border-light" />
            <button type="button" role="menuitem" onClick={() => { closeAccountDropdown(); void logout(); }} className="site-header-text flex w-full items-center gap-3 rounded-[var(--radius-sm-token)] px-3 py-2.5 text-danger transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LogOut size={16} />Đăng xuất</button>
          </div> : null}
        </div> : <><Button size="sm" onClick={() => startLogin()} className="site-header-text h-9 rounded-md px-4 shadow-none"><Sparkles size={14} />Bắt đầu</Button><button type="button" onClick={() => startLogin()} className="site-header-text min-h-10 rounded-md px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-primary">Đăng nhập</button></>}
      </div>
      <button type="button" aria-label={menuOpen ? "Đóng menu" : "Mở menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(value => !value)} className="ml-auto grid size-11 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary transition-[background-color,transform] duration-200 hover:scale-[1.03] hover:bg-primary-light/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 lg:hidden">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
    </div>
    {menuOpen ? <div id="mobile-navigation" className="absolute left-0 top-[68px] w-full border-b border-border bg-surface px-5 py-4 shadow-[var(--shadow-md)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 lg:hidden"><div className="mx-auto flex max-w-md flex-col gap-1">{navigationItems.map(item => <div key={item.label} className="rounded-[var(--radius-md-token)] border border-transparent bg-transparent"><p className="flex min-h-11 items-center px-4 text-sm font-bold text-foreground">{item.href ? <Link href={item.href} onClick={() => setMenuOpen(false)} className="w-full">{item.label}</Link> : item.label}</p>{item.items ? <div className="-mt-1 space-y-0.5 px-2 pb-2">{item.items.length ? item.items.map(child => { const Icon = child.icon ?? BookOpen; return <Link key={child.label} href={child.href} onClick={() => setMenuOpen(false)} className="flex min-h-10 items-center gap-2 rounded-[var(--radius-sm-token)] px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"><Icon size={13} />{child.depth ? <span aria-hidden="true" className="text-text-muted">{"— ".repeat(child.depth)}</span> : null}{child.label}</Link>; }) : item.kind === "topics" ? <p className="px-3 py-2 text-xs text-text-secondary">Chưa có Chủ đề đang hoạt động.</p> : null}</div> : null}</div>)}<div className="mt-2 border-t border-border-light pt-3"><button type="button" onClick={toggleTheme} className="flex min-h-11 w-full items-center justify-between rounded-[var(--radius-md-token)] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><span>{theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}</span>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button><div className="mt-3 space-y-2 px-1">{user ? <><Button asChild className="w-full rounded-md"><Link href="/ho-so" onClick={() => setMenuOpen(false)}><LayoutDashboard size={15} /> Bảng điều khiển</Link></Button><Button asChild variant="outline" className="w-full rounded-md"><Link href="/vi" onClick={() => setMenuOpen(false)}><WalletCards size={15} /> Ví Point · {pointBalanceLabel}</Link></Button>{isAdmin ? <Button asChild variant="outline" className="w-full rounded-md"><Link href="/quan-tri" onClick={() => setMenuOpen(false)}><ShieldCheck size={15} /> Admin CPanel</Link></Button> : null}<Button variant="ghost" className="w-full justify-start rounded-md text-danger hover:bg-red-50 hover:text-danger" onClick={() => { setMenuOpen(false); void logout(); }}><LogOut size={15} /> Đăng xuất</Button></> : <div className="grid grid-cols-2 gap-2"><Button className="rounded-md" onClick={() => startLogin()}><Sparkles size={15} /> Bắt đầu</Button><Button variant="outline" className="rounded-md" onClick={() => startLogin()}><LifeBuoy size={15} /> Đăng nhập</Button></div>}</div></div></div></div> : null}
  </header>;
}
