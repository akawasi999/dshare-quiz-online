import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Crown, LockKeyhole, Save, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const tiers = {
  basic: { label: "Basic", description: "Nhóm thành viên miễn phí", accent: "#617786", icon: UsersRound },
  pro: { label: "PRO", description: "Nhóm thành viên nâng cao", accent: "#065BE5", icon: Sparkles },
  premium: { label: "PREMIUM", description: "Nhóm thành viên đầy đủ", accent: "#007453", icon: Crown },
} as const;

const permissions = [
  { key: "canCreateQuiz", label: "Tạo Quiz riêng", description: "Cho phép mở công cụ tạo Quiz và lưu bộ đề cá nhân." },
  { key: "canUseAi", label: "Trợ lý AI", description: "Cho phép dùng AI giải thích và hỗ trợ học tập trong quota." },
  { key: "canExportData", label: "Xuất dữ liệu", description: "Cho phép xuất dữ liệu học tập và báo cáo cá nhân." },
  { key: "canViewAdvancedReports", label: "Báo cáo nâng cao", description: "Cho phép xem các báo cáo học tập nâng cao." },
  { key: "canReceivePrioritySupport", label: "Hỗ trợ ưu tiên", description: "Cho phép sử dụng luồng hỗ trợ ưu tiên." },
] as const;

type GroupPermission = {
  id?: number;
  tier: "basic" | "pro" | "premium";
  canCreateQuiz: boolean;
  canUseAi: boolean;
  canExportData: boolean;
  canViewAdvancedReports: boolean;
  canReceivePrioritySupport: boolean;
  memberCount: number;
};

export default function MembershipGroupPermissionsPanel() {
  const groups = trpc.admin.groupPermissions.useQuery();
  const utils = trpc.useUtils();
  const [drafts, setDrafts] = useState<Record<string, GroupPermission>>({});
  const save = trpc.admin.saveGroupPermissions.useMutation({
    onSuccess: async () => {
      await utils.admin.groupPermissions.invalidate();
      toast.success("Đã lưu quyền cho nhóm người dùng.");
    },
    onError: error => toast.error("Không thể lưu quyền nhóm", { description: error.message }),
  });

  useEffect(() => {
    if (!groups.data) return;
    setDrafts(Object.fromEntries(groups.data.map(group => [group.tier, group])));
  }, [groups.data]);

  const updatePermission = (tier: GroupPermission["tier"], key: typeof permissions[number]["key"], checked: boolean) => {
    setDrafts(current => ({ ...current, [tier]: { ...current[tier]!, [key]: checked } }));
  };

  if (groups.isLoading) return <div className="rounded-[26px] bg-white p-8 text-sm text-[#617786]">Đang tải nhóm người dùng…</div>;
  if (groups.error) return <div role="alert" className="rounded-[26px] bg-[#fff0f6] p-8 text-sm text-[#de1264]">Không thể tải cấu hình nhóm: {groups.error.message}</div>;

  return <div className="mx-auto max-w-6xl">
    <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#065be5]">Dshare / Quản trị / Nhóm người dùng</p>
    <h1 className="mt-2 font-serif text-[36px] font-semibold tracking-[-.045em] text-[#172554]">Nhóm người dùng & phân quyền</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#617786]">Mỗi học viên được xếp tự động vào nhóm Basic, PRO hoặc PREMIUM theo gói thành viên. Quyền thay đổi tại đây được kiểm tra tại máy chủ cho các luồng tạo Quiz và Trợ lý AI.</p>
    <div className="mt-7 grid gap-5 xl:grid-cols-3">{groups.data?.map(group => {
      const draft = drafts[group.tier] ?? group;
      const tier = tiers[group.tier];
      const TierIcon = tier.icon;
      return <section key={group.tier} className="overflow-hidden rounded-[26px] border border-[#172554]/9 bg-white shadow-sm"><div className="border-b border-[#172554]/8 p-5" style={{ background: `${tier.accent}0d` }}><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ backgroundColor: tier.accent }}><TierIcon size={20} /></span><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#172554]">{group.memberCount} thành viên</span></div><h2 className="mt-4 font-serif text-2xl font-semibold text-[#172554]">{tier.label}</h2><p className="mt-1 text-xs text-[#617786]">{tier.description}</p></div><div className="divide-y divide-[#172554]/8">{permissions.map(permission => <div key={permission.key} className="flex items-start gap-3 px-5 py-4"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-[#065be5]"><CheckCircle2 size={14} /></span><div className="min-w-0 flex-1"><label htmlFor={`${group.tier}-${permission.key}`} className="text-xs font-bold text-[#172554]">{permission.label}</label><p className="mt-1 text-[11px] leading-4 text-[#71838d]">{permission.description}</p></div><Switch id={`${group.tier}-${permission.key}`} checked={draft[permission.key]} onCheckedChange={checked => updatePermission(group.tier, permission.key, checked)} aria-label={`${permission.label} cho nhóm ${tier.label}`} /></div>)}</div><div className="flex items-center justify-between bg-[#fff7e6] px-5 py-4"><span className="flex items-center gap-1.5 text-[10px] font-bold text-[#617786]"><LockKeyhole size={12} /> Áp dụng ở máy chủ</span><Button size="sm" disabled={save.isPending} onClick={() => save.mutate({ tier: draft.tier, canCreateQuiz: draft.canCreateQuiz, canUseAi: draft.canUseAi, canExportData: draft.canExportData, canViewAdvancedReports: draft.canViewAdvancedReports, canReceivePrioritySupport: draft.canReceivePrioritySupport })} className="h-8 rounded-full bg-[#172554] px-3 text-[10px]"><Save size={13} /> Lưu quyền</Button></div></section>;
    })}</div>
  </div>;
}
