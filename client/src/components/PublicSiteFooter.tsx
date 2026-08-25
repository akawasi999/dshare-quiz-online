import BrandLogo from "@/components/BrandLogo";
import { FooterLinkIconGlyph, FooterSocialIcon, socialColorPresets, socialPlatformLabels } from "@/components/FooterIcons";
import type { AppearanceConfig } from "@/lib/appearanceConfig";
import { mergeAppearanceConfig } from "@/lib/appearanceConfig";
import { ROUTES } from "@/lib/routes";
import { trpc } from "@/lib/trpc";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function SocialIconList({ links, footer, className = "" }: { links: AppearanceConfig["footer"]["socialLinks"]; footer: AppearanceConfig["footer"]; className?: string }) {
  const visible = links.filter(link => link.enabled && link.url.trim());
  if (!visible.length) return null;
  const size = footer.socialStyle.size;
  const getColors = (platform: typeof visible[number]["platform"]) => footer.socialStyle.colorMode === "platform" ? socialColorPresets[platform] : footer.socialStyle;
  return <nav aria-label="Mạng xã hội" className={`flex flex-wrap gap-2 ${!footer.socialStyle.showOnMobile ? "footer-social-hide-mobile" : ""} ${className}`}>{visible.map(link => {
    const colors = getColors(link.platform);
    return <Tooltip key={link.platform}><TooltipTrigger asChild><a href={link.url} target="_blank" rel="noreferrer" aria-label={socialPlatformLabels[link.platform]} className={`footer-social-icon grid place-items-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${footer.socialStyle.shape === "round" ? "rounded-full" : "rounded-md"}`} style={{ width: size, height: size, backgroundColor: colors.backgroundColor, color: colors.iconColor, borderColor: `${colors.iconColor}40` }}><FooterSocialIcon platform={link.platform} size={Math.round(size * 0.5)} /></a></TooltipTrigger><TooltipContent side="top" sideOffset={8} className="bg-foreground text-background">{socialPlatformLabels[link.platform]}</TooltipContent></Tooltip>;
  })}</nav>;
}

export default function PublicSiteFooter() {
  const appearance = trpc.branding.get.useQuery();
  const config = mergeAppearanceConfig(appearance.data?.styleConfig);
  const footer = config.footer;
  if (!footer.enabled) return null;
  const groups = footer.linkGroups.filter(group => group.links.some(link => link.enabled));
  const brandSocialLinks = footer.socialLinks.filter(link => (link.zone ?? "brand") === "brand");
  const navigationSocialLinks = footer.socialLinks.filter(link => link.zone === "navigation");
  const bottomSocialLinks = footer.socialLinks.filter(link => link.zone === "bottom");
  const logo = config.assets.logoDark || config.assets.logo || config.assets.logoLight;
  return <footer className={`public-site-footer ${footer.shadow ? "public-site-footer-shadow" : ""} ${footer.border ? "public-site-footer-border" : ""}`} style={{ minHeight: footer.height, backgroundColor: config.colors.footer, ["--footer-column-count" as string]: footer.columns } as React.CSSProperties}>
    <div className="container py-10 sm:py-12">
      <div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
        <div><BrandLogo src={logo || undefined} monochrome={!logo} className="h-9 max-w-36" /><p className="mt-4 max-w-sm text-sm leading-6 text-white/70">{footer.description}</p><SocialIconList links={brandSocialLinks} footer={footer} className="mt-5" /></div>
        <div><div className="public-site-footer-groups">{groups.map(group => <section key={group.id}><h2 className="text-sm font-bold text-white">{group.title || "Liên kết"}</h2><nav aria-label={`Liên kết ${group.title || "Footer"}`} className="mt-4 space-y-2.5">{group.links.filter(link => link.enabled).map(link => <a key={`${link.label}-${link.url}`} href={link.url} className="flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><FooterLinkIconGlyph icon={link.icon} /><span>{link.label}</span></a>)}</nav></section>)}</div><SocialIconList links={navigationSocialLinks} footer={footer} className="mt-6" /></div>
      </div>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/55">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><span>{footer.copyright}</span><nav aria-label="Thông tin Footer" className="flex items-center gap-3"><a href={ROUTES.terms} className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Điều khoản sử dụng</a><a href={ROUTES.privacy} className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Chính sách bảo mật</a><a href={ROUTES.support} className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Liên hệ & Hỗ trợ</a></nav></div>
        <SocialIconList links={bottomSocialLinks} footer={footer} />
        {footer.showThemeSwitcher ? <span>Học tập rõ ràng hơn mỗi ngày.</span> : null}
      </div>
    </div>
  </footer>;
}
