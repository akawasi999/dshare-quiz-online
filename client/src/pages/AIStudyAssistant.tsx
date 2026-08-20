import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AIStudyAssistant() {
  const config = trpc.aiAssistant.config.useQuery();
  const history = trpc.aiAssistant.history.useQuery();
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const chat = trpc.aiAssistant.chat.useMutation({ onSuccess: () => { setPendingMessage(null); history.refetch(); }, onError: error => { setPendingMessage(null); toast.error("AI Assistant chưa thể phản hồi", { description: error.message }); } });
  const clear = trpc.aiAssistant.clearHistory.useMutation({ onSuccess: () => { history.refetch(); toast.success("Đã xóa lịch sử hội thoại."); }, onError: error => toast.error("Không thể xóa lịch sử", { description: error.message }) });
  const messages: Message[] = [...(history.data ?? []).map(item => ({ role: item.role, content: item.content } as Message)), ...(pendingMessage ? [{ role: "user" as const, content: pendingMessage }] : [])];
  if (config.isLoading) return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="animate-spin text-[#065be5]" /></div>;
  return <main className="mx-auto max-w-5xl"><div className="rounded-[28px] bg-[#172554] p-6 text-white sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#f4c352]"><Bot size={24} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#bfdbfe]">Dshare / Trợ lý học tập</p><h1 className="mt-2 font-serif text-3xl font-semibold">AI Assistant</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#dbeafe]">{config.data?.welcomeMessage}</p></div></div><Button variant="outline" onClick={() => clear.mutate()} disabled={clear.isPending || !(history.data?.length)} className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"><RotateCcw size={15} />Xóa hội thoại</Button></div></div>{config.data?.isEnabled ? <section className="mt-5 overflow-hidden rounded-[28px] border border-[#172554]/10 bg-white shadow-[0_16px_40px_rgba(20,44,91,.07)]"><AIChatBox messages={messages} onSendMessage={message => { setPendingMessage(message); chat.mutate({ message }); }} isLoading={chat.isPending} height="min(66vh, 680px)" placeholder="Hỏi AI Assistant về kiến thức, kế hoạch ôn tập hoặc cách làm Quiz…" emptyStateMessage="Bạn muốn bắt đầu học nội dung nào hôm nay?" suggestedPrompts={["Lập kế hoạch ôn tập 7 ngày", "Giải thích cách học bằng active recall", "Gợi ý cách xử lý một câu khó"]} className="border-0 shadow-none" /></section> : <section className="mt-5 rounded-[28px] border border-[#172554]/10 bg-white p-8 text-center"><Sparkles className="mx-auto text-[#7057e8]" size={28} /><h2 className="mt-4 font-serif text-2xl font-semibold text-[#172554]">AI Assistant đang được chuẩn bị</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#617786]">Quản trị viên chưa kích hoạt dịch vụ. Bạn có thể quay lại sau hoặc liên hệ bộ phận hỗ trợ.</p></section>}</main>;
}
