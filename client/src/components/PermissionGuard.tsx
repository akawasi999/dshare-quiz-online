import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { trpc } from "@/lib/trpc";
import { Crown, LockKeyhole, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function usePermission(permissionKey: string) {
  const entitlements = trpc.learner.entitlements.useQuery();
  const permission = entitlements.data?.entitlements.find(item => item.key === permissionKey);
  return { ...entitlements, permission, allowed: Boolean(permission?.enabled) };
}

export default function PermissionGuard({ permissionKey, children, fallback }: { permissionKey: string; children: ReactNode; fallback?: ReactNode }) {
  const { isLoading, permission, allowed } = usePermission(permissionKey);
  if (isLoading) return <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-xs text-text-secondary"><Loader2 size={14} className="animate-spin" />Đang kiểm tra quyền…</div>;
  if (allowed) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return <div className="rounded-2xl border border-[#6d4ce6]/20 bg-[#faf8ff] p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eee9ff] text-[#6d4ce6]"><LockKeyhole size={17} /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-foreground">Tính năng đang bị khóa</p><p className="mt-1 text-[11px] leading-5 text-text-secondary">{permission?.description ?? "Gói hiện tại chưa có quyền dùng tính năng này."}</p><a href={ROUTES.pricing} className="mt-3 inline-flex"><Button size="sm" className="h-8 rounded-lg bg-[#6d4ce6] text-xs hover:bg-[#5e3bd1]"><Crown size={14} />Nâng cấp {permission?.requiredPlan?.toUpperCase() ?? "gói"}</Button></a></div></div></div>;
}
