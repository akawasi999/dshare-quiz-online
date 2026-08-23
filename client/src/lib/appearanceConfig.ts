export type AppearanceConfig = {
  colors: Record<"primary" | "primaryHover" | "primaryActive" | "primaryLight" | "primaryDark" | "text" | "textSecondary" | "textMuted" | "textDisabled" | "link" | "linkHover" | "body" | "surface" | "card" | "input" | "sidebar" | "header" | "footer" | "border" | "borderLight" | "borderStrong" | "divider" | "success" | "warning" | "danger" | "info", string>;
  assets: Record<"logo" | "logoLight" | "logoDark" | "favicon" | "appleTouchIcon" | "defaultAvatar" | "defaultThumbnail" | "defaultCover" | "defaultOpenGraph" | "notFound" | "emptyState", string>;
  image: { objectFit: "cover" | "contain" | "fill"; objectPosition: "center" | "top" | "bottom" | "left" | "right" };
  typography: { primaryFont: string; secondaryFont: string; headingFont: string; monoFont: string; baseSize: number; scale: Record<"xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl", number>; regularWeight: number; mediumWeight: number; semiboldWeight: number; boldWeight: number; lineHeight: number; letterSpacing: number };
  borders: { defaultWidth: number; thinWidth: number; strongWidth: number; focusWidth: number; radius: Record<"none" | "xs" | "sm" | "md" | "lg" | "xl" | "full", number>; spacing: Record<"xs" | "sm" | "md" | "lg" | "xl" | "2xl", number>; componentRadius: Record<"button" | "input" | "card" | "modal" | "dropdown" | "badge" | "avatar", number> };
  page: { maxWidth: string; leftSidebarEnabled: boolean; leftSidebarWidth: number; rightSidebarEnabled: boolean; rightSidebarWidth: number; mobileBreakpoint: number; tabletBreakpoint: number; desktopBreakpoint: number; sidebarBehavior: "hide" | "collapse" | "offcanvas" | "stack" };
  header: { enabled: boolean; height: number; width: "container" | "full"; sticky: boolean; shadow: boolean; border: boolean; showLogo: boolean; logoWidth: number; showNavigation: boolean; navigationPosition: "left" | "center" | "right"; navigationGap: number; navigationFontSize: number; navigationFontWeight: number; actions: Record<"search" | "notifications" | "messages" | "help" | "userMenu" | "login" | "register" | "cta", boolean> };
  footer: { enabled: boolean; height: number; width: "container" | "full"; shadow: boolean; border: boolean; columns: 1 | 2 | 3 | 4; description: string; copyright: string; showThemeSwitcher: boolean; links: Array<{ label: string; url: string; enabled: boolean; icon?: FooterLinkIcon }>; linkGroups: Array<{ id: string; title: string; links: Array<{ label: string; url: string; enabled: boolean; icon?: FooterLinkIcon }> }>; socialLinks: Array<{ platform: FooterSocialPlatform; url: string; enabled: boolean }> };
  studio: { questionsWidth: number; settingsWidth: number };
};

export type FooterLinkIcon = "none" | "book" | "shield" | "mail" | "help" | "users" | "briefcase" | "file";
export type FooterSocialPlatform = "facebook" | "instagram" | "youtube" | "linkedin" | "twitter" | "tiktok";

export const PLATFORM_DEFAULT_COVER = "/manus-storage/dshare-default-quiz-cover_d96ff2fa.png";

export const defaultAppearanceConfig: AppearanceConfig = {
  colors: { primary: "#565BE5", primaryHover: "#4B50D6", primaryActive: "#3F43BF", primaryLight: "#EEF0FF", primaryDark: "#34389E", text: "#111827", textSecondary: "#64748B", textMuted: "#94A3B8", textDisabled: "#CBD5E1", link: "#565BE5", linkHover: "#3F43BF", body: "#F6F8FC", surface: "#FFFFFF", card: "#FFFFFF", input: "#FFFFFF", sidebar: "#FFFFFF", header: "#FFFFFF", footer: "#111827", border: "#E2E6EF", borderLight: "#F1F4F8", borderStrong: "#CBD5E1", divider: "#E2E6EF", success: "#00845A", warning: "#D97706", danger: "#DC2626", info: "#3762D2" },
  assets: { logo: "", logoLight: "", logoDark: "", favicon: "", appleTouchIcon: "", defaultAvatar: "", defaultThumbnail: "", defaultCover: "", defaultOpenGraph: "", notFound: "", emptyState: "" },
  image: { objectFit: "cover", objectPosition: "center" },
  typography: { primaryFont: "Inter", secondaryFont: "Open Sans", headingFont: "Montserrat", monoFont: "ui-monospace", baseSize: 16, scale: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48 }, regularWeight: 400, mediumWeight: 500, semiboldWeight: 600, boldWeight: 700, lineHeight: 1.5, letterSpacing: 0 },
  borders: { defaultWidth: 1, thinWidth: 1, strongWidth: 2, focusWidth: 3, radius: { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999 }, spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32 }, componentRadius: { button: 12, input: 12, card: 24, modal: 24, dropdown: 16, badge: 9999, avatar: 9999 } },
  page: { maxWidth: "1440px", leftSidebarEnabled: true, leftSidebarWidth: 280, rightSidebarEnabled: false, rightSidebarWidth: 320, mobileBreakpoint: 640, tabletBreakpoint: 768, desktopBreakpoint: 1024, sidebarBehavior: "offcanvas" },
  header: { enabled: true, height: 68, width: "container", sticky: false, shadow: false, border: true, showLogo: true, logoWidth: 142, showNavigation: true, navigationPosition: "left", navigationGap: 32, navigationFontSize: 14, navigationFontWeight: 500, actions: { search: false, notifications: true, messages: false, help: false, userMenu: true, login: true, register: false, cta: true } },
  footer: { enabled: true, height: 240, width: "container", shadow: false, border: false, columns: 3, description: "Nền tảng tạo Quiz, học tập và chia sẻ kiến thức trực tuyến.", copyright: "© Dshare Quiz Online", showThemeSwitcher: true, links: [{ label: "Điều khoản", url: "/terms", enabled: true, icon: "file" }, { label: "Bảo mật", url: "/privacy", enabled: true, icon: "shield" }, { label: "Liên hệ", url: "/account", enabled: true, icon: "mail" }], linkGroups: [{ id: "information", title: "Thông tin", links: [{ label: "Điều khoản", url: "/terms", enabled: true, icon: "file" }, { label: "Bảo mật", url: "/privacy", enabled: true, icon: "shield" }] }, { id: "support", title: "Hỗ trợ", links: [{ label: "Liên hệ", url: "/account", enabled: true, icon: "mail" }] }], socialLinks: [{ platform: "facebook", url: "", enabled: false }, { platform: "instagram", url: "", enabled: false }, { platform: "youtube", url: "", enabled: false }, { platform: "linkedin", url: "", enabled: false }, { platform: "tiktok", url: "", enabled: false }] },
  studio: { questionsWidth: 1440, settingsWidth: 1040 },
};

export function mergeAppearanceConfig(value: unknown): AppearanceConfig {
  const candidate = value && typeof value === "object" ? value as Partial<AppearanceConfig> : {};
  const candidateFooter = candidate.footer;
  const mergedFooter = { ...defaultAppearanceConfig.footer, ...candidateFooter };
  const legacyFooterLinks = candidateFooter && Array.isArray(candidateFooter.links) ? candidateFooter.links : null;
  return {
    ...defaultAppearanceConfig,
    ...candidate,
    colors: { ...defaultAppearanceConfig.colors, ...candidate.colors },
    assets: { ...defaultAppearanceConfig.assets, ...candidate.assets },
    image: { ...defaultAppearanceConfig.image, ...candidate.image },
    typography: { ...defaultAppearanceConfig.typography, ...candidate.typography, scale: { ...defaultAppearanceConfig.typography.scale, ...candidate.typography?.scale } },
    borders: { ...defaultAppearanceConfig.borders, ...candidate.borders, radius: { ...defaultAppearanceConfig.borders.radius, ...candidate.borders?.radius }, spacing: { ...defaultAppearanceConfig.borders.spacing, ...candidate.borders?.spacing }, componentRadius: { ...defaultAppearanceConfig.borders.componentRadius, ...candidate.borders?.componentRadius } },
    page: { ...defaultAppearanceConfig.page, ...candidate.page },
    header: { ...defaultAppearanceConfig.header, ...candidate.header, actions: { ...defaultAppearanceConfig.header.actions, ...candidate.header?.actions } },
    footer: { ...mergedFooter, linkGroups: candidateFooter && !Array.isArray(candidateFooter.linkGroups) && legacyFooterLinks ? [{ id: "information", title: "Thông tin", links: legacyFooterLinks }] : mergedFooter.linkGroups, socialLinks: Array.isArray(candidateFooter?.socialLinks) ? candidateFooter.socialLinks : defaultAppearanceConfig.footer.socialLinks },
    studio: { ...defaultAppearanceConfig.studio, ...candidate.studio },
  };
}
