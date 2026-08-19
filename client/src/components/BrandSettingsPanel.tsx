import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const defaults = { primary: "#065BE5", accent: "#3762D2", success: "#007453", attention: "#DE1264", page: "#EBF4FF", surface: "#FFFFFF" };
type BrandKey = keyof typeof defaults;
type BrandColors = Record<BrandKey, string>;
const saved = () => { try { return JSON.parse(localStorage.getItem("dshare-brand-colors") ?? "{}") as Partial<BrandColors>; } catch { return {}; } };

export default function BrandSettingsPanel() {
  const [colors, setColors] = useState<BrandColors>(() => ({ ...defaults, ...saved() }));
  const save = () => { Object.entries(colors).forEach(([key, value]) => document.documentElement.style.setProperty(`--brand-${key}`, value)); localStorage.setItem("dshare-brand-colors", JSON.stringify(colors)); toast.success("Đã lưu nhận diện cho trình duyệt này."); };
  return <section className="mx-auto max-w-6xl rounded-[28px] border border-[#172554]/10 bg-white p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#3762d2]">Thiết lập nhận diện</p><h1 className="mt-2 font-serif text-3xl font-semibold text-[#141432]">Tùy chỉnh hệ màu Dshare</h1><p className="mt-2 text-sm text-[#6c6c7a]">Xem trước và lưu màu thương hiệu trên thiết bị quản trị hiện tại.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(Object.keys(colors) as BrandKey[]).map(key => <label key={key} className="rounded-2xl bg-[#f0f1ff] p-4 text-xs font-bold text-[#141432]"><span className="capitalize">{key}</span><div className="mt-3 flex gap-2"><span className="h-10 w-10 rounded-xl border border-black/10" style={{ backgroundColor: colors[key] }} /><Input value={colors[key]} onChange={event => setColors(current => ({ ...current, [key]: event.target.value }))} aria-label={`Màu ${key}`} /></div></label>)}</div><div className="mt-6 flex gap-3"><Button onClick={save} className="cta-gradient rounded-full">Lưu thay đổi</Button><Button variant="outline" onClick={() => setColors(defaults)} className="rounded-full">Khôi phục mặc định</Button></div></section>;
}
