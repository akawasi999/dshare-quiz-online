import BrandLogo from "@/components/BrandLogo";
import { FooterLinkIconGlyph, FooterSocialIcon, socialPlatformLabels } from "@/components/FooterIcons";
import { mergeAppearanceConfig } from "@/lib/appearanceConfig";
import { trpc } from "@/lib/trpc";

export default function PublicSiteFooter() {
  const appearance = trpc.branding.get.useQuery();
  const config = mergeAppearanceConfig(appearance.data?.styleConfig);
  const footer = config.footer;
  if (!footer.enabled) return null;
  const groups = footer.linkGroups.filter(group => group.links.some(link => link.enabled));
  const socialLinks = footer.socialLinks.filter(link => link.enabled && link.url.trim());
  const logo = config.assets.logoDark || config.assets.logo || config.assets.logoLight;
  return <footer className={`public-site-footer ${footer.shadow ? "public-site-footer-shadow" : ""} ${footer.border ? "public-site-footer-border" : ""}`} style={{ minHeight: footer.height, backgroundColor: config.colors.footer, ["--footer-column-count" as string]: footer.columns } as React.CSSProperties}>
    <div className="container py-10 sm:py-12"><div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]"><div><BrandLogo src={logo || undefined} monochrome={!logo} className="h-9 max-w-36" /><p className="mt-4 max-w-sm text-sm leading-6 text-white/70">{footer.description}</p>{socialLinks.length ? <nav aria-label="Mạng xã hội" className="mt-5 flex flex-wrap gap-2">{socialLinks.map(link => <a key={link.platform} href={link.url} target="_blank" rel="noreferrer" aria-label={socialPlatformLabels[link.platform]} className="grid size-9 place-items-center rounded-full border border-white/20 text-white/75 transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><FooterSocialIcon platform={link.platform} /></a>)}</nav> : null}</div><div className="public-site-footer-groups">{groups.map(group => <section key={group.id}><h2 className="text-sm font-bold text-white">{group.title || "Liên kết"}</h2><nav aria-label={`Liên kết ${group.title || "Footer"}`} className="mt-4 space-y-2.5">{group.links.filter(link => link.enabled).map(link => <a key={`${link.label}-${link.url}`} href={link.url} className="flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><FooterLinkIconGlyph icon={link.icon} /><span>{link.label}</span></a>)}</nav></section>)}</div></div><div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/55"><span>{footer.copyright}</span>{footer.showThemeSwitcher ? <span>Học tập rõ ràng hơn mỗi ngày.</span> : null}</div></div>
  </footer>;
}
