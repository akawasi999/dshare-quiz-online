import type { ReactNode } from "react";

export function CPanelPageHeader({ actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null;
}
