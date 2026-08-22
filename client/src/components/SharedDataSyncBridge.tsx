import { trpc } from "@/lib/trpc";
import { sharedDataRefreshInterval, syncEventName, syncStorageKey, type SharedDataScope } from "@/lib/sharedDataSync";
import { useEffect } from "react";

type SyncDetail = { scope?: SharedDataScope; at?: number };

export default function SharedDataSyncBridge() {
  const utils = trpc.useUtils();

  useEffect(() => {
    let lastSyncAt = 0;
    const refresh = (detail?: SyncDetail) => {
      const at = detail?.at ?? Date.now();
      if (at <= lastSyncAt) return;
      lastSyncAt = at;
      void Promise.all([
        utils.learner.summary.invalidate(),
        utils.learner.quota.invalidate(),
        utils.learner.wallet.invalidate(),
        utils.learner.history.invalidate(),
        utils.creator.myQuizzes.invalidate(),
        utils.catalog.list.invalidate(),
        utils.catalog.categories.invalidate(),
        utils.catalog.topics.invalidate(),
        utils.catalog.detail.invalidate(),
        utils.catalog.membershipPlans.invalidate(),
        utils.payment.offers.invalidate(),
      ]);
    };
    const onCustomSync = (event: Event) => refresh((event as CustomEvent<SyncDetail>).detail);
    const onStorageSync = (event: StorageEvent) => {
      if (event.key !== syncStorageKey || !event.newValue) return;
      try { refresh(JSON.parse(event.newValue) as SyncDetail); } catch { refresh(); }
    };
    window.addEventListener(syncEventName, onCustomSync);
    window.addEventListener("storage", onStorageSync);
    const reconcileTimer = window.setInterval(() => refresh(), sharedDataRefreshInterval);
    return () => {
      window.removeEventListener(syncEventName, onCustomSync);
      window.removeEventListener("storage", onStorageSync);
      window.clearInterval(reconcileTimer);
    };
  }, [utils]);

  return null;
}
