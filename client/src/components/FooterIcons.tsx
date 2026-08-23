import type { FooterLinkIcon, FooterSocialPlatform } from "@/lib/appearanceConfig";
import { BookOpen, BriefcaseBusiness, Facebook, FileText, HelpCircle, Instagram, Linkedin, Mail, Music2, ShieldCheck, Twitter, Users, Youtube } from "lucide-react";

export const footerIconOptions: Array<{ value: FooterLinkIcon; label: string }> = [{ value: "none", label: "Không có" }, { value: "book", label: "Sách" }, { value: "shield", label: "Bảo mật" }, { value: "mail", label: "Email" }, { value: "help", label: "Trợ giúp" }, { value: "users", label: "Cộng đồng" }, { value: "briefcase", label: "Dịch vụ" }, { value: "file", label: "Tài liệu" }];
export const socialPlatformLabels: Record<FooterSocialPlatform, string> = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", twitter: "X / Twitter", tiktok: "TikTok" };

export function getSocialUrlError(value: string, required: boolean) {
  const trimmed = value.trim();
  if (!trimmed) return required ? "Nhập URL trước khi bật nền tảng này." : null;
  try { const parsed = new URL(trimmed); return parsed.protocol === "https:" || parsed.protocol === "http:" ? null : "URL phải bắt đầu bằng http:// hoặc https://."; } catch { return "URL mạng xã hội không hợp lệ."; }
}

export function FooterLinkIconGlyph({ icon, size = 15 }: { icon?: FooterLinkIcon; size?: number }) {
  const Icon = icon === "book" ? BookOpen : icon === "shield" ? ShieldCheck : icon === "mail" ? Mail : icon === "help" ? HelpCircle : icon === "users" ? Users : icon === "briefcase" ? BriefcaseBusiness : icon === "file" ? FileText : null;
  return Icon ? <Icon aria-hidden="true" size={size} /> : null;
}

export function FooterSocialIcon({ platform, size = 18 }: { platform: FooterSocialPlatform; size?: number }) {
  const Icon = platform === "facebook" ? Facebook : platform === "instagram" ? Instagram : platform === "youtube" ? Youtube : platform === "linkedin" ? Linkedin : platform === "twitter" ? Twitter : Music2;
  return <Icon aria-hidden="true" size={size} />;
}
