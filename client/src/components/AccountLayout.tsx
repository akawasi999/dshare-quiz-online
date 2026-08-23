import SiteHeader from "@/components/SiteHeader";
import AccountSidebar from "@/components/AccountSidebar";
import PublicSiteFooter from "@/components/PublicSiteFooter";

export default function AccountLayout({ children, hideSidebar = false, hideHeader = false }: { children: React.ReactNode; hideSidebar?: boolean; hideHeader?: boolean }) {
  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    {hideHeader ? null : <SiteHeader />}
    <div className="flex min-h-[calc(100dvh-76px)] flex-1 flex-col">
      <div className={`mx-auto flex min-h-[calc(100dvh-76px)] w-full items-stretch ${hideSidebar ? "max-w-none" : "max-w-[1600px]"}`}>
        {hideSidebar ? null : <AccountSidebar />}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
    <PublicSiteFooter />
  </div>;
}
