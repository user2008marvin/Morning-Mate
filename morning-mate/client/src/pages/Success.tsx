import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function Success() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const sessionId = new URLSearchParams(search).get("session_id");

  const utils = trpc.useUtils();

  const { data: subscription, refetch } = trpc.subscription.getSubscription.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });

  const verifyAndActivate = trpc.stripe.verifyAndActivate.useMutation({
    onSuccess: async (result) => {
      if (result.success) {
        await utils.subscription.getSubscription.invalidate();
        await refetch();
        setStatus("success");
      }
    },
  });

  useEffect(() => {
    if (!user || !sessionId || verifyAndActivate.isPending || verifyAndActivate.isSuccess) return;
    verifyAndActivate.mutate({ sessionId });
  }, [user, sessionId]);

  useEffect(() => {
    if (!subscription) return;
    if (subscription.tier !== "freemium") {
      setStatus("success");
    }
  }, [subscription]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "loading") setStatus("success");
    }, 6000);
    return () => clearTimeout(timer);
  }, [status]);

  const tierEmoji: Record<string, string> = {
    starter: "⭐",
    plus: "🌟",
    gold: "🏆",
    freemium: "🎉",
  };

  const tierLabel: Record<string, string> = {
    starter: "GlowJo",
    plus: "Plus",
    gold: "Gold",
    freemium: "Free",
  };

  if (isLoading || status === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #4facfe 0%, #ff9a3c 60%, #ff6b35 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Fredoka One', cursive", padding: "24px", textAlign: "center",
      }}>
        <div style={{ fontSize: "64px", marginBottom: "16px", animation: "spin 1s linear infinite" }}>⭐</div>
        <h1 style={{ color: "white", fontSize: "2rem", marginBottom: "8px" }}>Activating your plan…</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem" }}>Just a moment while we confirm your subscription!</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const tier = subscription?.tier ?? "freemium";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #4facfe 0%, #ff9a3c 60%, #ff6b35 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Fredoka One', cursive", padding: "24px", textAlign: "center",
    }}>
      <div style={{
        background: "white", borderRadius: "32px", padding: "48px 32px", maxWidth: "400px", width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ fontSize: "80px", marginBottom: "16px" }}>{tierEmoji[tier]}</div>
        <h1 style={{ fontSize: "2rem", color: "#1a1a2e", marginBottom: "8px" }}>
          You're in! 🎉
        </h1>
        <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "8px" }}>
          Welcome to <strong>GlowJo {tierLabel[tier]}</strong>
        </p>
        <p style={{ fontSize: "0.9rem", color: "#999", marginBottom: "12px" }}>
          Your kids are going to love their new routine!
        </p>
        {tier !== "freemium" && (
          <div style={{ background: "#fff8ee", borderRadius: 16, padding: "12px 16px", marginBottom: "16px", textAlign: "left" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#ff9a3c", marginBottom: 6, letterSpacing: 1 }}>WHAT'S UNLOCKED</div>
            <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.7 }}>
              ✅ Up to {tier === "gold" ? "5" : "3"} child profiles<br />
              ✅ 🎤 Voice guidance — Sunny speaks every task<br />
              ✅ 🌍 Bilingual — English + Spanish<br />
              ✅ 🎵 Happy music every morning<br />
              ✅ 🎙️ Parents' Voice recordings<br />
              ✅ 🧩 SEND Mode for additional needs<br />
              {tier === "gold" && <>✅ 🌙 Night Mode — full bedtime routine<br />✅ 📖 Personalised bedtime stories<br /></>}
            </div>
          </div>
        )}
        <div style={{ background: "#f0f4ff", borderRadius: 12, padding: "10px 14px", marginBottom: "20px", fontSize: "0.8rem", color: "#555", textAlign: "left" }}>
          🔄 <strong>Auto-renews</strong> monthly (or annually if you chose that). A confirmation email is on its way.<br />
          ❌ <strong>Cancel anytime</strong> — go to Parent Dashboard → Account → Cancel Subscription.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            onClick={() => navigate("/parent")}
            style={{
              background: "linear-gradient(135deg, #4facfe, #00f2fe)",
              color: "white", border: "none", borderRadius: "16px",
              padding: "16px 24px", fontSize: "1.1rem", cursor: "pointer",
              fontFamily: "'Fredoka One', cursive",
            }}
          >
            👨‍👩‍👧 Set Up My Kids
          </button>
          <button
            onClick={() => navigate("/app")}
            style={{
              background: "linear-gradient(135deg, #ff9a3c, #ff6b35)",
              color: "white", border: "none", borderRadius: "16px",
              padding: "16px 24px", fontSize: "1.1rem", cursor: "pointer",
              fontFamily: "'Fredoka One', cursive",
            }}
          >
            🚀 Start Morning Routine
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "transparent", color: "#999", border: "2px solid #eee",
              borderRadius: "16px", padding: "12px 24px", fontSize: "0.9rem",
              cursor: "pointer", fontFamily: "'Fredoka One', cursive",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
