import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings2 } from "lucide-react";
import { useState } from "react";

export function QuizSettingsDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-full justify-between rounded-2xl border-[#172554]/10 bg-white px-4 py-5 text-left text-xs font-bold text-[#172554] shadow-[0_10px_30px_rgba(20,44,91,0.04)]"><span className="flex items-center gap-2"><Settings2 size={15} className="text-[#065be5]" />Cài đặt Quiz</span><span className="text-[#065be5]">Mở</span></Button><Sheet open={open} onOpenChange={setOpen}><SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl"><SheetHeader className="sticky top-0 z-10 border-b border-[#172554]/10 bg-white px-5 py-4 text-left"><SheetTitle className="flex items-center gap-2 text-[#172554]"><Settings2 size={18} className="text-[#065be5]" />Cài đặt Quiz</SheetTitle></SheetHeader><div className="space-y-4 p-5">{children}</div></SheetContent></Sheet></>;
}
