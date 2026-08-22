export type SharedDataScope = "account" | "catalog" | "learning";

export const sharedDataQueryOptions = {
  refetchInterval: 20_000,
  refetchOnWindowFocus: true,
  staleTime: 0,
};

export const sharedDataRefreshInterval = 20_000;

const syncEventName = "dshare:shared-data-change";
const syncStorageKey = "dshare:shared-data-change";

export function announceSharedDataChange(scope: SharedDataScope) {
  if (typeof window === "undefined") return;
  const detail = { scope, at: Date.now() };
  window.dispatchEvent(new CustomEvent(syncEventName, { detail }));
  try {
    window.localStorage.setItem(syncStorageKey, JSON.stringify(detail));
  } catch {
    // A polling refresh remains active when storage is unavailable.
  }
}

export { syncEventName, syncStorageKey };
