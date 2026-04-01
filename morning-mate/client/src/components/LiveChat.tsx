import { useEffect } from "react";

/**
 * Live Chat Support Component
 * Integrates Intercom for real-time parent support
 * Helps answer questions before purchase
 */
export function LiveChat() {
  useEffect(() => {
    // Initialize Intercom
    // Replace APP_ID with your actual Intercom app ID from https://app.intercom.com/
    const APP_ID = import.meta.env.VITE_INTERCOM_APP_ID || "placeholder";

    if (APP_ID === "placeholder") {
      console.warn("[LiveChat] Intercom not configured. Set VITE_INTERCOM_APP_ID in environment.");
      return;
    }

    // Load Intercom script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://widget.intercom.io/widget/${APP_ID}`;
    document.head.appendChild(script);

    // Initialize Intercom when script loads
    script.onload = () => {
      if (window.Intercom) {
        window.Intercom("boot", {
          api_base: "https://api-iam.intercom.io",
          app_id: APP_ID,
          name: "GlowJo Support",
          email: "support@glowjo.com",
          created_at: Math.floor(Date.now() / 1000),
        });
      }
    };

    return () => {
      // Cleanup: Shutdown Intercom on unmount
      if (window.Intercom) {
        window.Intercom("shutdown");
      }
    };
  }, []);

  return null; // Intercom renders its own widget
}

// Declare Intercom global for TypeScript
declare global {
  interface Window {
    Intercom?: (command: string, data?: Record<string, unknown>) => void;
  }
}
