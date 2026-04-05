/**
 * GlowJo — Landing Page
 * Design: Storybook Warmth / Illustrated World
 * Fonts: Fredoka One (display) + Nunito (body)
 * Colors: Sunrise gradient — sky blue → amber → coral
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AuthModal } from "@/components/AuthModal";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663462837813/Q6tJTdg6w67gktwsr4Arms/morning-hero-bg-fhdC9vtNYWmWwWTUt8eFwh.webp";
const SUNNY_MASCOT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663462837813/Q6tJTdg6w67gktwsr4Arms/sunny-mascot-B2aYkz9voMHKCVjDWR9DQM.webp";

// ── EMAIL VALIDATION ──
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ── DEMO TASKS ──
const DEMO_TASKS = [
  { emoji: "☀️", label: "WAKE UP!", mascot: "😄", speech: "Rise and shine superstar!", voice: "Rise and shine superstar! You got this!", stars: 1 },
  { emoji: "🛁", label: "SHOWER TIME!", mascot: "😊", speech: "So squeaky clean!", voice: "Clean champion coming through! Looking great!", stars: 2 },
  { emoji: "🥛", label: "EAT BREAKFAST!", mascot: "🤩", speech: "Superpowers loaded!", voice: "Fuel up! You are a rocket today!", stars: 3 },
  { emoji: "🪥", label: "BRUSH TEETH!", mascot: "😁", speech: "Dazzling smile!", voice: "Shiniest smile in the whole world! Great job!", stars: 4 },
  { emoji: "🎒", label: "PACK YOUR BAG!", mascot: "🚀", speech: "Ready to fly!", voice: "Zip it up! You are totally ready to fly!", stars: 5 },
  { emoji: "🚀", label: "LET'S GO!", mascot: "🏆", speech: "You are LEGENDARY!", voice: "Daily winner! You are absolutely LEGENDARY!", stars: 6 },
];

const DEMO_TASKS_ES = [
  { emoji: "☀️", label: "¡LEVÁNTATE!", mascot: "😄", speech: "¡Buenos días, estrella!", voice: "¡Buenos días, pequeño! ¡Levántate, estrella brillante!", stars: 1 },
  { emoji: "🛁", label: "¡HORA DEL BAÑO!", mascot: "😊", speech: "¡Súper limpio!", voice: "¡Limpio como un campeón! ¡Muy bien hecho!", stars: 2 },
  { emoji: "🥛", label: "¡DESAYUNO!", mascot: "🤩", speech: "¡Superpoderes!", voice: "¡Carga energía! ¡Hoy eres un cohete!", stars: 3 },
  { emoji: "🪥", label: "¡CEPILLA DIENTES!", mascot: "😁", speech: "¡Sonrisa brillante!", voice: "¡La sonrisa más brillante del mundo! ¡Muy bien!", stars: 4 },
  { emoji: "🎒", label: "¡MOCHILA LISTA!", mascot: "🚀", speech: "¡Listo para volar!", voice: "¡Ciérrala! ¡Estás listo para volar!", stars: 5 },
  { emoji: "🚀", label: "¡VAMOS!", mascot: "🏆", speech: "¡Eres una LEYENDA!", voice: "¡Ganador del día! ¡Eres absolutamente INCREÍBLE!", stars: 6 },
];

// ── CONFETTI ──
function spawnConfetti(container: HTMLElement, timerRef: React.MutableRefObject<ReturnType<typeof setTimeout>[]>) {
  const colors = ["#ff5f1f", "#ffd700", "#4facfe", "#ff9a3c", "#ff6b35", "#fff"];
  for (let i = 0; i < 30; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position:absolute; width:10px; height:10px; border-radius:2px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%; top:0;
      animation: confetti-fall ${1.5 + Math.random() * 1.5}s ease-out forwards;
      animation-delay:${Math.random() * 0.5}s;
      pointer-events:none; z-index:50;
    `;
    container.appendChild(el);
    const timer = setTimeout(() => el.remove(), 3500);
    timerRef.current.push(timer);
  }
}

// ── DEMO COMPONENT ──
function DemoPhone({ lang = "en" }: { lang?: "en" | "es" }) {
  const demoLang = lang;
  const [demoIdx, setDemoIdx] = useState(0);
  const tasks = lang === "es" ? DEMO_TASKS_ES : DEMO_TASKS;
  const [demoDone, setDemoDone] = useState(false);
  const [currentTask, setCurrentTask] = useState(tasks[0]);
  const [mascot, setMascot] = useState("😴");
  const [speech, setSpeech] = useState(lang === "es" ? "¡Tócame para despertar!" : "Tap to wake me up!");
  const [stars, setStars] = useState("☆☆☆☆☆☆");
  const [hint, setHint] = useState(lang === "es" ? "¡TÓCAME! 👆" : "TAP ME! 👆");
  const [voiceMsg, setVoiceMsg] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [pulsing, setPulsing] = useState(true);
  const confettiRef = useRef<HTMLDivElement>(null);
  const voiceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const confettiTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ✅ CANCEL any leftover app speech on mount + CLEANUP ON UNMOUNT
  useEffect(() => {
    try { window.speechSynthesis.cancel(); } catch {}
    return () => {
      if (voiceTimer.current) clearTimeout(voiceTimer.current);
      confettiTimers.current.forEach(t => clearTimeout(t));
      try { window.speechSynthesis.cancel(); } catch {}
    };
  }, []);

  function resetDemo() {
    setDemoIdx(0);
    setDemoDone(false);
    setCurrentTask(tasks[0]);
    setMascot("😴");
    setSpeech(lang === "es" ? "¡Tócame para despertar!" : "Tap to wake me up!");
    setStars("☆☆☆☆☆☆");
    setHint(lang === "es" ? "¡TÓCAME! 👆" : "TAP ME! 👆");
    setPulsing(true);
    setShowVoice(false);
  }

  async function speak(text: string, lang: "en" | "es") {
    const clean = text
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "")
      .trim();
    if (!clean) return;

    // Browser speech synthesis — always picks FEMALE voice
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> =>
        new Promise(resolve => {
          const v = window.speechSynthesis.getVoices();
          if (v.length > 0) { resolve(v); return; }
          window.speechSynthesis.addEventListener('voiceschanged', () => resolve(window.speechSynthesis.getVoices()), { once: true });
          setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
        });
      const voices = await getVoicesAsync();
      const MALE_SKIP = ['Daniel', 'Google UK English Male', 'Alex', 'Fred', 'Microsoft David', 'Microsoft Mark', 'Arthur', 'David', 'Mark', 'George', 'Ryan', 'Microsoft Ryan', 'Microsoft George', 'Rishi', 'Aaron', 'Thomas', 'Reed', 'Eddy', 'Grandpa', 'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Wobble', 'Zarvox', 'Guy', 'Liam', 'James', 'Chris', 'Connor', 'Microsoft Guy Online (Natural)', 'Microsoft Ryan Online (Natural)', 'Microsoft George Online (Natural)', 'Microsoft Liam Online (Natural)'];
      const FEMALE_KEYWORDS = ['aria','jenny','libby','sonia','mia','susan','zira','hazel','natasha','victoria','emma','samantha','karen','tessa','moira','fiona','helena','elvira','paulina','monica','alice','grace','isabella'];
      const isMale = (v: SpeechSynthesisVoice) => MALE_SKIP.includes(v.name) || v.name.toLowerCase().includes('male');
      const isFemale = (v: SpeechSynthesisVoice) => FEMALE_KEYWORDS.some(k => v.name.toLowerCase().includes(k)) || v.name.toLowerCase().includes('female');
      let chosen: SpeechSynthesisVoice | null = null;
      if (lang === "es") {
        const FEMALE_ES = ['Google español', 'Paulina', 'Monica', 'Google español de Estados Unidos', 'Microsoft Helena', 'Mónica', 'Microsoft Elvira Online (Natural)'];
        chosen = voices.find(v => FEMALE_ES.includes(v.name))
          ?? voices.find(v => v.lang.startsWith('es') && isFemale(v))
          ?? voices.find(v => v.lang.startsWith('es') && !isMale(v))
          ?? null;
        utterance.lang = 'es-ES';
      } else {
        const FEMALE_EN = ['Google UK English Female', 'Samantha', 'Karen', 'Tessa', 'Moira', 'Fiona', 'Google US English', 'Microsoft Zira', 'Microsoft Hazel', 'Zira', 'Microsoft Aria Online (Natural)', 'Microsoft Jenny Online (Natural)', 'Microsoft Libby Online (Natural)', 'Microsoft Sonia Online (Natural)'];
        chosen = voices.find(v => FEMALE_EN.some(n => v.name.startsWith(n)))
          ?? voices.find(v => v.lang.startsWith('en') && isFemale(v))
          ?? voices.find(v => v.lang.startsWith('en') && !isMale(v))
          ?? voices.find(v => isFemale(v)) ?? null;
        utterance.lang = 'en-GB';
      }
      if (chosen) utterance.voice = chosen;
      utterance.pitch = 1.1;
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  function handleTap() {
    if (demoDone) {
      resetDemo();
      return;
    }

    const task = tasks[demoIdx];
    setCurrentTask(task);
    setMascot(task.mascot);
    setSpeech(task.speech);
    setVoiceMsg(task.voice);
    setShowVoice(true);
    speak(task.voice, lang);

    if (voiceTimer.current) clearTimeout(voiceTimer.current);
    voiceTimer.current = setTimeout(() => setShowVoice(false), 3000);

    const newStars = "⭐".repeat(task.stars) + "☆".repeat(6 - task.stars);
    setStars(newStars);

    if (demoIdx < tasks.length - 1) {
      setDemoIdx(demoIdx + 1);
      setHint(lang === "es" ? "¡OTRA VEZ! 👆" : "TAP AGAIN! 👆");
    }
    if (demoIdx === tasks.length - 1) {
      setDemoDone(true);
      setHint(lang === "es" ? "¡LO LOGRASTE! 🏆" : "YOU DID IT! 🏆");
      setPulsing(false);
      if (confettiRef.current) spawnConfetti(confettiRef.current, confettiTimers);
    }
  }

  return (
    <div style={{ marginTop: 32, animation: "float 4s ease-in-out infinite, fadein 1s ease-out 1s both", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        ref={confettiRef}
        style={{
          width: 220, height: 440,
          background: "linear-gradient(180deg,#4facfe,#ff9a3c,#ff6b35)",
          borderRadius: 36,
          border: "6px solid rgba(255,255,255,0.9)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.3)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 8, overflow: "hidden",
          position: "relative",
          cursor: "pointer",
          transition: "transform 0.1s",
        }}
        onClick={handleTap}
      >
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 60, height: 6, background: "rgba(255,255,255,0.5)", borderRadius: 10 }} />
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 14, color: "white", opacity: 0.9 }}>GlowJo</div>
        <div style={{ fontSize: 64, animation: "mascot-bounce 1.5s ease-in-out infinite alternate" }}>{mascot}</div>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 13, color: "white", opacity: 0.9, textAlign: "center", maxWidth: "90%" }}>{currentTask.label}</div>
        <div style={{ fontSize: 16, letterSpacing: 2 }}>{stars}</div>
        {showVoice && <div style={{ fontSize: 11, color: "white", fontStyle: "italic", textAlign: "center", maxWidth: "90%", opacity: 0.8 }}>"{voiceMsg}"</div>}
        <div
          style={{
            width: 100, height: 100, borderRadius: "50%",
            background: "rgba(139,92,246,0.25)", border: "4px solid #8b5cf6",
            boxShadow: "0 0 20px rgba(139,92,246,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38,
            animation: pulsing ? "pulse 1s ease-in-out infinite" : "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 0 }}>
            <span style={{ fontSize: 30 }}>👍</span>
            <span style={{ fontSize: 30 }}>👍</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "white", fontWeight: 700, marginTop: 8 }}>{hint}</div>
        {lang === "es" && (
          <div style={{ position: "absolute", bottom: 12, right: 14, fontSize: 18, lineHeight: 1 }}>🇪🇸</div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingTier, setPendingTier] = useState<"starter" | "plus" | "gold" | null>(null);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 520);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 520);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const emailMutation = trpc.analytics.captureEmail.useMutation();
  const stripeCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false });

  const handleEmailCapture = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      await emailMutation.mutateAsync({ email });
      toast.success("Thanks! Check your email for updates.");
      setEmail("");
    } catch (error) {
      toast.error("Failed to capture email. Please try again.");
    }
  };

  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");

  const doCheckout = async (tier: "starter" | "plus" | "gold") => {
    setLoadingTier(tier);
    try {
      const session = await stripeCheckoutMutation.mutateAsync({ tier, billingPeriod });
      if (session?.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        toast.error("Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const msg = error?.message || error?.data?.message || "Failed to start checkout";
      toast.error(msg);
    } finally {
      setLoadingTier(null);
    }
  };

  const handleCheckout = (tier: "starter" | "plus" | "gold") => {
    if (!meQuery.data) {
      setPendingTier(tier);
      setAuthModalOpen(true);
    } else {
      doCheckout(tier);
    }
  };

  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);
    await meQuery.refetch();
    if (pendingTier) {
      const tier = pendingTier;
      setPendingTier(null);
      await doCheckout(tier);
    } else if (pendingNav) {
      const dest = pendingNav;
      setPendingNav(null);
      navigate(dest);
    }
  };

  const handleFreeStart = () => {
    if (meQuery.data) {
      navigate("/app");
    } else {
      setPendingNav("/app");
      setAuthModalOpen(true);
    }
  };

  // ✅ CLEANUP OBSERVERS
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    document.querySelectorAll(".reveal").forEach((el) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      }, { threshold: 0.1 });
      observer.observe(el);
      observers.push(observer);
    });
    
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <div style={{ background: "var(--soft)", color: "var(--dark)", fontFamily: "'Nunito', sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root {
          --sunrise-top:#4facfe;
          --sunrise-mid:#ff9a3c;
          --sunrise-bot:#ff6b35;
          --yellow:#ffd700;
          --coral:#ff5f1f;
          --dark:#1a1a1a;
          --cream:#fff8ee;
          --soft:#f5f0e8;
          --mid:#999;
        }
        @keyframes confetti-fall { to { transform: translateY(100vh) rotateZ(360deg); opacity: 0; } }
        @keyframes pulse { 0%,100%{box-shadow:0 0 20px rgba(255,95,31,0.5)} 50%{box-shadow:0 0 40px rgba(255,95,31,0.8)} }
        @keyframes mascot-bounce { 0%{transform:scale(1)} 100%{transform:scale(1.1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadein { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sun-rise { 0%{transform:translateX(-50%) translateY(60px);opacity:0} 100%{transform:translateX(-50%) translateY(0px);opacity:1} }
        @keyframes drift { from{transform:translateX(-100px)} to{transform:translateX(110vw)} }
        .reveal { opacity:0; }
        .reveal.visible { animation:fadein 0.6s ease-out forwards; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? "12px 12px" : "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,248,238,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,154,60,0.2)" }}>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: "var(--coral)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--mid)", fontWeight: 900, letterSpacing: 0.5 }}>Get</span>
          <span>Glow<span style={{ color: "var(--dark)" }}>Jo</span></span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 0 }}>
            <span style={{ fontSize: 16 }}>👍</span>
            <span style={{ fontSize: 16 }}>👍</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isMobile && (
            <button onClick={() => navigate("/help")} style={{ fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 700, padding: "8px 16px", borderRadius: 30, border: "1px solid rgba(255,95,31,0.25)", cursor: "pointer", background: "transparent", color: "var(--coral)" }}>
              Help
            </button>
          )}
          {!isMobile && !meQuery.data && (
            <button onClick={() => setAuthModalOpen(true)} style={{ fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 700, padding: "8px 16px", borderRadius: 30, border: "1px solid rgba(255,95,31,0.25)", cursor: "pointer", background: "transparent", color: "var(--coral)" }}>
              Sign In
            </button>
          )}
          <button onClick={() => {
            if (meQuery.data) { navigate("/app"); }
            else { setPendingNav("/app"); setAuthModalOpen(true); }
          }} style={{ fontFamily: "'Fredoka One',cursive", fontSize: isMobile ? 13 : 15, padding: isMobile ? "8px 14px" : "9px 22px", borderRadius: 30, border: "none", cursor: "pointer", background: "linear-gradient(135deg,var(--coral),var(--sunrise-mid))", color: "white", boxShadow: "0 4px 14px rgba(255,95,31,0.35)", transition: "transform 0.15s, box-shadow 0.15s" }}>
            {meQuery.data ? "My App ☀️" : "Get Started"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", background: "linear-gradient(180deg, var(--sunrise-top) 0%, var(--sunrise-mid) 60%, var(--sunrise-bot) 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "100px 24px 60px", position: "relative", overflow: "hidden", marginTop: 60 }}>
        <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, #ffe566 0%, #ffb830 50%, rgba(255,154,60,0) 70%)", animation: "sun-rise 3s ease-out forwards", opacity: 0 }} />
        <div style={{ position: "absolute", fontSize: 56, opacity: 0.18, animation: "drift linear infinite", top: "12%", left: "-60px", animationDuration: "18s", animationDelay: "0s" }}>☁️</div>
        <div style={{ position: "absolute", fontSize: 48, opacity: 0.18, animation: "drift linear infinite", top: "22%", left: "-80px", animationDuration: "24s", animationDelay: "5s" }}>☁️</div>
        <div style={{ position: "absolute", fontSize: 36, opacity: 0.18, animation: "drift linear infinite", top: "8%", left: "-40px", animationDuration: "20s", animationDelay: "10s" }}>☁️</div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.5)", padding: "6px 16px", borderRadius: 30, fontSize: 13, fontWeight: 700, color: "white", marginBottom: 24, animation: "fadein 0.8s ease-out 0.3s both" }}>
          ⭐ Trusted by 50K+ families
        </div>

        <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(42px,10vw,80px)", color: "white", lineHeight: 1.1, textShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "fadein 0.8s ease-out 0.5s both", maxWidth: 800 }}>
          Brush teeth?<em style={{ fontStyle: "normal", color: "var(--yellow)", display: "block" }}>Kids beg to.</em>
        </h1>

        <div style={{ fontSize: "clamp(18px,4vw,24px)", color: "rgba(255,255,255,0.92)", fontWeight: 700, marginTop: 20, maxWidth: 560, lineHeight: 1.5, animation: "fadein 0.8s ease-out 0.7s both" }}>
          Stop being the alarm clock. GlowJo turns chaotic school mornings into a game kids actually want to play.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 36, animation: "fadein 0.8s ease-out 0.9s both" }}>
          <button onClick={handleFreeStart} style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, padding: "16px 40px", borderRadius: 50, cursor: "pointer", background: "white", color: "#ff5f1f", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", transition: "transform 0.15s" }}>
            Try 3 Mornings Free ☀️
          </button>
          <button onClick={handleFreeStart} style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, padding: "16px 36px", borderRadius: 50, cursor: "pointer", background: "rgba(255,255,255,0.2)", color: "white", border: "2px solid rgba(255,255,255,0.6)", transition: "background 0.15s" }}>
            See Demo
          </button>
        </div>

        <div style={{ marginTop: 32, color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 700, animation: "fadein 0.8s ease-out 1.1s both" }}>
          <span style={{ color: "var(--yellow)", fontSize: 16, letterSpacing: 2 }}>★★★★★</span> 4.9/5 from 2,000+ reviews
        </div>

        {/* Welcome cards — warm & visual, no chore list */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 40, animation: "fadein 0.8s ease-out 1.3s both" }}>
          {[
            { emoji: "🌟", label: "Earn Stars" },
            { emoji: "🎵", label: "Fun Music" },
            { emoji: "🏆", label: "Win Rewards" },
            { emoji: "💛", label: "Happy Mornings" },
          ].map((card, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.35)", borderRadius: 20, padding: "18px 22px", textAlign: "center", backdropFilter: "blur(8px)", minWidth: 100 }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>{card.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: 0.5 }}>{card.label}</div>
            </div>
          ))}
        </div>

      </section>

      {/* PAIN SECTION */}
      <section style={{ background: "var(--dark)", color: "var(--cream)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "var(--coral)", marginBottom: 12 }}>The Problem</div>
          <h2 className="reveal" style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(30px,6vw,52px)", color: "var(--cream)", lineHeight: 1.2, marginBottom: 16 }}>
            Mornings are chaos.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 20, marginTop: 40 }}>
            {[
              { icon: "⏰", title: "The Alarm Clock Parent", text: "You're nagging, reminding, and yelling. Kids tune you out." },
              { icon: "😤", title: "Power Struggles", text: "Every task is a battle. Brushing teeth? Forget it." },
              { icon: "🏫", title: "Late to School", text: "Rushing = stress. Stress = kids can't focus all day." },
              { icon: "😰", title: "Cortisol Overload", text: "Chaotic mornings flood kids' brains with stress hormones." },
              { icon: "📱", title: "Screen Wars", text: "Getting kids off devices to do anything else feels impossible." },
              { icon: "🌀", title: "No System", text: "What worked yesterday fails today. There's no reliable routine." },
            ].map((item, i) => (
              <div key={i} className="reveal" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, transition: "transform 0.2s" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "var(--yellow)", marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 15, color: "rgba(255,248,238,0.7)", lineHeight: 1.6 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "var(--soft)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "var(--coral)", marginBottom: 12 }}>How It Works</div>
          <h2 className="reveal" style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(30px,6vw,52px)", color: "var(--dark)", lineHeight: 1.2, marginBottom: 16 }}>
            3 steps to peaceful mornings.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 32, marginTop: 48 }}>
            {[
              { num: "1", emoji: "📱", title: "Download", text: "Free app for iOS & Android. No account needed." },
              { num: "2", emoji: "🎮", title: "Set Up Tasks", text: "Choose 3–6 morning tasks. Kids see fun emojis, not chores." },
              { num: "3", emoji: "⭐", title: "Earn Stars", text: "Each task = stars. Streaks = rewards. Kids love it." },
            ].map((step, i) => (
              <div key={i} className="reveal" style={{ textAlign: "center", animation: `fadein 0.6s ease-out both`, animationDelay: `${0.1 + i * 0.1}s` }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,var(--coral),var(--sunrise-mid))", color: "white", fontFamily: "'Fredoka One',cursive", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 6px 20px rgba(255,95,31,0.3)" }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{step.emoji}</div>
                <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: "var(--dark)", marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 15, color: "var(--mid)", lineHeight: 1.6 }}>{step.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "linear-gradient(180deg,var(--sunrise-top) 0%,var(--sunrise-mid) 100%)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "var(--yellow)", marginBottom: 12 }}>Features</div>
          <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(30px,6vw,52px)", color: "white", lineHeight: 1.2, marginBottom: 16 }}>
            Packed with what families need.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, marginTop: 40 }}>
            {[
              { icon: "🎤", title: "AI Voice", text: "Sunny's warm, encouraging voice guides every task.", badge: "GLOWJO" },
              { icon: "🎵", title: "Happy Music", text: "A different song every day keeps mornings fun and fresh.", badge: "GLOWJO" },
              { icon: "🌍", title: "Bilingual", text: "English + Spanish. Perfect for multilingual families.", badge: "GLOWJO" },
              { icon: "🔒", title: "Parent Dashboard", text: "PIN-protected parent view with progress tracking.", badge: "FREE" },
              { icon: "🎙️", title: "Mum's Voice", text: "Record your own voice for each task. Kids love hearing you instead of AI!", badge: "GLOWJO" },
              { icon: "⭐", title: "Stars & Rewards", text: "Kids earn stars every morning and unlock custom rewards.", badge: "FREE" },
            ].map((feat, i) => (
              <div key={i} className="reveal" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: 24, backdropFilter: "blur(8px)", transition: "transform 0.2s" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{feat.icon}</div>
                <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, color: "white", marginBottom: 8 }}>{feat.title}</div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, marginBottom: 12 }}>{feat.text}</div>
                <div style={{ fontSize: 11, fontWeight: 900, padding: "4px 12px", borderRadius: 20, background: feat.badge.includes("FREE") ? "rgba(255,255,255,0.2)" : "var(--yellow)", color: feat.badge.includes("FREE") ? "white" : "var(--dark)", display: "inline-block" }}>
                  {feat.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: "var(--soft)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "var(--coral)", marginBottom: 12 }}>Testimonials</div>
          <h2 className="reveal" style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(30px,6vw,52px)", color: "var(--dark)", lineHeight: 1.2, marginBottom: 16 }}>
            Parents love it.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 24, marginTop: 40 }}>
            {[
              { text: "We went from 45 minutes of screaming to 15 minutes of happy. The voice feature is MAGIC.", author: "Maria G., Mom · Orlando, FL", stars: 5 },
              { text: "My kids actually RUN to do their morning tasks now. I can't believe it works.", author: "James K., Dad · Seattle, WA", stars: 5 },
              { text: "As a bilingual family, this is EXACTLY what we needed. English AND Spanish voices!", author: "Sofia M., Mom · Miami, FL", stars: 5 },
              { text: "The parent dashboard is so helpful. I can see exactly what my kids completed.", author: "David L., Dad · Austin, TX", stars: 5 },
              { text: "My ADHD kid finally has a system that works. No more battles.", author: "Jennifer P., Mom · Denver, CO", stars: 5 },
              { text: "Worth every penny. Our mornings are peaceful for the first time in years.", author: "Robert T., Dad · Boston, MA", stars: 5 },
              { text: "I love when my child gives me the double thumbs up — he is so pleased with himself. It melts my heart every single morning.", author: "Proud Mum · London, UK", stars: 5 },
            ].map((testi, i) => (
              <div key={i} className="reveal" style={{ background: "white", border: "1px solid rgba(255,154,60,0.2)", borderRadius: 20, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", textAlign: "left" }}>
                <div style={{ fontSize: 14, color: "var(--yellow)", marginBottom: 12, letterSpacing: 2 }}>{"⭐".repeat(testi.stars)}</div>
                <div style={{ fontSize: 15, color: "var(--dark)", lineHeight: 1.6, marginBottom: 12, fontStyle: "italic" }}>"{testi.text}"</div>
                <div style={{ fontSize: 13, color: "var(--mid)", fontWeight: 700 }}>— {testi.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background: "var(--dark)", color: "var(--cream)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "var(--coral)", marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(30px,6vw,52px)", color: "var(--cream)", lineHeight: 1.2, marginBottom: 16 }}>
              Start free. Upgrade anytime.
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,248,238,0.7)", maxWidth: 600, margin: "0 auto 28px" }}>
              Try Freemium free forever. Upgrade to unlock voice, bilingual, and more kids.
            </p>

            {/* Billing toggle */}
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: 50, padding: 4, gap: 4 }}>
              <button
                onClick={() => setBillingPeriod("month")}
                style={{ padding: "8px 22px", borderRadius: 50, border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, transition: "all 0.2s", background: billingPeriod === "month" ? "white" : "transparent", color: billingPeriod === "month" ? "var(--coral)" : "rgba(255,248,238,0.6)" }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("year")}
                style={{ padding: "8px 22px", borderRadius: 50, border: "none", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, transition: "all 0.2s", background: billingPeriod === "year" ? "white" : "transparent", color: billingPeriod === "year" ? "var(--coral)" : "rgba(255,248,238,0.6)", display: "flex", alignItems: "center", gap: 6 }}
              >
                Yearly
                <span style={{ background: "#4ade80", color: "#14532d", fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 20 }}>SAVE 33%</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 24 }}>
            {[
              { name: "Freemium", features: ["1 child profile", "Basic task tracking", "Parent dashboard", "2 days of happy music"], cta: "Get Started Free", highlight: false, badge: null, tier: null },
              { name: "GlowJo", features: ["Everything in Free", "Up to 3 child profiles", "🎤 AI voice guidance — Sunny speaks!", "🌍 Bilingual — English + Spanish", "🎵 Happy music every morning (7 days)", "🎙️ Mum's Voice — record your own", "⭐ Stars, streaks & weekly rewards", "Parent dashboard with progress tracking", "Priority support"], cta: "Get GlowJo", highlight: true, badge: "⭐ Full Access", tier: "starter" },
            ].map((plan, i) => {
              const isGlowJo = plan.tier === "starter";
              const priceDisplay = !isGlowJo
                ? "Free forever"
                : billingPeriod === "month"
                ? "$4.99/month"
                : "$39.99/year";
              const subText = isGlowJo && billingPeriod === "year"
                ? "Just $3.33/month — 2 months free! 🎉"
                : isGlowJo
                ? "Billed monthly, cancel anytime"
                : null;

              return (
              <div key={i} style={{ position: "relative", background: plan.highlight ? "linear-gradient(135deg,var(--coral),var(--sunrise-mid))" : "rgba(255,255,255,0.06)", border: plan.highlight ? "2px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "36px 28px 28px", textAlign: "center", transform: plan.highlight ? "scale(1.05)" : "scale(1)", transition: "transform 0.2s", boxShadow: plan.highlight ? "0 12px 40px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.15)" }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: plan.highlight ? "white" : "var(--yellow)", color: plan.highlight ? "var(--coral)" : "#333", borderRadius: 30, padding: "4px 16px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, marginBottom: 6, color: plan.highlight ? "white" : "var(--cream)" }}>{plan.name}</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: plan.highlight ? "white" : "var(--yellow)" }}>{priceDisplay}</div>
                {subText && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: billingPeriod === "year" ? "#a7f3d0" : "rgba(255,255,255,0.7)", marginTop: 4, marginBottom: 20 }}>
                    {subText}
                  </div>
                )}
                <div style={{ height: subText ? 0 : 24 }} />
                <div style={{ textAlign: "left", marginBottom: 28 }}>
                  {plan.features.map((feat, j) => (
                    <div key={j} style={{ fontSize: 14, marginBottom: 10, color: plan.highlight ? "rgba(255,255,255,0.95)" : "rgba(255,248,238,0.75)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: plan.highlight ? "white" : "var(--yellow)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {feat}
                    </div>
                  ))}
                </div>
                <button
                  disabled={loadingTier !== null}
                  onClick={() => plan.tier === null ? handleFreeStart() : handleCheckout(plan.tier as "starter")}
                  style={{ width: "100%", padding: "13px 24px", borderRadius: 30, border: "none", fontFamily: "'Fredoka One',cursive", fontSize: 16, fontWeight: 700, cursor: loadingTier !== null ? "wait" : "pointer", background: plan.highlight ? "white" : "rgba(255,255,255,0.18)", color: plan.highlight ? "var(--coral)" : "white", transition: "opacity 0.2s", opacity: loadingTier !== null && loadingTier !== plan.tier ? 0.5 : 1 }}
                >
                  {plan.tier !== null && loadingTier === plan.tier ? "Opening Stripe…" : plan.cta}
                </button>
              </div>
              );
            })}
          </div>
          <div style={{ marginTop: 32, fontSize: 14, color: "var(--mid)" }}>
            No credit card required • Cancel anytime • 7-day free trial
          </div>
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section style={{ background: "linear-gradient(135deg,var(--coral),var(--sunrise-mid))", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(28px,5vw,44px)", color: "white", lineHeight: 1.2, marginBottom: 16 }}>
            Join 50K+ families
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", marginBottom: 24 }}>
            Get tips, updates, and exclusive offers delivered to your inbox.
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, padding: "12px 16px", borderRadius: 30, border: "none", fontSize: 14, fontFamily: "'Nunito', sans-serif" }}
            />
            <button onClick={handleEmailCapture} style={{ padding: "12px 28px", borderRadius: 30, border: "none", background: "white", color: "var(--coral)", fontFamily: "'Fredoka One',cursive", fontWeight: 900, cursor: "pointer", transition: "transform 0.15s" }}>
              Join
            </button>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>We respect your privacy. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "var(--dark)", color: "var(--cream)", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "var(--coral)", marginBottom: 16 }}>Glow<span style={{ color: "var(--cream)" }}>Jo</span></div>
          <p style={{ fontSize: 14, color: "rgba(255,248,238,0.6)", marginBottom: 16 }}>
            Turning chaotic mornings into peaceful routines, one star at a time.
          </p>
          <div style={{ fontSize: 12, color: "rgba(255,248,238,0.4)" }}>
            © 2026 GetGlowJo. All rights reserved. | Privacy Policy | Terms of Service
          </div>
        </div>
      </footer>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
