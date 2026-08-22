import type { ReactNode } from "react";

export function CPanelPageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">{eyebrow}</p><h1 className="mt-2 text-[clamp(2rem,4vw,2.5rem)] font-bold tracking-[-.05em] text-foreground">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</header>;
}
