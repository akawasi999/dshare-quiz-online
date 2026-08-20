import SiteHeader from "@/components/SiteHeader";
import AccountSidebar from "@/components/AccountSidebar";

export default function AccountLayout({ children, hideSidebar = false, hideHeader = false }: { children: React.ReactNode; hideSidebar?: boolean; hideHeader?: boolean }) {
  return <div className="min-h-screen bg-[#ebf8ff]">{hideHeader ? null : <SiteHeader />}<div className={`mx-auto flex w-full ${hideSidebar ? "max-w-none" : "max-w-[1600px]"}`}>{hideSidebar ? null : <AccountSidebar />}<div className="min-w-0 flex-1">{children}</div></div></div>;
}
