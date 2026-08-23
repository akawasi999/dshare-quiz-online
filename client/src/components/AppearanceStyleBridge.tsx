import { mergeAppearanceConfig } from "@/lib/appearanceConfig";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export default function AppearanceStyleBridge() {
  const appearance = trpc.branding.get.useQuery();

  useEffect(() => {
    const config = mergeAppearanceConfig(appearance.data?.styleConfig);
    if (!appearance.data?.styleConfig && appearance.data) {
      config.colors.primary = appearance.data.primaryColor;
      config.colors.info = appearance.data.accentColor;
      config.colors.success = appearance.data.successColor;
      config.colors.danger = appearance.data.attentionColor;
      config.colors.body = appearance.data.pageColor;
      config.colors.surface = appearance.data.surfaceColor;
      config.studio.questionsWidth = appearance.data.questionTabContentWidth;
      config.studio.settingsWidth = appearance.data.settingsTabContentWidth;
    }
    const root = document.documentElement;
    const set = (name: string, value: string | number) => root.style.setProperty(name, String(value));
    set("--primary", config.colors.primary); set("--primary-dark", config.colors.primaryDark); set("--primary-light", config.colors.primaryLight);
    set("--accent", config.colors.info); set("--success", config.colors.success); set("--warning", config.colors.warning); set("--danger", config.colors.danger);
    set("--background", config.colors.body); set("--surface", config.colors.surface); set("--card", config.colors.card); set("--input", config.colors.input);
    set("--text", config.colors.text); set("--text-secondary", config.colors.textSecondary); set("--text-muted", config.colors.textMuted); set("--border", config.colors.border); set("--border-light", config.colors.borderLight);
    set("--radius-sm-token", `${config.borders.radius.sm}px`); set("--radius-md-token", `${config.borders.radius.md}px`); set("--radius-lg-token", `${config.borders.radius.lg}px`); set("--radius-xl-token", `${config.borders.radius.xl}px`);
    set("--page-max-width", config.page.maxWidth); set("--site-header-height", `${config.header.height}px`); set("--site-header-gap", `${config.header.navigationGap}px`); set("--site-header-font-size", `${config.header.navigationFontSize}px`); set("--site-header-font-weight", config.header.navigationFontWeight); set("--site-header-background", config.colors.header); set("--font-family-primary", config.typography.primaryFont); set("--font-family-heading", config.typography.headingFont); set("--font-size-base", `${config.typography.baseSize}px`);
    root.dataset.appearanceHeader = config.header.enabled ? "visible" : "hidden";
    root.dataset.appearanceHeaderSticky = config.header.sticky ? "true" : "false";
    root.dataset.appearanceHeaderLogo = config.header.showLogo ? "visible" : "hidden";
    root.dataset.appearanceHeaderNavigation = config.header.showNavigation ? "visible" : "hidden";
    root.dataset.appearanceHeaderShadow = config.header.shadow ? "true" : "false";
    root.dataset.appearanceHeaderBorder = config.header.border ? "true" : "false";
  }, [appearance.data]);

  return null;
}
