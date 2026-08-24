import { useAuth } from "@/_core/hooks/useAuth";
import { useAuthGate } from "@/contexts/AuthGateContext";
import { TRPCClientError } from "@trpc/client";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";

export type RouteAccess = "authenticated" | "admin";

export default function RouteAccessGuard({ access, children }: { access: RouteAccess; children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, loading, error } = useAuth();
  const { openAuth } = useAuthGate();
  const accessError = error instanceof TRPCClientError && error.data?.code === "FORBIDDEN" ? error.message : null;
  useEffect(() => { if (!loading && !user && !accessError) openAuth({ mode: "login", returnTo: location }); }, [accessError, loading, location, openAuth, user]);
  if (loading) return <main className="grid min-h-[60dvh] place-items-center bg-background p-6"><p className="text-sm font-medium text-text-secondary">Đang kiểm tra quyền truy cập…</p></main>;
  if (accessError) return <main className="grid min-h-[60dvh] place-items-center bg-background p-6"><section className="max-w-md rounded-2xl border border-danger/30 bg-surface p-7 text-center shadow-[var(--shadow-md)]"><ShieldAlert className="mx-auto text-danger" size={30} /><h1 className="mt-4 text-xl font-bold text-foreground">Tài khoản chưa thể truy cập</h1><p className="mt-2 text-sm leading-6 text-text-secondary">{accessError}</p><button type="button" onClick={() => setLocation("/support")} className="mt-5 rounded-lg border border-border px-4 py-2 text-sm font-bold text-foreground">Liên hệ hỗ trợ</button></section></main>;
  if (!user) return <main className="grid min-h-[60dvh] place-items-center bg-background p-6"><section className="max-w-md rounded-2xl border border-border bg-surface p-7 text-center shadow-[var(--shadow-md)]"><LockKeyhole className="mx-auto text-primary" size={30} /><h1 className="mt-4 text-xl font-bold text-foreground">Đăng nhập để tiếp tục</h1><p className="mt-2 text-sm leading-6 text-text-secondary">Khu vực này cần tài khoản Dshare. Đăng nhập để quay lại đúng chức năng bạn vừa chọn.</p><div className="mt-5 flex justify-center gap-3"><button type="button" onClick={() => openAuth({ mode: "login", returnTo: location })} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Đăng nhập</button><button type="button" onClick={() => setLocation("/")} className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-foreground">Về trang chủ</button></div></section></main>;
  if (access === "admin" && user.role !== "admin") return <main className="grid min-h-[60dvh] place-items-center bg-background p-6"><section className="max-w-md rounded-2xl border border-border bg-surface p-7 text-center shadow-[var(--shadow-md)]"><ShieldAlert className="mx-auto text-danger" size={30} /><h1 className="mt-4 text-xl font-bold text-foreground">Không có quyền truy cập</h1><p className="mt-2 text-sm leading-6 text-text-secondary">Tài khoản của bạn không có quyền sử dụng khu vực quản trị.</p><button type="button" onClick={() => setLocation("/")} className="mt-5 rounded-lg border border-border px-4 py-2 text-sm font-bold text-foreground">Về trang chủ</button></section></main>;
  return <>{children}</>;
}
