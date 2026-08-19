import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const defaults = { primary: "#065BE5", accent: "#3762D2", success: "#007453", attention: "#DE1264", page: "#EBF4FF", surface: "#FFFFFF" };
type BrandKey = keyof typeof defaults;
type BrandColors = Record<BrandKey, string>;

export default function BrandSettingsPanel() {
  const query = trpc.branding.get.useQuery();
  const saveMutation = trpc.branding.save.useMutation({ onSuccess: () => { query.refetch(); toast.success("Đã đồng bộ nhận diện trên mọi thiết bị."); } });
  const [colors, setColors] = useState<BrandColors>(defaults);
  useEffect(() => { if (query.data) setColors({ primary: query.data.primaryColor, accent: query.data.accentColor, success: query.data.successColor, attention: query.data.attentionColor, page: query.data.pageColor, surface: query.data.surfaceColor }); }, [query.data]);
  const save = () => saveMutation.mutate({ primaryColor: colors.primary, accentColor: colors.accent, successColor: colors.success, attentionColor: colors.attention, pageColor: colors.page, surfaceColor: colors.surface });
  return <section className="mx-auto max-w-6xl rounded-[28px] border border-[#172554]/10 bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3762d2]">Thiết lập nhận diện</p><h1 className="mt-2 font-serif text-3xl font-semibold text-[#141432]">Tùy chỉnh hệ màu Dshare</h1><p className="mt-2 text-sm text-[#6c6c7a]">Cấu hình được lưu dùng chung cho mọi thiết bị quản trị.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(Object.keys(colors) as BrandKey[]).map(key => <label key={key} className="rounded-2xl bg-[#f0f1ff] p-4 text-xs font-bold text-[#141432]"><span className="capitalize">{key}</span><div className="mt-3 flex gap-2"><span className="h-10 w-10 rounded-xl border border-black/10" style={{ backgroundColor: colors[key] }} /><Input value={colors[key]} onChange={event => setColors(current => ({ ...current, [key]: event.target.value }))} aria-label={`Màu ${key}`} /></div></label>)}</div><div className="mt-6 flex gap-3"><Button onClick={save} disabled={saveMutation.isPending} className="cta-gradient rounded-full">{saveMutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}</Button><Button variant="outline" onClick={() => setColors(defaults)} className="rounded-full">Khôi phục mặc định</Button></div></section>;
}
