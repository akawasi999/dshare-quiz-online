import { Button } from "@/components/ui/button";
import { ExternalLink, Globe2, History, RotateCcw, Youtube } from "lucide-react";

export type SourceHistoryItem = {
  id: number;
  sourceUrl: string;
  sourceName: string;
  sourceType: "youtube" | "web";
  sourceCharacterCount: number;
  lastQuestionCount: number;
  lastDifficulty: "easy" | "medium" | "hard";
  useCount: number;
  lastUsedAt: Date | string;
};

export function SourceHistoryPanel({ items, busy, onReuse }: { items: SourceHistoryItem[]; busy: boolean; onReuse: (item: SourceHistoryItem) => void }) {
  if (!items.length) return null;
  return <section className="rounded-2xl border border-[#172554]/10 bg-white p-4 shadow-[0_10px_30px_rgba(20,44,91,0.04)]">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#eef4ff] text-[#065be5]"><History size={16} /></span><div><p className="text-sm font-bold text-[#172554]">Nguồn URL gần đây</p><p className="mt-0.5 text-[10px] text-[#71838d]">Chọn một nguồn đã dùng để tái tạo câu hỏi với cấu hình gần nhất.</p></div></div><span className="rounded-full bg-[#f8f9fc] px-2 py-1 text-[10px] font-bold text-[#617786]">{items.length} nguồn</span></div>
    <div className="mt-3 space-y-2">{items.map(item => { const isYoutube = item.sourceType === "youtube"; const usedAt = new Date(item.lastUsedAt); return <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-[#172554]/8 bg-[#fbfcff] p-3 sm:flex-row sm:items-center"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${isYoutube ? "bg-[#fff0f3] text-[#e43f5a]" : "bg-[#eaf8ff] text-[#1684d6]"}`}>{isYoutube ? <Youtube size={16} /> : <Globe2 size={16} />}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#172554]">{item.sourceName}</p><p className="mt-1 text-[10px] text-[#71838d]">{item.lastQuestionCount} câu · {item.lastDifficulty} · dùng {item.useCount} lần{Number.isNaN(usedAt.getTime()) ? "" : ` · ${usedAt.toLocaleDateString("vi-VN")}`}</p></div><div className="flex gap-2"><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-[#172554]/10 text-[#617786] hover:bg-white" aria-label={`Mở nguồn ${item.sourceName}`}><ExternalLink size={14} /></a><Button type="button" onClick={() => onReuse(item)} disabled={busy} className="h-8 rounded-lg bg-[#065be5] px-3 text-xs"><RotateCcw size={13} />Tái tạo</Button></div></article>; })}</div>
  </section>;
}
