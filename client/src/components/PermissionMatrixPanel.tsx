import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Check, Crown, Info, Layers3, Loader2, LockKeyhole, Save, Sparkles, UsersRound, X } from "lucide-react";
import { toast } from "sonner";

const categoryCopy: Record<string, { label: string; icon: typeof Sparkles }> = {
  quiz_ai: { label: "Quiz AI", icon: Sparkles },
  advanced: { label: "Tính năng cao cấp", icon: Crown },
  reports: { label: "Báo cáo tiến độ", icon: Layers3 },
};

const planTone = (tier: string) => tier === "premium" ? { header: "bg-[#6d4ce6]", check: "text-[#6d4ce6]", icon: Crown } : tier === "pro" ? { header: "bg-[#087f83]", check: "text-[#087f83]", icon: Sparkles } : { header: "bg-[#5c6b7a]", check: "text-[#9aa6b2]", icon: UsersRound };

export default function PermissionMatrixPanel() {
  const matrix = trpc.admin.permissionMatrix.useQuery();
  const utils = trpc.useUtils();
  const save = trpc.admin.savePlanPermission.useMutation({
    onSuccess: async () => { await utils.admin.permissionMatrix.invalidate(); toast.success("Đã cập nhật Permission Matrix."); },
    onError: error => toast.error("Không thể cập nhật quyền", { description: error.message }),
  });
  if (matrix.isLoading) return <div className="rounded-[28px] border border-border bg-card p-8 text-sm text-text-secondary"><Loader2 className="mr-2 inline animate-spin" size={16} />Đang tải Permission Matrix…</div>;
  if (matrix.error || !matrix.data) return <div role="alert" className="rounded-[28px] border border-danger/15 bg-danger/5 p-8 text-sm text-danger">Không thể tải Permission Matrix: {matrix.error?.message ?? "Dữ liệu không sẵn sàng."}</div>;
  const { plans, permissions, matrix: rows } = matrix.data;
  const categories = Array.from(new Set(permissions.map(item => item.category)));
  const entry = (planId: number, permissionId: number) => rows.find(row => row.planId === planId && row.permissionId === permissionId);
  const update = (planId: number, permissionId: number, next: { isEnabled: boolean; limitValue: number | null; limitUnit: string | null }) => save.mutate({ planId, permissionId, ...next, config: null });
  return <section className="mx-auto max-w-7xl rounded-[28px] border border-border bg-card shadow-[0_18px_45px_rgba(23,37,84,.07)]">
    <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex items-center gap-2 text-primary"><LockKeyhole size={17} /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Permission & Feature Access</span></div><h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">Permission Matrix</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-text-secondary">Registry và ma trận gói là nguồn cấu hình trung tâm. Thay đổi được áp dụng ở máy chủ, không cần deploy lại giao diện.</p></div>
      <span className="inline-flex items-center gap-2 self-start rounded-full bg-success/10 px-3 py-2 text-[11px] font-bold text-success"><Check size={14} />{permissions.length} quyền · {plans.length} gói</span>
    </header>
    <div className="overflow-x-auto"><div className="min-w-[860px] p-4 sm:p-5">
      <div className="grid grid-cols-[minmax(300px,1.5fr)_repeat(3,minmax(170px,1fr))] overflow-hidden rounded-2xl border border-border">
        <div className="bg-muted px-5 py-4 text-[10px] font-bold uppercase tracking-[.14em] text-text-muted">Tính năng & mô tả</div>
        {plans.map(plan => { const tone = planTone(plan.tier); const Icon = tone.icon; return <div key={plan.id} className={`${tone.header} px-4 py-4 text-white`}><div className="flex items-center gap-2"><Icon size={16} /><span className="text-sm font-black">{plan.name}</span></div><p className="mt-1 text-[10px] font-semibold text-white/75">{plan.code}</p></div>; })}
        {categories.map(category => { const copy = categoryCopy[category] ?? { label: category, icon: Layers3 }; const CategoryIcon = copy.icon; return <div key={category} className="contents"><div className="col-span-4 flex items-center gap-2 border-y border-border bg-[#f7faff] px-5 py-3"><CategoryIcon size={15} className="text-primary" /><span className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{copy.label}</span></div>{permissions.filter(permission => permission.category === category).map(permission => <div key={permission.id} className="contents"><div className="border-b border-border px-5 py-4"><div className="flex items-center gap-2"><p className="text-xs font-bold text-foreground">{permission.name}</p><span title={permission.description ?? "Chưa có mô tả"}><Info size={13} className="text-text-muted" /></span></div><p className="mt-1 font-mono text-[10px] text-primary">{permission.key}</p><p className="mt-1 text-[10px] leading-4 text-text-secondary">{permission.description ?? "Chưa có mô tả."}</p></div>{plans.map(plan => { const value = entry(plan.id, permission.id); const enabled = value?.isEnabled ?? false; const limit = value?.limitValue ?? null; const tone = planTone(plan.tier); return <div key={plan.id} className="flex min-h-[112px] flex-col justify-center gap-2 border-b border-l border-border px-4 py-3"><div className="flex items-center justify-between gap-2"><span className={`inline-flex items-center gap-1 text-xs font-bold ${enabled ? tone.check : "text-text-muted"}`}>{enabled ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}{enabled ? "Đã bật" : "Đã khóa"}</span><Switch checked={enabled} disabled={save.isPending} onCheckedChange={checked => update(plan.id, permission.id, { isEnabled: checked, limitValue: limit, limitUnit: value?.limitUnit ?? null })} aria-label={`Bật ${permission.name} cho ${plan.name}`} /></div>{permission.type !== "boolean" ? <div className="flex items-center gap-2"><Input aria-label={`Giới hạn ${permission.name} cho ${plan.name}`} type="number" min="0" value={limit ?? ""} onChange={event => update(plan.id, permission.id, { isEnabled: enabled, limitValue: event.target.value === "" ? null : Number(event.target.value), limitUnit: value?.limitUnit ?? "items" })} className="h-8 w-20 text-xs" placeholder="—" /><span className="text-[10px] text-text-muted">{value?.limitUnit ?? "đơn vị"}</span></div> : null}</div>; })}</div>)}</div>; })}
      </div>
    </div></div>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-4"><p className="text-[11px] text-text-secondary">Quyền Boolean bật/tắt; quyền Limit/Quota có thể đặt giới hạn ngay trong ma trận. Tooltip lấy từ Permission Registry.</p><Button size="sm" variant="outline" onClick={() => matrix.refetch()}><Save size={14} />Làm mới dữ liệu</Button></footer>
  </section>;
}
