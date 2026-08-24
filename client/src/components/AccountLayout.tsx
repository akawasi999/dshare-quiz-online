import SiteHeader from "@/components/SiteHeader";
import AccountSidebar from "@/components/AccountSidebar";
import PublicSiteFooter from "@/components/PublicSiteFooter";

export default function AccountLayout({ children, hideSidebar = false, hideHeader = false, hideFooter = false, staticHeader = false }: { children: React.ReactNode; hideSidebar?: boolean; hideHeader?: boolean; hideFooter?: boolean; staticHeader?: boolean }) {
  return <div className={`flex min-h-screen flex-col bg-background text-foreground ${staticHeader ? "account-layout-static-header" : ""}`}>
    {hideHeader ? null : <SiteHeader />}
    <div className={hideSidebar ? "block min-h-[calc(100dvh-76px)]" : "flex min-h-[calc(100dvh-76px)] flex-1 flex-col"}>
      <div className={`mx-auto min-h-[calc(100dvh-76px)] w-full ${hideSidebar ? "block max-w-none" : "flex items-stretch max-w-[1600px]"}`}>
        {hideSidebar ? null : <AccountSidebar />}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
    {hideFooter ? null : <PublicSiteFooter />}
  </div>;
}
