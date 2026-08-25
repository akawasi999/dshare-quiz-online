import SiteHeader from "@/components/SiteHeader";
import AccountSidebar from "@/components/AccountSidebar";
import PublicSiteFooter from "@/components/PublicSiteFooter";

export default function AccountLayout({ children, hideSidebar = false, hideHeader = false, hideFooter = false, staticHeader = false, compactViewport = false }: { children: React.ReactNode; hideSidebar?: boolean; hideHeader?: boolean; hideFooter?: boolean; staticHeader?: boolean; compactViewport?: boolean }) {
  return <div className={`flex flex-col bg-background text-foreground ${compactViewport ? "h-[100dvh] min-h-0 overflow-hidden" : "min-h-screen"} ${staticHeader ? "account-layout-static-header" : ""}`}>
    {hideHeader ? null : <SiteHeader />}
    <div className={compactViewport ? (hideSidebar ? "block min-h-0 flex-1" : "flex min-h-0 flex-1 flex-col") : (hideSidebar ? "block min-h-[calc(100dvh-76px)]" : "flex min-h-[calc(100dvh-76px)] flex-1 flex-col")}>
      <div className={`mx-auto w-full ${compactViewport ? "h-full min-h-0" : "min-h-[calc(100dvh-76px)]"} ${hideSidebar ? "block max-w-none" : "flex items-stretch max-w-[1600px]"}`}>
        {hideSidebar ? null : <AccountSidebar />}
        <div className={`min-w-0 flex-1 ${compactViewport && hideSidebar ? "h-full min-h-0" : ""}`}>{children}</div>
      </div>
    </div>
    {hideFooter ? null : <PublicSiteFooter />}
  </div>;
}
