import { FileText, Settings2 } from "lucide-react";

export function QuizStudioTabs({ active, onChange }: { active: "questions" | "settings"; onChange: (value: "questions" | "settings") => void }) {
  return <div role="tablist" aria-label="Khu vực Studio Quiz" className="inline-flex rounded-xl bg-[#eef0f5] p-1 shadow-inner"><button type="button" role="tab" aria-selected={active === "questions"} onClick={() => onChange("questions")} className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-xs font-bold transition ${active === "questions" ? "bg-white text-[#172554] shadow-[0_2px_8px_rgba(20,44,91,.12)]" : "text-[#8a95a5] hover:text-[#065be5]"}`}><FileText size={15} />Câu hỏi</button><button type="button" role="tab" aria-selected={active === "settings"} onClick={() => onChange("settings")} className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-xs font-bold transition ${active === "settings" ? "bg-white text-[#172554] shadow-[0_2px_8px_rgba(20,44,91,.12)]" : "text-[#8a95a5] hover:text-[#065be5]"}`}><Settings2 size={15} />Cài đặt</button></div>;
}

export function QuizSettingsDrawer({ active, children }: { active: "questions" | "settings"; children: React.ReactNode }) {
  return active === "settings" ? <div className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-5 p-5 duration-200"><header className="border-b border-[#172554]/10 pb-4"><h2 className="flex items-center gap-2 text-base font-bold text-[#172554]"><Settings2 size={18} className="text-[#065be5]" />Cài đặt Quiz</h2><p className="mt-1 text-xs leading-5 text-[#71838d]">Thiết lập chủ đề, ảnh bìa, thời lượng và bảo mật trước khi lưu Quiz.</p></header>{children}</div> : null;
}
