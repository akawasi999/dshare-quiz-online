import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { startLogin } from "@/const";
import { cn } from "@/lib/utils";
import { Menu, Moon, Sparkles, Sun, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

const links = [
  { href: "/kham-pha", label: "Quiz" },
  { href: "/bang-gia", label: "Gói phí" },
];

export default function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkLogo = variant === "dark" || theme === "dark";

  return (
    <header className="relative z-40 border-b border-border bg-surface text-foreground" data-theme-variant={variant}>
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0 items-center" aria-label="Dshare Quiz Online">
          <BrandLogo monochrome={isDarkLogo} className="h-9 max-w-[132px] transition-transform duration-200 group-hover:scale-[1.02] sm:h-10 sm:max-w-[155px]" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Điều hướng chính">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-1 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20",
                location === link.href ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <a href="#ve-dshare" className="rounded-md px-1 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20">Về Dshare</a>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            aria-pressed={theme === "dark"}
            className="grid size-11 place-items-center rounded-full bg-primary-light text-primary transition-colors hover:bg-primary-light/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {loading ? <span className="px-2 text-xs text-muted-foreground">Đang xác thực...</span> : user ? (
            <div className="flex items-center gap-2">
              <Link href="/ho-so" className="flex min-h-11 items-center gap-2 rounded-full bg-muted px-3 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary"><UserRound size={14} />{user.name?.split(" ")[0] ?? "Hồ sơ"}</Link>
              <button type="button" onClick={() => logout()} className="min-h-11 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Đăng xuất</button>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => startLogin()} className="min-h-11 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary">Đăng nhập</button>
              <Button onClick={() => startLogin()} size="sm" className="rounded-full px-5">Bắt đầu học</Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(value => !value)}
          className="grid size-11 place-items-center rounded-[var(--radius-md-token)] bg-primary-light text-primary transition-colors hover:bg-primary-light/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 lg:hidden"
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {menuOpen ? <div id="mobile-navigation" className="absolute left-0 top-[76px] w-full border-b border-border bg-surface px-5 py-4 shadow-[var(--shadow-md)] lg:hidden">
        <div className="mx-auto flex max-w-md flex-col gap-1">
          {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center rounded-[var(--radius-md-token)] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary">{link.label}</Link>)}
          <button type="button" onClick={toggleTheme} className="mt-2 flex min-h-11 w-full items-center justify-between rounded-[var(--radius-md-token)] px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><span>{theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}</span>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
          <div className="mt-3 px-1">{user ? <Button asChild className="w-full"><Link href="/ho-so" onClick={() => setMenuOpen(false)}><UserRound size={15} /> Hồ sơ học tập</Link></Button> : <Button className="w-full" onClick={() => startLogin()}><Sparkles size={15} /> Đăng nhập để học</Button>}</div>
        </div>
      </div> : null}
    </header>
  );
}
