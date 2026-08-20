import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, Settings2 } from "lucide-react";
import { useState } from "react";

export function QuizSettingsDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><div className="flex justify-center"><div role="tablist" aria-label="Khu vực Studio Quiz" className="inline-flex rounded-xl bg-[#f1f3f8] p-1 shadow-inner"><button type="button" role="tab" aria-selected={!open} className="inline-flex min-w-36 items-center justify-center gap-2 rounded-[10px] bg-white px-5 py-2.5 text-xs font-bold text-[#172554] shadow-[0_2px_8px_rgba(20,44,91,.12)]"><FileText size={15} />Câu hỏi</button><button type="button" role="tab" aria-selected={open} onClick={() => setOpen(true)} className={`inline-flex min-w-36 items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-xs font-bold transition ${open ? "bg-white text-[#172554] shadow-[0_2px_8px_rgba(20,44,91,.12)]" : "text-[#8a95a5] hover:text-[#065be5]"}`}><Settings2 size={15} />Cài đặt</button></div></div><Sheet open={open} onOpenChange={setOpen}><SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl"><SheetHeader className="sticky top-0 z-10 border-b border-[#172554]/10 bg-white px-5 py-4 text-left"><SheetTitle className="flex items-center gap-2 text-[#172554]"><Settings2 size={18} className="text-[#065be5]" />Cài đặt Quiz</SheetTitle></SheetHeader><div className="space-y-4 p-5">{children}</div></SheetContent></Sheet></>;
}
