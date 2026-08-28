import { Crown, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type MembershipTier = "basic" | "pro" | "premium";

const tierPresentation: Record<MembershipTier, { label: string; className: string; icon: typeof ShieldCheck }> = {
  basic: { label: "Basic", className: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200", icon: ShieldCheck },
  pro: { label: "Pro", className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700/60 dark:bg-sky-950/60 dark:text-sky-200", icon: Sparkles },
  premium: { label: "Premium", className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-950/50 dark:text-amber-200", icon: Crown },
};

export function normalizeMembershipTier(tier?: string | null): MembershipTier {
  return tier === "pro" || tier === "premium" ? tier : "basic";
}

export function SubscriptionPlanBadge({ tier, className }: { tier?: string | null; className?: string }) {
  const normalizedTier = normalizeMembershipTier(tier);
  const presentation = tierPresentation[normalizedTier];
  const Icon = presentation.icon;

  return <span aria-label={`Gói đăng ký ${presentation.label}`} data-testid="subscription-plan-badge" className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.08em] leading-none", presentation.className, className)}><Icon aria-hidden="true" size={10} strokeWidth={2.4} />{presentation.label}</span>;
}

export function UsernameWithPlan({ name, tier, className, nameClassName }: { name: string; tier?: string | null; className?: string; nameClassName?: string }) {
  return <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}><span className={cn("min-w-0 truncate", nameClassName)}>{name}</span><SubscriptionPlanBadge tier={tier} /></span>;
}
