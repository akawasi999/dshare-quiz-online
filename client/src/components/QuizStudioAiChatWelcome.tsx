import { ChevronRight, PencilLine, Plus, Search } from "lucide-react";

export function AiChatWelcome({ questionCount, onAction, onOpenPromptLibrary }: { questionCount: number; onAction: (prompt: string) => void; onOpenPromptLibrary: () => void }) {
  const actions = [
    { label: "Xem lại tất cả các câu hỏi", prompt: `Hãy xem lại tất cả ${questionCount} câu hỏi hiện có và đề xuất các điểm cần cải thiện.`, icon: Search },
    { label: "Chỉnh sửa câu hỏi và phương án trả lời trau chuốt hơn", prompt: "Hãy chỉnh sửa các câu hỏi và phương án trả lời để rõ ràng, chính xác và trau chuốt hơn.", icon: PencilLine },
    { label: "Thêm câu hỏi", prompt: "Tôi muốn thêm câu hỏi mới cho Quiz này.", icon: Plus },
  ];

  return <section data-testid="ai-chat-welcome" className="flex min-h-0 flex-1 flex-col justify-start overflow-y-auto bg-[#fcfcfe] px-6 py-6"><div className="mx-auto w-full max-w-[620px]"><p className="text-lg font-bold text-[#172554]">Chào bạn <span aria-hidden="true">👋</span></p><p className="mt-2 text-sm font-semibold leading-6 text-[#25324d]">{questionCount ? `Bài quiz đã có ${questionCount} câu hỏi. Xem lại câu hỏi hoặc thêm mới.` : "Quiz đang trống. Hãy tạo câu hỏi mới cùng tôi."}</p><p className="mt-2 text-sm leading-6 text-[#4f5f77]">Hãy chọn một yêu cầu được đề xuất dưới đây hoặc nhập nội dung bạn cần.</p><div className="mt-6 flex flex-col items-end gap-2">{actions.map(({ label, prompt, icon: Icon }) => <button key={label} type="button" onClick={() => onAction(prompt)} className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-[#172554]/8 bg-white px-4 py-3 text-left text-sm font-semibold text-[#25324d] shadow-sm transition hover:-translate-y-0.5 hover:border-[#7057e8]/35 hover:bg-[#faf9ff]"><Icon size={17} className={label === "Thêm câu hỏi" ? "text-[#7057e8]" : "text-[#2563eb]"} /><span className="min-w-0 flex-1">{label}</span><ChevronRight size={17} className="shrink-0 text-[#71838d]" /></button>)}</div><button type="button" onClick={onOpenPromptLibrary} className="mt-4 text-xs font-semibold text-[#7057e8] transition hover:text-[#5d47cc]">Chọn mẫu theo môn học và cấp độ</button></div></section>;
}
