import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Award, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

export default function GamificationCelebrationPopups() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const celebrations = trpc.learner.celebrations.useQuery(undefined, { enabled: Boolean(user) && !loading, refetchInterval: 1_500, refetchOnWindowFocus: true });
  const acknowledge = trpc.learner.markCelebrationsSeen.useMutation({ onSuccess: () => utils.learner.celebrations.invalidate() });
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = celebrations.data?.find(item => item.id === activeId) ?? celebrations.data?.[0] ?? null;

  useEffect(() => { if (!active && celebrations.data?.length) setActiveId(celebrations.data[0].id); }, [active, celebrations.data]);
  const close = () => {
    if (!active || acknowledge.isPending) return;
    const currentId = active.id;
    setActiveId(null);
    acknowledge.mutate({ ids: [currentId] });
  };

  const isLevel = active?.type === "level_up";
  return <Dialog open={Boolean(active)} onOpenChange={open => { if (!open) close(); }}>
    <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-md" aria-describedby="celebration-description">
      <div className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,.42),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(196,181,253,.45),transparent_30%),linear-gradient(135deg,#1d4ed8_0%,#7c3aed_100%)] px-6 py-8 text-center text-white shadow-2xl sm:px-9">
        <Sparkles aria-hidden="true" className="absolute left-5 top-5 text-yellow-200" size={20} />
        <Sparkles aria-hidden="true" className="absolute bottom-9 right-6 text-violet-200" size={16} />
        <div className="mx-auto grid size-20 place-items-center rounded-[26px] border border-white/25 bg-white/15 shadow-[0_14px_30px_rgba(0,0,0,.2)]">
          {isLevel ? <Trophy size={39} className="text-yellow-200" /> : <Award size={39} className="text-yellow-200" />}
        </div>
        <DialogHeader className="mt-6 items-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/70">{isLevel ? "Cột mốc mới" : "Bộ sưu tập thành tích"}</p>
          <DialogTitle className="mt-2 text-2xl font-black tracking-[-.04em] text-white">{active?.title}</DialogTitle>
          <DialogDescription id="celebration-description" className="mt-2 max-w-sm text-sm leading-6 text-white/82">{active?.body}</DialogDescription>
        </DialogHeader>
        {active?.xpAmount ? <p className="mx-auto mt-5 w-fit rounded-full border border-yellow-200/25 bg-yellow-200/15 px-4 py-2 text-sm font-extrabold text-yellow-100">+{active.xpAmount.toLocaleString("vi-VN")} XP</p> : null}
        <Button type="button" onClick={close} disabled={acknowledge.isPending} className="mt-7 w-full rounded-full bg-white text-primary hover:bg-white/90">Tiếp tục hành trình</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
