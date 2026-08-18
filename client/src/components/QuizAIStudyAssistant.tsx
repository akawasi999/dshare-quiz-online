import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BookOpenText, Bot, Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ReviewQuestion = {
  questionId: number;
  prompt: string;
};

type Intent = "explain" | "resources";

const intentLabels: Record<Intent, string> = {
  explain: "Hãy giải thích lại cách suy luận cho câu này.",
  resources: "Hãy gợi ý hướng tự học và từ khóa tìm tài liệu cho nội dung này.",
};

export function QuizAIStudyAssistant({ question }: { question: ReviewQuestion }) {
  const assistant = trpc.ai.assist.useMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const ask = async (intent: Intent | "follow_up", content?: string) => {
    if (assistant.isPending) return;
    const userContent = content?.trim() || (intent === "follow_up" ? "Hãy làm rõ thêm nội dung câu hỏi này." : intentLabels[intent]);
    setMessages(current => [...current, { role: "user", content: userContent }]);
    try {
      const response = await assistant.mutateAsync({
        questionId: question.questionId,
        intent,
        followUp: intent === "follow_up" ? userContent : undefined,
      });
      setMessages(current => [...current, { role: "assistant", content: response.content }]);
    } catch {
      toast.error("Trợ lý AI đang bận", { description: "Vui lòng thử lại sau ít phút." });
    }
  };

  const openWithIntent = (intent: Intent) => {
    setIsOpen(true);
    if (!messages.length) void ask(intent);
  };

  return <>
    <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => openWithIntent("explain")} disabled={assistant.isPending} variant="outline" className="h-9 rounded-full text-[11px]"><Bot size={14} /> Giải thích với AI</Button><Button onClick={() => openWithIntent("resources")} disabled={assistant.isPending} variant="ghost" className="h-9 rounded-full text-[11px] text-[#7a6030]"><BookOpenText size={14} /> Gợi ý tự học</Button></div>
    {isOpen ? <div className="fixed inset-x-3 bottom-4 z-50 mx-auto w-auto max-w-[500px] overflow-hidden rounded-[24px] border border-[#d6c590] bg-[#fffdf8] shadow-2xl sm:right-5 sm:left-auto sm:mx-0 sm:w-[470px]"><div className="flex items-start justify-between gap-3 border-b border-[#17334a]/8 px-5 py-4"><div className="flex min-w-0 gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e9ddbd] text-[#735727]"><Lightbulb size={16} /></span><div><p className="text-xs font-bold text-[#25465b]">Trợ lý Dshare</p><p className="mt-0.5 line-clamp-1 text-[10px] text-[#7a888e]">Theo ngữ cảnh: {question.prompt}</p></div></div><button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-[#7c8a90] transition hover:bg-[#f2f2ed] hover:text-[#173a51]" aria-label="Đóng trợ lý AI"><X size={17} /></button></div><div className="flex gap-2 overflow-x-auto px-5 pt-4"><button type="button" onClick={() => void ask("explain")} disabled={assistant.isPending} className="shrink-0 rounded-full bg-[#f1ead7] px-3 py-1.5 text-[10px] font-bold text-[#755b25] disabled:opacity-60">Giải thích lại</button><button type="button" onClick={() => void ask("resources")} disabled={assistant.isPending} className="shrink-0 rounded-full bg-[#edf1eb] px-3 py-1.5 text-[10px] font-bold text-[#527154] disabled:opacity-60">Gợi ý tự học</button></div><AIChatBox messages={messages} onSendMessage={content => void ask("follow_up", content)} isLoading={assistant.isPending} placeholder="Hỏi thêm về cách suy luận…" height={350} emptyStateMessage="Đang chuẩn bị ngữ cảnh câu hỏi…" suggestedPrompts={["Tóm tắt cách suy luận.", "Tôi dễ nhầm ở bước nào?"]} className="border-0 shadow-none" /></div> : null}
  </>;
}
