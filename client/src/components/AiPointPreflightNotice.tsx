import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CircleAlert, Coins, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

type PointRule = { code: string; name: string; pointCost: number; canAfford: boolean };

export default function AiPointPreflightNotice() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const showOnPage = location.includes("/quiz/create") || location.includes("ai-assistant") || location.includes("tao-quiz");
  const pricing = trpc.learner.aiPricing.useQuery(undefined, { enabled: Boolean(user) && !loading && showOnPage, staleTime: 15_000 });
  if (!showOnPage || !pricing.data) return null;
  const costlyRules = (pricing.data.rules as PointRule[]).filter((rule: PointRule) => rule.pointCost > 0).slice(0, 3);
  const affordable = costlyRules.every((rule: PointRule) => rule.canAfford);
  return <aside aria-live="polite" className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[var(--radius-xl-token)] border border-primary/15 bg-surface/95 p-3 shadow-[0_16px_40px_rgba(23,37,84,.18)] backdrop-blur sm:p-4"><div className="flex items-start gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-[var(--radius-md-token)] ${affordable ? "bg-primary-light text-primary" : "bg-danger/10 text-danger"}`}>{affordable ? <Coins size={18} /> : <CircleAlert size={18} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-foreground">AI nâng cao dùng Point</p><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-foreground">Ví: {pricing.data.balance.toLocaleString("vi-VN")} Point</span></div><p className={`mt-1 text-[11px] leading-4 ${affordable ? "text-text-secondary" : "font-semibold text-danger"}`}>{affordable ? "Mức Point được hiển thị trước khi gửi yêu cầu; nếu AI lỗi, Point sẽ tự hoàn." : "Số dư hiện tại chưa đủ cho một số thao tác AI. Hãy nạp Point trước khi tiếp tục."}</p>{costlyRules.length ? <div className="mt-2 flex flex-wrap gap-1.5">{costlyRules.map((rule: PointRule) => <span key={rule.code} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${rule.canAfford ? "bg-primary-light text-primary" : "bg-danger/10 text-danger"}`}><Sparkles size={11} />{rule.name}: {rule.pointCost.toLocaleString("vi-VN")}</span>)}</div> : <p className="mt-2 text-[10px] font-semibold text-success">Chưa có thao tác AI trả phí được bật.</p>}</div></div></aside>;
}
