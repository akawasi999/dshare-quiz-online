import { cn } from "@/lib/utils";

const BRAND_LOGO_URL = "/manus-storage/dshare-quiz-online-logo_5a8ee207.png";

export default function BrandLogo({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  return <img src={BRAND_LOGO_URL} alt="Dshare Quiz Online" className={cn("h-10 w-auto object-contain object-left", className, imageClassName)} />;
}

export { BRAND_LOGO_URL };
