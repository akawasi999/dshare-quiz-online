import { useAuthGate } from "@/contexts/AuthGateContext";
import { type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link } from "wouter";

export default function AuthActionLink({ href, children, onClick, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; children: ReactNode }) {
  const { openAuth, isAuthenticated } = useAuthGate();
  if (isAuthenticated) return <Link href={href} onClick={onClick} {...props}>{children}</Link>;
  return <a href={href} onClick={event => { onClick?.(event); if (event.defaultPrevented) return; event.preventDefault(); openAuth({ mode: "login", returnTo: href }); }} {...props}>{children}</a>;
}
