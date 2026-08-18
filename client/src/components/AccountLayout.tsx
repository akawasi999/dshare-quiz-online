import SiteHeader from "@/components/SiteHeader";
import AccountSidebar from "@/components/AccountSidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#ebf8ff]"><SiteHeader /><div className="mx-auto flex w-full max-w-[1600px]"><AccountSidebar /><div className="min-w-0 flex-1">{children}</div></div></div>;
}
