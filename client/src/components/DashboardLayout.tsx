import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, ArrowDownToLine, BookOpenCheck, Bot, ChartNoAxesCombined, ChevronRight, CircleDollarSign, CircleHelp, Command, FileWarning, LayoutDashboard, LogOut, Moon, Palette, PanelLeft, Search, ScrollText, Shuffle, Sun, Users, UsersRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import BrandLogo from "./BrandLogo";
import { Button } from "./ui/button";

type NavigationItem = { icon: typeof LayoutDashboard; label: string; path: string; aliases?: string[]; description: string };
type NavigationSection = { label: string; items: NavigationItem[] };

const navigationSections: NavigationSection[] = [
  { label: "Tổng quan", items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/quan-tri", aliases: ["/admin", "/admin/dashboard"], description: "Learning Control Center" }] },
  { label: "Learning", items: [
    { icon: BookOpenCheck, label: "Nội dung", path: "/quan-tri/noi-dung", aliases: ["/admin/learning/content"], description: "Chủ đề, môn học, bài học và bộ đề" },
    { icon: CircleHelp, label: "Ngân hàng câu hỏi", path: "/quan-tri/cau-hoi", aliases: ["/admin/learning/questions"], description: "Câu hỏi, đáp án và AI hỗ trợ" },
    { icon: Shuffle, label: "Tạo đề ngẫu nhiên", path: "/quan-tri/tao-de-ngau-nhien", aliases: ["/admin/learning/random-generator"], description: "Tạo bộ đề theo ma trận" },
    { icon: ArrowDownToLine, label: "Import / Export", path: "/quan-tri/import-xuat", aliases: ["/admin/learning/import-export"], description: "Trao đổi dữ liệu ngân hàng" },
  ] },
  { label: "Gamification", items: [{ icon: CircleDollarSign, label: "Point", path: "/quan-tri/point", aliases: ["/admin/gamification/points"], description: "Sổ cái và economy Point" }] },
  { label: "Users", items: [
    { icon: Users, label: "Người dùng", path: "/quan-tri/nguoi-dung", aliases: ["/admin/users"], description: "Người học và trạng thái tài khoản" },
    { icon: UsersRound, label: "Nhóm người dùng", path: "/quan-tri/nhom-nguoi-dung", aliases: ["/admin/users/groups"], description: "Nhóm, gói và quyền liên kết" },
  ] },
  { label: "Moderation", items: [{ icon: FileWarning, label: "Báo lỗi", path: "/quan-tri/bao-loi", aliases: ["/admin/moderation/errors"], description: "Hàng đợi kiểm duyệt báo lỗi" }] },
  { label: "Analytics", items: [{ icon: ChartNoAxesCombined, label: "Tổng quan", path: "/quan-tri/bao-cao", aliases: ["/admin/analytics"], description: "Phân tích học tập và Point" }] },
  { label: "System", items: [
    { icon: Activity, label: "Live Monitoring", path: "/quan-tri/live-monitoring", aliases: ["/admin/system/monitoring"], description: "Giám sát phiên và vận hành" },
    { icon: ScrollText, label: "Activity Logs", path: "/quan-tri/nhat-ky", aliases: ["/admin/system/logs"], description: "Nhật ký kiểm toán" },
    { icon: Bot, label: "AI Assistant", path: "/quan-tri/ai-assistant", aliases: ["/admin/system/ai"], description: "AI Content & Learning Copilot" },
  ] },
  { label: "Appearance", items: [{ icon: Palette, label: "Tùy chỉnh Style", path: "/quan-tri/thuong-hieu", aliases: ["/admin/appearance/theme"], description: "Nhận diện và Design System" }] },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 240;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md text-center"><h1 className="text-2xl font-semibold text-foreground">Đăng nhập để tiếp tục</h1><p className="mt-3 text-sm leading-6 text-text-secondary">Khu quản trị yêu cầu phiên đăng nhập hợp lệ.</p><Button onClick={() => startLogin()} className="mt-6">Đăng nhập</Button></div></div>;

  return <div className="cpanel-v2 min-h-screen"><SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider></div>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isCollapsed = state === "collapsed";
  const activeItem = navigationSections.flatMap(section => section.items).find(item => location === item.path || item.aliases?.includes(location));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(open => !open); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - sidebarLeft;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none";
    }
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [isResizing, setSidebarWidth]);

  const navigate = (item: NavigationItem) => { setLocation(item.path); setCommandOpen(false); };
  return <>
    <div ref={sidebarRef} className="relative">
      <Sidebar collapsible="icon" className="border-r border-border bg-surface" disableTransition={isResizing}>
        <SidebarHeader className="h-[76px] border-b border-border px-3">
          <div className="flex h-full items-center gap-3"><button type="button" onClick={toggleSidebar} aria-label={isCollapsed ? "Mở rộng điều hướng" : "Thu gọn điều hướng"} className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md-token)] text-text-secondary transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"><PanelLeft size={18} /></button>{!isCollapsed ? <div className="min-w-0"><BrandLogo className="h-7 max-w-[144px]" /><p className="mt-1 text-[9px] font-bold uppercase tracking-[.15em] text-text-muted">Admin Control Center</p></div> : null}</div>
        </SidebarHeader>
        <SidebarContent className="gap-0 py-3">
          {navigationSections.map(section => <div key={section.label} className="mb-3"><p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-text-muted group-data-[collapsible=icon]:hidden">{section.label}</p><SidebarMenu className="px-2">{section.items.map(item => { const isActive = location === item.path || item.aliases?.includes(location); return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} onClick={() => navigate(item)} tooltip={item.label} className={`relative h-10 rounded-[var(--radius-sm-token)] text-[13px] font-medium transition-colors before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-primary ${isActive ? "bg-primary-light text-primary before:block" : "text-text-secondary hover:bg-muted hover:text-foreground before:hidden"}`}><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></div>)}
        </SidebarContent>
        <SidebarFooter className="border-t border-border p-3"><AdminMenu userName={user?.name} email={user?.email} onLogout={logout} collapsed={isCollapsed} /></SidebarFooter>
      </Sidebar>
      <div className={`absolute bottom-0 right-0 top-0 z-50 w-1 cursor-col-resize transition-colors hover:bg-primary/20 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} />
    </div>

    <SidebarInset className="bg-background">
      <header className="sticky top-0 z-30 hidden h-[76px] items-center gap-4 border-b border-border bg-surface/95 px-6 backdrop-blur md:flex"><SidebarTrigger className="size-9 rounded-[var(--radius-md-token)] text-text-secondary hover:bg-muted hover:text-primary" /><div className="flex min-w-0 items-center gap-2 text-sm"><span className="text-text-muted">CPanel</span><ChevronRight size={14} className="text-text-muted" /><span className="truncate font-semibold text-foreground">{activeItem?.label ?? "Dashboard"}</span></div><button type="button" onClick={() => setCommandOpen(true)} className="ml-auto flex h-10 w-full max-w-md items-center gap-3 rounded-[var(--radius-md-token)] border border-border bg-background px-3 text-left text-sm text-text-secondary transition-colors hover:border-primary/35 hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"><Search size={16} /><span className="flex-1">Tìm nhanh trang quản trị…</span><kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-muted lg:inline-flex">Ctrl K</kbd></button><button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"} className="grid size-10 place-items-center rounded-[var(--radius-md-token)] text-text-secondary transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><AdminMenu userName={user?.name} email={user?.email} onLogout={logout} compact /></header>
      {isMobile ? <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-3 backdrop-blur md:hidden"><div className="flex min-w-0 items-center gap-2"><SidebarTrigger className="size-9 rounded-[var(--radius-md-token)]" /><span className="truncate text-sm font-semibold text-foreground">{activeItem?.label ?? "Dashboard"}</span></div><div className="flex items-center gap-1"><button type="button" onClick={() => setCommandOpen(true)} aria-label="Tìm nhanh trang quản trị" className="grid size-9 place-items-center rounded-[var(--radius-md-token)] text-text-secondary hover:bg-muted"><Search size={17} /></button><button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"} className="grid size-9 place-items-center rounded-[var(--radius-md-token)] text-text-secondary hover:bg-muted">{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button></div></header> : null}
      <main className="min-h-[calc(100vh-76px)] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </SidebarInset>
    <CPanelCommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={navigate} />
  </>;
}

function CPanelCommandPalette({ open, onOpenChange, onNavigate }: { open: boolean; onOpenChange: (open: boolean) => void; onNavigate: (item: NavigationItem) => void }) {
  return <CommandDialog open={open} onOpenChange={onOpenChange} title="Tìm nhanh CPanel" description="Đi tới mô-đun quản trị" className="max-w-xl"><CommandInput placeholder="Tìm dashboard, người dùng, Point, báo lỗi…" /><CommandList><CommandEmpty>Không tìm thấy mô-đun phù hợp.</CommandEmpty>{navigationSections.map(section => <CommandGroup key={section.label} heading={section.label}>{section.items.map(item => <CommandItem key={item.path} value={`${item.label} ${item.description} ${section.label}`} onSelect={() => onNavigate(item)}><item.icon size={16} /><span>{item.label}</span><CommandShortcut>{section.label}</CommandShortcut></CommandItem>)}</CommandGroup>)}</CommandList></CommandDialog>;
}

function AdminMenu({ userName, email, onLogout, collapsed = false, compact = false }: { userName?: string | null; email?: string | null; onLogout: () => void; collapsed?: boolean; compact?: boolean }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className={`flex items-center gap-3 rounded-[var(--radius-md-token)] text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${compact ? "size-10 justify-center" : "w-full p-1.5"}`} aria-label="Mở menu tài khoản quản trị"><Avatar className="size-8 shrink-0 border border-border"><AvatarFallback className="bg-primary-light text-xs font-bold text-primary">{userName?.charAt(0).toUpperCase() ?? "A"}</AvatarFallback></Avatar>{!compact && !collapsed ? <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{userName || "Quản trị viên"}</p><p className="mt-0.5 truncate text-[10px] text-text-secondary">{email || "Admin Control Center"}</p></div> : null}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={onLogout} className="cursor-pointer text-danger focus:text-danger"><LogOut className="mr-2 size-4" />Đăng xuất</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
