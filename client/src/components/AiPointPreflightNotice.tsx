import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ROUTES } from "@/lib/routes";
import { CheckCircle2, CircleAlert, Coins, Sparkles } from "lucide-react";

type PointRule = { code: string; name: string; pointCost: number; canAfford: boolean };

export default function AiPointPreflightNotice({
  onApply,
  showApplyAction = true,
}: {
  onApply?: () => void;
  showApplyAction?: boolean;
}) {
  const { user, loading } = useAuth();
  const pricing = trpc.learner.aiPricing.useQuery(undefined, {
    enabled: Boolean(user) && !loading,
    staleTime: 15_000,
  });
  const rules = (pricing.data?.rules as PointRule[] | undefined)
    ?.filter(rule => rule.pointCost > 0)
    .slice(0, 3) ?? [];
  const affordable = rules.every(rule => rule.canAfford);
  const balance = pricing.data?.balance;
  const columns = showApplyAction
    ? "lg:grid-cols-[minmax(170px,.8fr)_minmax(250px,1.35fr)_minmax(190px,.85fr)_minmax(190px,.85fr)]"
    : "lg:grid-cols-[minmax(170px,.8fr)_minmax(250px,1.35fr)_minmax(190px,.85fr)]";

  return <footer data-testid="quiz-ai-point-footer" className="mt-7 shrink-0 rounded-2xl border border-[#172554]/10 bg-white p-4 shadow-[0_12px_30px_rgba(20,44,91,.05)] sm:p-5">
    <div className={`grid gap-5 lg:items-start ${columns}`}>
      <section className="min-w-0 border-b border-[#172554]/8 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#71838d]">Liên kết</p>
        <nav aria-label="Liên kết pháp lý" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <a href={ROUTES.terms} className="text-xs font-semibold text-[#065be5] hover:underline">Điều khoản</a>
          <a href={ROUTES.support} className="text-xs font-semibold text-[#065be5] hover:underline">Liên hệ</a>
          <a href={ROUTES.privacy} className="text-xs font-semibold text-[#065be5] hover:underline">Bảo mật</a>
        </nav>
      </section>
      <section className="min-w-0 border-b border-[#172554]/8 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#71838d]">AI nâng cao</p>
          <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${affordable ? "bg-[#effaf5] text-[#007453]" : "bg-[#fff1f6] text-[#de1264]"}`}>{affordable ? "Đủ Point" : "Cần nạp Point"}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#617786]">Chi phí hiển thị trước khi dùng; Point sẽ được hoàn khi tác vụ AI lỗi.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {pricing.isLoading ? <span className="text-xs text-[#71838d]">Đang tải gói AI…</span> : rules.length ? rules.map(rule => <span key={rule.code} className={`inline-flex max-w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${rule.canAfford ? "bg-[#eef4ff] text-[#065be5]" : "bg-[#fff1f6] text-[#de1264]"}`}><Sparkles size={11} />{rule.name}: {rule.pointCost.toLocaleString("vi-VN")} Point</span>) : <span className="text-xs text-[#71838d]">Chưa có gói AI trả phí được bật.</span>}
        </div>
      </section>
      <section className={`min-w-0 ${showApplyAction ? "border-b border-[#172554]/8 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5" : "pb-0"}`}>
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#71838d]">Ví Point</p>
        <div className="mt-3 flex items-center gap-2">
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${affordable ? "bg-[#eef4ff] text-[#065be5]" : "bg-[#fff1f6] text-[#de1264]"}`}>{affordable ? <Coins size={18} /> : <CircleAlert size={18} />}</span>
          <div><p className="text-sm font-black text-[#172554]">{balance === undefined ? "—" : balance.toLocaleString("vi-VN")} Point</p><a href={ROUTES.billing} className="mt-0.5 inline-block text-[11px] font-bold text-[#065be5] hover:underline">Nạp Point</a></div>
        </div>
      </section>
      {showApplyAction ? <section className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#71838d]">Áp dụng vào trò chơi</p>
        <p className="mt-2 text-xs leading-5 text-[#617786]">Bật cấu hình AI hỗ trợ trong Quiz đang soạn.</p>
        <button type="button" onClick={onApply} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#065be5] px-3 text-xs font-bold text-white transition hover:bg-[#054fc5]"><CheckCircle2 size={15} />Áp dụng vào trò chơi</button>
      </section> : null}
    </div>
  </footer>;
}
