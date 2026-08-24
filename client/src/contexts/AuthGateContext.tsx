import AuthDialog, { type AuthMode } from "@/components/AuthDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type AuthRequest = { mode?: AuthMode; returnTo?: string };
type AuthGateValue = { openAuth: (request?: AuthRequest) => void; requireAuth: (returnTo: string) => boolean; isAuthenticated: boolean };
const AuthGateContext = createContext<AuthGateValue | null>(null);
const safePath = (value: string | undefined) => value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
const fallbackAuthGate: AuthGateValue = {
  openAuth: request => window.dispatchEvent(new CustomEvent("dshare:auth-required", { detail: request })),
  requireAuth: returnTo => { window.dispatchEvent(new CustomEvent("dshare:auth-required", { detail: { mode: "login", returnTo } })); return false; },
  isAuthenticated: false,
};

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [request, setRequest] = useState<{ open: boolean; mode: AuthMode; returnTo: string }>({ open: false, mode: "login", returnTo: "/" });
  const openAuth = useCallback((next: AuthRequest = {}) => setRequest({ open: true, mode: next.mode ?? "login", returnTo: safePath(next.returnTo) }), []);
  const requireAuth = useCallback((returnTo: string) => {
    if (user) return true;
    openAuth({ mode: "login", returnTo });
    return false;
  }, [openAuth, user]);
  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<AuthRequest>).detail;
      openAuth({ mode: "login", returnTo: detail?.returnTo });
    };
    window.addEventListener("dshare:auth-required", handleRequest);
    return () => window.removeEventListener("dshare:auth-required", handleRequest);
  }, [openAuth]);
  const value = useMemo(() => ({ openAuth, requireAuth, isAuthenticated: Boolean(user) }), [openAuth, requireAuth, user]);
  return <AuthGateContext.Provider value={value}>{children}<AuthDialog open={request.open} onOpenChange={open => setRequest(current => ({ ...current, open }))} initialMode={request.mode} returnTo={request.returnTo} onAuthenticated={() => { const destination = request.returnTo; setRequest(current => ({ ...current, open: false })); setLocation(destination); }} /></AuthGateContext.Provider>;
}

export function useAuthGate() {
  const context = useContext(AuthGateContext);
  return context ?? fallbackAuthGate;
}
