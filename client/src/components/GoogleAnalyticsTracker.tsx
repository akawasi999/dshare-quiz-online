import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

export default function GoogleAnalyticsTracker() {
  const [location] = useLocation();
  const settings = trpc.seo.publicSettings.useQuery(undefined, { staleTime: 5 * 60_000 });

  useEffect(() => {
    const measurementId = settings.data?.googleAnalyticsMeasurementId;
    if (!measurementId || !window.gtag) return;
    window.gtag("config", measurementId, { page_path: location });
  }, [location, settings.data?.googleAnalyticsMeasurementId]);

  return null;
}
