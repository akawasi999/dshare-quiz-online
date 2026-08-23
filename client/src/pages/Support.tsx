import SiteHeader from "@/components/SiteHeader";
import { defaultSupport, formatUpdatedAt } from "@/lib/legalContent";
import { trpc } from "@/lib/trpc";
import { Clock3, Mail, Phone, Send } from "lucide-react";

export default function Support() {
  const content = trpc.site.legalSupport.useQuery();
  const data = content.data;
  const title = data?.supportTitle || defaultSupport.title;
  const description = data?.supportDescription || defaultSupport.description;
  const email = data?.supportEmail || "";
  const phone = data?.supportPhone || "";
  const hours = data?.supportHours || defaultSupport.hours;
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader /><main className="container py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-4xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Dshare care</p><h1 className="mt-4 font-sans text-4xl font-extrabold tracking-[-.045em] sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">{description}</p><div className="mt-10 grid gap-4 md:grid-cols-2"><section className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-6"><Mail className="text-primary" size={22} /><h2 className="mt-5 text-lg font-bold">Email</h2>{email ? <a href={`mailto:${email}`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">{email}</a> : <p className="mt-2 text-sm text-text-secondary">Email hỗ trợ sẽ được cập nhật tại CPanel.</p>}</section><section className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-6"><Phone className="text-primary" size={22} /><h2 className="mt-5 text-lg font-bold">Điện thoại</h2>{phone ? <a href={`tel:${phone.replace(/\s+/g, "")}`} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">{phone}</a> : <p className="mt-2 text-sm text-text-secondary">Số điện thoại hỗ trợ sẽ được cập nhật tại CPanel.</p>}</section><section className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-6"><Clock3 className="text-primary" size={22} /><h2 className="mt-5 text-lg font-bold">Thời gian phản hồi</h2><p className="mt-2 text-sm text-text-secondary">{hours}</p></section><section className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-6"><Send className="text-primary" size={22} /><h2 className="mt-5 text-lg font-bold">Gửi yêu cầu hỗ trợ</h2><p className="mt-2 text-sm text-text-secondary">Hãy gửi nội dung chi tiết qua email để đội ngũ hỗ trợ có thể xử lý nhanh hơn.</p></section></div><p className="mt-8 text-xs text-text-muted">Cập nhật lần cuối: {formatUpdatedAt(data?.supportUpdatedAt)}</p></div></main></div>;
}
