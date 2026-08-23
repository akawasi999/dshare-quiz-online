import SiteHeader from "@/components/SiteHeader";
import { defaultPrivacyContent, defaultTermsContent, formatUpdatedAt } from "@/lib/legalContent";
import { trpc } from "@/lib/trpc";

type LegalDocument = "terms" | "privacy";

const titles: Record<LegalDocument, { title: string; intro: string }> = {
  terms: { title: "Điều khoản sử dụng", intro: "Các nguyên tắc chung khi sử dụng nền tảng Dshare Quiz Online." },
  privacy: { title: "Chính sách bảo mật", intro: "Cách Dshare Quiz Online xử lý thông tin cần thiết để vận hành trải nghiệm học tập." },
};

export default function Legal({ document }: { document: LegalDocument }) {
  const content = trpc.site.legalSupport.useQuery();
  const page = titles[document];
  const raw = document === "terms" ? content.data?.termsContent || defaultTermsContent : content.data?.privacyContent || defaultPrivacyContent;
  const updatedAt = document === "terms" ? content.data?.termsUpdatedAt : content.data?.privacyUpdatedAt;
  const paragraphs = raw.split(/\n{2,}/).map(item => item.trim()).filter(Boolean);
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader /><main className="container py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-primary">Thông tin pháp lý</p><h1 className="mt-4 font-sans text-4xl font-extrabold tracking-[-.045em] sm:text-5xl">{page.title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">{page.intro}</p><div className="mt-10 space-y-4">{paragraphs.map((paragraph, index) => <section key={`${index}-${paragraph.slice(0, 20)}`} className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-6 sm:p-7"><p className="text-sm leading-7 text-text-secondary">{paragraph}</p></section>)}</div><p className="mt-7 text-xs text-text-muted">Cập nhật lần cuối: {formatUpdatedAt(updatedAt)}</p></div></main></div>;
}
