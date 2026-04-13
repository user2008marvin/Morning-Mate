import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronRight, Sparkles, ArrowLeft, RefreshCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { SplitImage } from "@/components/SplitImage";
import { DemoDashboard } from "@/components/DemoDashboard";
import { PricingSection } from "@/components/PricingSection";
import { AuthModal } from "@/components/AuthModal";
import { cn, fileToScaledDataUrl } from "@/lib/utils";
import { simulateMakeup } from "@/lib/makeup-simulator";
import { useCreateSubmission } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const OCCASIONS = [
  { id: "wedding", name: "Wedding Guest", icon: "💍", desc: "Romantic & refined" },
  { id: "date", name: "Date Night", icon: "🌹", desc: "Sultry & captivating" },
  { id: "nightout", name: "Night Out", icon: "✨", desc: "Bold & luminous" },
  { id: "work", name: "Work / Professional", icon: "👔", desc: "Polished & confident" },
  { id: "everyday", name: "Everyday Natural", icon: "🌸", desc: "Fresh & effortless" },
  { id: "photo", name: "Photoshoot / Event", icon: "📸", desc: "Striking & editorial" }
];

const SKIN_TONES = [
  { id: "fair", label: "Fair", color: "#FDDBB4", desc: "Porcelain & light" },
  { id: "light", label: "Light", color: "#F5C89B", desc: "Ivory & warm" },
  { id: "medium", label: "Medium", color: "#D4956A", desc: "Warm beige" },
  { id: "tan", label: "Tan", color: "#B07D52", desc: "Golden brown" },
  { id: "deep", label: "Deep", color: "#7C4D2F", desc: "Rich brown" },
  { id: "rich", label: "Rich", color: "#3E2010", desc: "Deep ebony" }
];

const LOOKS: Record<string, { name: string, prompt: string, desc: string }[]> = {
  "wedding": [
    { name: "Romantic Blush", desc: "Soft pink, dewy skin, subtle glow, light lashes", prompt: "A dreamy romantic makeup look with soft pink blush draped over the cheekbones, a sheer dewy foundation, subtle pearlescent highlighter, and light fluttery lashes." },
    { name: "Classic Elegance", desc: "Neutral nude, defined brows, champagne shadow", prompt: "A timeless elegant makeup look with a neutral nude palette, sharply defined natural brows, a wash of champagne eyeshadow, and volumizing mascara." }
  ],
  "date": [
    { name: "Smoky Seduction", desc: "Deep smoky eye, berry lip, subtle highlight", prompt: "A seductive date night look featuring a deep diffused smoky eye, soft berry stained lips, perfectly groomed brows, and a subtle candlelit highlighter." },
    { name: "Red Lip Classic", desc: "Bold red lip, minimal eye, clean base", prompt: "The ultimate classic beauty look with a bold true-red matte lip, minimal eyeshadow, a flawless clean matte base, and separated defined lashes." }
  ],
  "nightout": [
    { name: "Glitter Glam", desc: "Holographic highlight, glitter lid, glossy nude lip", prompt: "A bold party look with high-impact holographic highlighter, a pressed glitter lid, sharp dark eyeliner, and a high-shine glossy nude lip." },
    { name: "Bold Cut Crease", desc: "Sharp cut crease, contoured, matte lip", prompt: "A dramatic makeup look featuring a sharp precise cut crease eyeshadow, strong sculpted contouring, blinding highlight, and a velvet matte lip." }
  ],
  "work": [
    { name: "Clean Executive", desc: "Neutral lids, natural brow, soft contour, nude lip", prompt: "A highly polished professional look with matte neutral eyelids, natural feathered brows, a very soft seamless contour, and a hydrating nude lip." },
    { name: "Soft Power", desc: "Warm bronze eye, groomed brows, terracotta lip", prompt: "A confident sophisticated makeup style with a warm bronze wash over the eyes, perfectly groomed brows, soft coral blush, and a sheer terracotta lip." }
  ],
  "everyday": [
    { name: "No-Makeup Makeup", desc: "Light coverage, clear brow gel, lip balm", prompt: "An effortless natural beauty look emphasizing skincare, with light sheer coverage, brushed up brows with clear gel, and a hydrating tinted lip balm." },
    { name: "Fresh Dewy", desc: "Dewy skin, pink blush, subtle highlight", prompt: "A fresh glowing complexion with an ultra-dewy foundation finish, a pop of bright pink cream blush, subtle liquid highlight, and a juicy glossy lip." }
  ],
  "photo": [
    { name: "Editorial Drama", desc: "Graphic liner, bold mono lid, sharp contour", prompt: "A striking editorial makeup look featuring sharp graphic black eyeliner, a bold monochromatic eyelid color, aggressive sculpted contour, and a muted matte lip." },
    { name: "Golden Hour Glow", desc: "Warm bronze everywhere, gold highlight, peachy lip", prompt: "A sun-drenched photoshoot look with warm bronze tones across the cheeks and eyes, a rich metallic gold highlighter, amber shadow, and a soft peachy lip." }
  ]
};

type DemoStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | "dashboard";

const STEP_LABELS = ["Occasion", "Look", "Skin Tone", "Photo", "Details", "Result"];

export default function Home() {
  const { toast } = useToast();
  const { user, isLoading, demoCompleted, markDemoComplete, setPlan } = useAuth();

  const [step, setStep] = useState<DemoStep>(0);

  useEffect(() => {
    if (!isLoading && !user && demoCompleted) {
      setStep("dashboard");
    }
  }, [isLoading, user, demoCompleted]);

  const [occasion, setOccasion] = useState("");
  const [look, setLook] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<"freemium" | "paid" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const { mutateAsync: createSubmission } = useCreateSubmission();

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartDemo = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOccasionSelect = (id: string) => {
    setOccasion(id);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLookSelect = (lookName: string) => {
    setLook(lookName);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkinToneSelect = (id: string) => {
    setSkinTone(id);
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToScaledDataUrl(file);
      setPhotoUrl(dataUrl);
    } catch {
      toast({ title: "Error", description: "Could not load image", variant: "destructive" });
    }
  };

  const handlePhotoConfirm = () => {
    if (!photoUrl) return;
    setStep(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const simulatedUrl = await simulateMakeup(photoUrl, look);
      setAfterUrl(simulatedUrl);

      createSubmission({
        data: {
          occasion,
          look,
          firstName: firstName || null,
          email: email || null,
          imageDataUrl: photoUrl
        }
      }).catch(() => {});

      setStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast({ title: "Processing Failed", description: "Could not apply makeup simulation.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoComplete = () => {
    if (!user) {
      markDemoComplete();
    }
    setStep("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectPlan = (plan: "freemium" | "paid") => {
    if (user) {
      setPlan(plan);
      setStep(0);
      return;
    }
    setPendingPlan(plan);
    setAuthOpen(true);
  };

  const handleAuthSuccess = () => {
    if (pendingPlan) {
      setPlan(pendingPlan);
      setPendingPlan(null);
      setStep(0);
      setTimeout(() => {
        const el = document.getElementById("pricing");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  };

  const selectedLookDetails = occasion && look ? LOOKS[occasion]?.find((l) => l.name === look) : null;
  const selectedOccasionObj = OCCASIONS.find((o) => o.id === occasion);
  const selectedSkinToneObj = SKIN_TONES.find((s) => s.id === skinTone);
  const isDemoActive = typeof step === "number" && step >= 1 && step <= 6;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-28 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">

          {/* ── LANDING HERO ── */}
          {step === 0 && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center space-y-8 py-16"
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold tracking-wide uppercase"
              >
                AI Makeup Simulator
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-5xl md:text-6xl lg:text-7xl font-serif text-foreground leading-tight"
              >
                Your face. <br />
                <span className="text-primary italic">Your occasion.</span>
                <br />
                Your perfect look.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed"
              >
                Find makeup curated for your occasion, then try it on your own face in seconds — powered by AI.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
              >
                <Button
                  size="lg"
                  className="h-13 px-8 text-base font-semibold rounded-full shadow-lg shadow-primary/20"
                  onClick={scrollToPricing}
                >
                  Get Started
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-13 px-8 text-base font-semibold rounded-full border-primary/30 text-primary"
                  onClick={handleStartDemo}
                >
                  Try Demo
                  <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-6 max-w-sm mx-auto pt-8"
              >
                {[
                  { label: "Occasions", value: "6+" },
                  { label: "AI Looks", value: "12+" },
                  { label: "Instant", value: "Results" }
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-serif font-bold text-primary">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ── DEMO FLOW — Steps 1–6 ── */}
          {isDemoActive && (
            <motion.div
              key="demo-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              {/* Progress Tracker */}
              <div className="flex items-center justify-center mb-12 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                        (step as number) > i ? "bg-primary text-white" :
                        step === i ? "bg-primary text-white ring-4 ring-primary/20" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {(step as number) > i ? "✓" : i}
                      </div>
                      <span className={cn(
                        "text-xs font-medium hidden sm:block",
                        step === i ? "text-primary" : "text-muted-foreground"
                      )}>
                        {STEP_LABELS[i - 1]}
                      </span>
                    </div>
                    {i < 6 && (
                      <div className={cn(
                        "w-8 sm:w-14 h-0.5 mx-1 mb-5 rounded-full transition-colors duration-300",
                        (step as number) > i ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* STEP 1 — OCCASION */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                      <h2 className="text-4xl md:text-5xl font-serif">What's the occasion?</h2>
                      <p className="text-lg text-muted-foreground">Pick your event and we'll curate the perfect looks for it.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                      {OCCASIONS.map((occ) => (
                        <button
                          key={occ.id}
                          onClick={() => handleOccasionSelect(occ.id)}
                          className="group relative bg-card rounded-3xl p-6 text-left border border-card-border shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary">
                            <ChevronRight size={24} />
                          </div>
                          <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">
                            {occ.icon}
                          </div>
                          <h3 className="text-xl font-serif font-semibold text-foreground mb-1">{occ.name}</h3>
                          <p className="text-muted-foreground text-sm">{occ.desc}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 — LOOK */}
                {step === 2 && occasion && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-4xl mx-auto space-y-8"
                  >
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Occasions
                    </button>

                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
                        {selectedOccasionObj?.icon} {selectedOccasionObj?.name}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-serif">Choose your look.</h2>
                      <p className="text-muted-foreground">Two expertly curated looks for this occasion.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mt-6">
                      {LOOKS[occasion]?.map((l, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleLookSelect(l.name)}
                          className="group bg-card rounded-3xl p-8 border border-card-border shadow-md hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40 transition-all duration-500 text-left flex flex-col justify-between min-h-[260px] relative overflow-hidden"
                        >
                          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
                          <div>
                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                              <Sparkles size={24} />
                            </div>
                            <h3 className="text-2xl font-serif font-semibold mb-2">{l.name}</h3>
                            <p className="text-muted-foreground leading-relaxed">{l.desc}</p>
                          </div>
                          <div className="mt-6 flex items-center text-primary font-medium">
                            Select Look <ChevronRight className="ml-2 w-5 h-5 transform group-hover:translate-x-2 transition-transform" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3 — SKIN TONE */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-3xl mx-auto space-y-8"
                  >
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Looks
                    </button>

                    <div className="text-center space-y-3">
                      <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold tracking-wide uppercase">
                        Personalise your look
                      </div>
                      <h2 className="text-3xl md:text-4xl font-serif">What's your skin tone?</h2>
                      <p className="text-muted-foreground">We'll tailor every shade perfectly for you.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-6">
                      {SKIN_TONES.map((tone) => (
                        <button
                          key={tone.id}
                          onClick={() => handleSkinToneSelect(tone.id)}
                          className="group bg-card rounded-2xl p-5 border border-card-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col items-center gap-3 hover:-translate-y-1"
                        >
                          <div
                            className="w-14 h-14 rounded-full shadow-inner border-4 border-white group-hover:scale-110 transition-transform duration-300"
                            style={{ backgroundColor: tone.color }}
                          />
                          <div className="text-center">
                            <p className="font-serif font-semibold text-foreground">{tone.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{tone.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4 — UPLOAD PHOTO */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-2xl mx-auto"
                  >
                    <button
                      onClick={() => setStep(3)}
                      className="flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-8"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Skin Tone
                    </button>

                    <div className="bg-card rounded-3xl p-8 md:p-10 shadow-xl border border-card-border">
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 mb-3">
                          <div
                            className="w-5 h-5 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: selectedSkinToneObj?.color }}
                          />
                          <span className="text-sm text-muted-foreground font-medium">
                            {selectedSkinToneObj?.label} skin · {look}
                          </span>
                        </div>
                        <h2 className="text-3xl font-serif mb-2">Upload your photo</h2>
                        <p className="text-muted-foreground">We'll apply your <span className="font-semibold text-foreground">"{look}"</span> look, tailored to your skin tone.</p>
                      </div>

                      {!photoUrl ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 hover:border-primary/60 transition-all duration-300 group"
                        >
                          <div className="w-20 h-20 rounded-full bg-white shadow flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Camera size={32} />
                          </div>
                          <p className="font-medium text-lg">Tap to take or upload a photo</p>
                          <p className="text-sm text-muted-foreground mt-2">Front-facing portraits work best</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                            <img src={photoUrl} alt="Upload preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => { setPhotoUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm p-2 rounded-full transition-colors"
                            >
                              <RefreshCcw size={18} />
                            </button>
                          </div>
                          <Button onClick={handlePhotoConfirm} className="w-full h-12 text-base">
                            Use This Photo <ChevronRight className="ml-2 w-5 h-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 5 — YOUR DETAILS */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-2xl mx-auto"
                  >
                    <button
                      onClick={() => setStep(4)}
                      className="flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-8"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Photo
                    </button>

                    <div className="bg-card rounded-3xl p-8 md:p-10 shadow-xl border border-card-border space-y-7">
                      <div className="text-center">
                        <h2 className="text-3xl font-serif mb-2">Almost there!</h2>
                        <p className="text-muted-foreground">
                          Add your details to save your results — or skip ahead.{" "}
                          <span className="text-sm">(optional)</span>
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground ml-1">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 text-base"
                            placeholder="Your name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-foreground ml-1">Email Address</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 text-base"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="w-full h-14 text-lg font-semibold"
                      >
                        {isProcessing ? (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                            Applying Your Look…
                          </>
                        ) : (
                          <>
                            Try On Look <Sparkles className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Your photo is processed locally and never stored without your consent.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 6 — RESULT */}
                {step === 6 && afterUrl && (
                  <motion.div
                    key="step6"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-5xl mx-auto space-y-12"
                  >
                    <div className="text-center space-y-4">
                      <h2 className="text-4xl md:text-5xl font-serif italic text-primary">
                        {firstName ? `Stunning, ${firstName}.` : "Gorgeous."}
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Drag the slider to reveal your{" "}
                        <span className="font-semibold text-foreground">"{look}"</span> transformation.
                      </p>
                    </div>

                    <SplitImage beforeSrc={photoUrl} afterSrc={afterUrl} />

                    <div className="bg-card rounded-3xl p-8 border border-primary/20 shadow-xl shadow-primary/5 max-w-3xl mx-auto relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
                      <div className="relative space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                          <div
                            className="w-5 h-5 rounded-full border-2 border-primary/30 shrink-0"
                            style={{ backgroundColor: selectedSkinToneObj?.color }}
                          />
                          <Sparkles size={18} />
                          <h3 className="font-serif text-2xl font-semibold">Makeup Recipe: {look}</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {selectedLookDetails?.prompt}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tailored for <span className="font-medium text-foreground">{selectedSkinToneObj?.label}</span> skin
                          {" · "}{selectedOccasionObj?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 pt-4 pb-8">
                      <Button size="lg" onClick={handleDemoComplete} className="px-12 h-14 text-lg font-semibold">
                        Go to Mum's Dashboard
                        <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Your demo is complete — see your dashboard and choose a plan.
                      </p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

          {/* ── MUM'S DASHBOARD ── */}
          {step === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto pb-16"
            >
              <DemoDashboard
                look={look || "your look"}
                occasion={occasion}
                firstName={firstName}
                onSelectFreemium={() => handleSelectPlan("freemium")}
                onSelectPaid={() => handleSelectPlan("paid")}
              />
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── PRICING SECTION — always at bottom ── */}
        <div ref={pricingRef} className="max-w-5xl mx-auto">
          <PricingSection
            onSelectFreemium={() => handleSelectPlan("freemium")}
            onSelectPaid={() => handleSelectPlan("paid")}
          />
        </div>
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => { setAuthOpen(false); setPendingPlan(null); }}
        onSuccess={handleAuthSuccess}
        initialMode="register"
      />
    </div>
  );
}
