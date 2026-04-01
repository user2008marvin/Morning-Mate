import { useEffect } from "react";

export function useAnalytics() {
  useEffect(() => {
    // Track page view
    if (typeof window !== "undefined" && window.location) {
      const event = {
        type: "pageview",
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      };
      
      // Send to analytics endpoint (you can replace with your own)
      navigator.sendBeacon("/api/analytics", JSON.stringify(event));
    }
  }, []);

  const trackEvent = (eventName: string, data?: Record<string, any>) => {
    const event = {
      type: "event",
      name: eventName,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.pathname : "",
    };
    
    if (typeof navigator !== "undefined") {
      navigator.sendBeacon("/api/analytics", JSON.stringify(event));
    }
  };

  const trackConversion = (tier: "starter" | "plus" | "gold", amount: number) => {
    const event = {
      type: "conversion",
      tier,
      amount,
      timestamp: new Date().toISOString(),
    };
    
    if (typeof navigator !== "undefined") {
      navigator.sendBeacon("/api/analytics", JSON.stringify(event));
    }
  };

  return { trackEvent, trackConversion };
}
