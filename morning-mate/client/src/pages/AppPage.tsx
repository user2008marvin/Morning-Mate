/**
 * GlowJo — Full App Page
 * Design: Storybook Warmth / Illustrated World
 * Screens: Onboarding → Kid Main → Win Screen → Parent Dashboard (PIN-protected)
 * Features: ElevenLabs TTS (with browser fallback), bilingual EN/ES, localStorage persistence
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// ── CONSTANTS ──
const EL_VOICE_ID = "9BWtsMINqrJLrRacOk9x"; // Alice - Warm & Encouraging
// API key is now handled by backend proxy at /api/trpc/tts.speak
// NEVER hardcode API keys in frontend

const TASKS_EN = [
  { emoji: "☀️", label: "WAKE UP!", voice_en: "Rise and shine superstar! You got this!", voice_es: "¡Levántate, superestrella! ¡Tú puedes!", sticker: "⭐" },
  { emoji: "🪥", label: "BRUSH TEETH!", voice_en: "Shiniest smile in the whole world! Great job!", voice_es: "¡La sonrisa más brillante del mundo! ¡Muy bien!", sticker: "✨" },
  { emoji: "🛁", label: "SHOWER TIME!", voice_en: "Clean champion coming through! Looking great!", voice_es: "¡Campeón limpio en camino! ¡Qué bien te ves!", sticker: "🌟" },
  { emoji: "🥛", label: "EAT BREAKFAST!", voice_en: "Fuel up! You are a rocket today!", voice_es: "¡Recarga energía! ¡Eres un cohete hoy!", sticker: "💫" },
  { emoji: "👕", label: "GET DRESSED!", voice_en: "Looking sharp! You are ready to shine!", voice_es: "¡Luces genial! ¡Estás listo para brillar!", sticker: "🌈" },
  { emoji: "🚀", label: "LET'S GO!", voice_en: "Daily winner! You are absolutely LEGENDARY!", voice_es: "¡Ganador del día! ¡Eres absolutamente LEGENDARIO!", sticker: "🏆" },
];

const REWARDS = [
  "🍦 Ice Cream Friday", "🎬 Movie Night", "🍕 Pizza Night",
  "🎮 Extra Game Time", "🛝 Park Trip", "⭐ Choose Dinner"
];

const WIN_STICKERS = ["⭐", "🌟", "💫", "✨", "🎯", "🏆", "🦁", "🦊", "🐯", "🦅", "🌈", "🎨"];

type Screen = "onboarding" | "main" | "win" | "parent";
type Language = "en" | "es";

interface AppState {
  childName: string;
  age: number;
  schoolTime: string;
  reward: string;
  enabledTasks: boolean[];
  pin: string;
  stars: number;
  streak: number;
  language: Language;
  completedDays: number[];
  weekDays: boolean[];
  lastDate: string;
  stickersUnlocked: string[];
}

const DEFAULT_STATE: AppState = {
  childName: "",
  age: 6,
  schoolTime: "08:30",
  reward: REWARDS[0],
  enabledTasks: [true, true, true, true, true, true],
  pin: "1234",
  stars: 0,
  streak: 0,
  language: "en",
  completedDays: [],
  weekDays: [false, false, false, false, false, false, false],
  lastDate: "",
  stickersUnlocked: ["⭐"],
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem("MM_State_v2");
    if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_STATE };
}

function saveState(state: AppState) {
  localStorage.setItem("MM_State_v2", JSON.stringify(state));
}

// ── CONFETTI ──
function spawnConfetti(container: HTMLElement) {
  const colors = ["#ff5f1f", "#ffd700", "#4facfe", "#ff9a3c", "#ff6b35", "#fff", "#ff69b4"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    const size = 6 + Math.random() * 10;
    el.style.cssText = `
      position:absolute; width:${size}px; height:${size}px;
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%; top:0;
      animation: confetti-fall ${1.5 + Math.random() * 2}s ease-out forwards;
      animation-delay:${Math.random() * 0.6}s;
      pointer-events:none; z-index:50;
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

// ── TTS ──
const audioCache: Record<string, string> = {};

async function speak(text: string, lang: Language = "en") {
  // Clean text - remove emojis
  const clean = text
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "")
    .trim();
  
  if (!clean) {
    console.warn("⚠️ No text to speak after cleanup");
    return;
  }

  // Create cache key with language
  const cacheKey = `${lang}:${clean}`;
  
  // Check cache first
  if (audioCache[cacheKey]) {
    console.log(`📦 Playing from cache: ${lang}`);
    try {
      const audio = new Audio(audioCache[cacheKey]);
      audio.play().catch(err => console.warn("Cache playback failed:", err));
    } catch (err) {
      console.error("Error playing cached audio:", err);
    }
    return;
  }

  try {
    console.log(`🔊 Requesting TTS: text="${clean}", language="${lang}"`);

    // Call backend TTS endpoint with language parameter
    const response = await fetch(`/api/trpc/tts.speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: clean,
        language: lang, // ✅ SEND LANGUAGE TO BACKEND
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);

    // Cache for future use
    audioCache[cacheKey] = audioUrl;

    console.log(`✅ TTS generated (${lang}), playing now...`);

    // Play immediately
    const audio = new Audio(audioUrl);
    audio.play().catch(err => console.warn("Playback failed:", err));

  } catch (error) {
    console.error(`❌ TTS error (${lang}):`, error);

    // Fallback to browser speech synthesis
    console.log(`↩️ Falling back to browser speech synthesis (${lang})`);
    try {
      const utterance = new SpeechSynthesisUtterance(clean);

      // Get available voices
      const voices = window.speechSynthesis.getVoices();

      // Select appropriate voice based on language
      if (lang === "es") {
        // Spanish voice
        const spanishVoice = voices.find(v => v.lang.startsWith("es")) ||
                           voices.find(v => v.lang.includes("Spanish")) ||
                           voices[0];
        if (spanishVoice) {
          utterance.voice = spanishVoice;
          console.log(`🇪🇸 Using voice: ${spanishVoice.name}`);
        }
      } else {
        // English voice
        const englishVoice = voices.find(v => 
          v.name.includes("Google US English") || 
          v.name.includes("Samantha") ||
          v.lang.startsWith("en")
        ) || voices[0];
        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log(`🇺🇸 Using voice: ${englishVoice.name}`);
        }
      }

      utterance.pitch = 0.95; // Softer, warmer pitch
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.lang = lang === "es" ? "es-ES" : "en-US";

      window.speechSynthesis.speak(utterance);
    } catch (fallbackErr) {
      console.error("Fallback speech synthesis failed:", fallbackErr);
    }
  }
}

// ── SCHOOL COUNTDOWN ──
function getCountdown(schoolTime: string): string {
  const now = new Date();
  const [h, m] = schoolTime.split(":").map(Number);
  const school = new Date(now);
  school.setHours(h, m, 0, 0);
  const diff = school.getTime() - now.getTime();
  if (diff <= 0) return "Now!";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── ONBOARDING ──
function Onboarding({ onComplete }: { onComplete: (state: Partial<AppState>) => void }) {
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("6");
  const [schoolTime, setSchoolTime] = useState("08:30");
  const [reward, setReward] = useState(REWARDS[0]);
  const [enabledTasks, setEnabledTasks] = useState([true, true, true, true, true, true]);

  function nextStep() {
    if (step === 1 && !childName.trim()) { alert("Please enter your child's name!"); return; }
    if (step < 4) setStep(step + 1);
    else onComplete({ childName: childName.trim(), age: parseInt(age), schoolTime, reward, enabledTasks });
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(180deg,#4facfe 0%,#ff9a3c 60%,#ff6b35 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'Nunito',sans-serif"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)",
        borderRadius: 28, padding: "32px 28px", maxWidth: 380, width: "100%",
        border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
      }}>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? "white" : "rgba(255,255,255,0.3)",
              transition: "all 0.3s"
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>👶</div>
            <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: "white", textAlign: "center", marginBottom: 8 }}>
              ☀️ GlowJo
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 24 }}>
              Set up takes 2 minutes — then hand the phone to your child!
            </div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 6 }}>What's your child's name?</label>
            <input value={childName} onChange={e => setChildName(e.target.value)} placeholder="e.g. Emma" maxLength={20}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 16, marginBottom: 12, outline: "none", fontFamily: "'Nunito',sans-serif" }} />
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 6 }}>Age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} min={3} max={12} placeholder="Age (3-12)"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 16, marginBottom: 20, outline: "none", fontFamily: "'Nunito',sans-serif" }} />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 16 }}>
              🔒 All data stays on your device. No accounts, no tracking. COPPA compliant.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🏫</div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 6 }}>What time does school start?</label>
            <input type="time" value={schoolTime} onChange={e => setSchoolTime(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 16, marginBottom: 20, outline: "none", fontFamily: "'Nunito',sans-serif" }} />
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 10 }}>Pick their weekly reward:</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {REWARDS.map(r => (
                <button key={r} onClick={() => setReward(r)} style={{
                  padding: "10px 8px", borderRadius: 12, border: `2px solid ${reward === r ? "white" : "rgba(255,255,255,0.3)"}`,
                  background: reward === r ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                  color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                }}>{r}</button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>✅</div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 16 }}>Which tasks apply each morning?</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {TASKS_EN.map((t, i) => (
                <div key={i} onClick={() => {
                  const next = [...enabledTasks];
                  next[i] = !next[i];
                  setEnabledTasks(next);
                }} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: enabledTasks[i] ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                  border: `2px solid ${enabledTasks[i] ? "white" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: 14, padding: "12px 16px", cursor: "pointer", transition: "all 0.2s"
                }}>
                  <span style={{ fontSize: 24 }}>{t.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "white", flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 20 }}>{enabledTasks[i] ? "✅" : "⬜"}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>📱</div>
            <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: "white", textAlign: "center", marginBottom: 12 }}>
              You're all set, {childName}!
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
              Hand the phone to <strong>{childName}</strong>.<br />They know what to do! 🚀
            </div>
          </>
        )}

        <button onClick={nextStep} style={{
          width: "100%", fontFamily: "'Fredoka One',cursive", fontSize: 20,
          padding: "16px", borderRadius: 50, border: "none",
          background: "white", color: "#ff5f1f", cursor: "pointer",
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)", transition: "transform 0.15s"
        }}>
          {step === 4 ? "🚀 Let's Go!" : "Next →"}
        </button>
      </div>
    </div>
  );
}

// ── MAIN KID SCREEN ──
function MainScreen({
  state, onWin, onParent, onUpdateState
}: {
  state: AppState;
  onWin: (starsEarned: number) => void;
  onParent: () => void;
  onUpdateState: (updates: Partial<AppState>) => void;
}) {
  const activeTasks = TASKS_EN.filter((_, i) => state.enabledTasks[i]);
  const [taskIdx, setTaskIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown(state.schoolTime));
  const [ringProgress, setRingProgress] = useState(0);
  const [skipTapped, setSkipTapped] = useState(false);
  const ringTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const skipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown(state.schoolTime)), 30000);
    return () => clearInterval(t);
  }, [state.schoolTime]);

  const currentTask = activeTasks[taskIdx];
  const totalTasks = activeTasks.length;

  function handleTap() {
    if (!started) {
      setStarted(true);
      speak("Good morning superstar! Let's do this!", state.language);
      startRing();
      return;
    }
    if (!currentTask) return;

    const voiceText = state.language === "es" ? currentTask.voice_es : currentTask.voice_en;
    speak(voiceText, state.language);
    if (navigator.vibrate) navigator.vibrate([80, 30, 80]);

    if (confettiRef.current) spawnConfetti(confettiRef.current);

    const nextIdx = taskIdx + 1;
    if (nextIdx >= totalTasks) {
      clearInterval(ringTimer.current);
      const newStars = state.stars + totalTasks;
      onUpdateState({ stars: newStars });
      setTimeout(() => onWin(totalTasks), 800);
    } else {
      setTaskIdx(nextIdx);
      resetRing();
      startRing();
    }
  }

  function startRing() {
    clearInterval(ringTimer.current);
    setRingProgress(0);
    let progress = 0;
    ringTimer.current = setInterval(() => {
      progress += 100 / 180; // 3 minutes = 180s
      setRingProgress(Math.min(progress, 100));
    }, 1000);
  }

  function resetRing() {
    clearInterval(ringTimer.current);
    setRingProgress(0);
  }

  function handleSkipTask() {
    if (!currentTask) return;
    
    if (!skipTapped) {
      setSkipTapped(true);
      clearTimeout(skipTimer.current);
      skipTimer.current = setTimeout(() => setSkipTapped(false), 2000);
      return;
    }

    const nextIdx = taskIdx + 1;
    if (nextIdx >= totalTasks) {
      clearInterval(ringTimer.current);
      const newStars = state.stars + totalTasks;
      onUpdateState({ stars: newStars });
      setTimeout(() => onWin(totalTasks), 800);
    } else {
      setTaskIdx(nextIdx);
      resetRing();
      startRing();
    }
    setSkipTapped(false);
  }

  useEffect(() => () => clearInterval(ringTimer.current), []);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  const weekDone = state.weekDays.filter(Boolean).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#1a0a02 0%,#2d1a00 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 20px 20px", fontFamily: "'Nunito',sans-serif", position: "relative", overflow: "hidden"
    }}>
      <div ref={confettiRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} />

      {/* Top bar */}
      <div style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 0 8px"
      }}>
        <div style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 20, padding: "6px 14px", fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ffd700" }}>
          ⭐ {state.stars}
        </div>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 14, color: "#ff9a3c" }}>
          ☀️ GlowJo
        </div>
        <div style={{ background: "rgba(255,95,31,0.15)", border: "1px solid rgba(255,95,31,0.3)", borderRadius: 20, padding: "6px 14px", fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ff9a3c" }}>
          🔥 {state.streak}
        </div>
      </div>

      {/* Mascot */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <div style={{ fontSize: 56, animation: "mascot-bounce 1.5s ease-in-out infinite alternate" }}>
          {!started ? "😴" : taskIdx >= totalTasks ? "🏆" : "😄"}
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#ffd700", letterSpacing: 1, marginTop: -4 }}>SUNNY ☀️</div>
        <div style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 16, padding: "8px 16px", marginTop: 8, fontSize: 14, fontWeight: 700, color: "white",
          maxWidth: 260, position: "relative"
        }}>
          {!started ? "Good morning, superstar! 🌟" : currentTask ? `${currentTask.emoji} ${currentTask.label}` : "You did it! 🏆"}
        </div>
      </div>

      {/* Task label */}
      <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "white", marginTop: 16, textAlign: "center" }}>
        {!started ? "Ready to start?" : currentTask ? currentTask.label : "ALL DONE!"}
      </div>

      {/* Timer ring + tap button */}
      <div style={{ position: "relative", marginTop: 16, width: 220, height: 220 }}>
        <svg style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }} width={220} height={220} viewBox="0 0 200 200">
          <circle cx={100} cy={100} r={90} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
          <circle cx={100} cy={100} r={90} fill="none" stroke="#ffd700" strokeWidth={8}
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.8s linear" }} />
        </svg>
        <button
          onClick={handleTap}
          style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 160, height: 160, borderRadius: "50%",
            background: "linear-gradient(135deg,#ff5f1f,#ff9a3c)",
            border: "none", cursor: "pointer",
            boxShadow: "0 0 40px rgba(255,95,31,0.5), 0 8px 30px rgba(255,95,31,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 64, transition: "transform 0.15s",
            animation: !started ? "demo-pulse 2s ease-in-out infinite alternate" : undefined
          }}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%,-50%) scale(0.93)"; }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%,-50%) scale(1)"; }}
          onTouchStart={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%,-50%) scale(0.93)"; }}
          onTouchEnd={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%,-50%) scale(1)"; }}
          aria-label={currentTask ? currentTask.label : "Start morning routine"}
        >
          {!started ? "☀️" : currentTask ? currentTask.emoji : "🏆"}
        </button>
        {started && currentTask && (
          <>
            <button
              onClick={handleSkipTask}
              style={{
                position: "absolute", bottom: "50%", left: "50%", transform: "translate(-50%, 50%)",
                padding: "8px 16px", borderRadius: 20,
                background: skipTapped ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = skipTapped ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)"; }}
            >
              Skip
            </button>
            {skipTapped && (
              <div style={{
                position: "absolute", bottom: "calc(50% - 60px)", left: "50%", transform: "translate(-50%, -50%)",
                fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600
              }}>
                Press again to skip
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress emoji trail */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {activeTasks.map((t, i) => (
          <span key={i} style={{ fontSize: 20, opacity: i < taskIdx ? 1 : 0.3, transition: "opacity 0.3s" }}>{t.emoji}</span>
        ))}
      </div>

      {/* Task progress */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
        {started ? `${Math.min(taskIdx, totalTasks)} / ${totalTasks} tasks` : "Tap ☀️ to begin!"}
      </div>

      {/* Weekly reward bar */}
      <div style={{
        width: "100%", maxWidth: 340, background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16,
        padding: "12px 16px", marginTop: 16,
        display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ fontSize: 24 }}>{state.reward.split(" ")[0]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>WEEKLY GOAL</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i < weekDone ? "#ffd700" : "rgba(255,255,255,0.15)",
                border: `2px solid ${i < weekDone ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, transition: "all 0.3s"
              }}>
                {i < weekDone ? "⭐" : ""}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#ffd700" }}>{weekDone}/5</div>
      </div>

      {/* Bottom bar */}
      <div style={{
        width: "100%", maxWidth: 340, display: "flex", justifyContent: "space-between",
        marginTop: 12, padding: "10px 16px",
        background: "rgba(255,255,255,0.05)", borderRadius: 14
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ff9a3c" }}>{countdown}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>SCHOOL</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ff9a3c" }}>{Math.min(taskIdx, totalTasks)}/{totalTasks}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>TASKS</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ff9a3c" }}>{weekDone}/7</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>THIS WEEK</div>
        </div>
      </div>

      {/* Language toggle */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {(["en", "es"] as Language[]).map(lang => (
          <button key={lang} onClick={() => onUpdateState({ language: lang })} style={{
            padding: "6px 14px", borderRadius: 20, border: `2px solid ${state.language === lang ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
            background: state.language === lang ? "rgba(255,215,0,0.2)" : "transparent",
            color: state.language === lang ? "#ffd700" : "rgba(255,255,255,0.4)",
            fontSize: 12, fontWeight: 800, cursor: "pointer"
          }}>
            {lang === "en" ? "🇺🇸 EN" : "🇪🇸 ES"}
          </button>
        ))}
      </div>

      {/* Parent access */}
      <button onClick={onParent} style={{
        marginTop: 16, background: "transparent", border: "none",
        color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontWeight: 700
      }}>⚙️ Parent View</button>
    </div>
  );
}

// ── WIN SCREEN ──
function WinScreen({ state, onParent, onNext }: { state: AppState; onParent: () => void; onNext: () => void }) {
  const confettiRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (confettiRef.current) spawnConfetti(confettiRef.current);
    speak("Amazing job! You are a daily winner! Sunny is SO proud of you!", state.language);
  }, []);

  const weekDone = state.weekDays.filter(Boolean).length;
  const newSticker = WIN_STICKERS[Math.min(state.stars, WIN_STICKERS.length - 1)];

  function share(type: "whatsapp" | "copy") {
    const msg = `${state.childName} just crushed their morning routine on GlowJo! 🏆⭐ ${state.streak} day streak! Try it free: https://morningmate.app`;
    if (type === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    else { navigator.clipboard?.writeText(msg); alert("Link copied!"); }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#ff9a3c 0%,#ff5f1f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'Nunito',sans-serif", position: "relative", overflow: "hidden",
      textAlign: "center"
    }}>
      <div ref={confettiRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} />
      <div style={{ fontSize: 32, marginBottom: 8, animation: "float 2s ease-in-out infinite" }}>⭐⭐⭐⭐⭐</div>
      <div style={{ fontSize: 80, animation: "mascot-bounce 1.5s ease-in-out infinite alternate" }}>🏆</div>
      <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 40, color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        DAILY WINNER!
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "white", marginTop: 8 }}>
        Amazing job, {state.childName}! 🎉
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>Sunny is SO proud of you! ☀️</div>
      <div style={{
        background: "rgba(255,255,255,0.2)", borderRadius: 16, padding: "12px 24px",
        marginTop: 16, fontSize: 16, fontWeight: 700, color: "white"
      }}>
        You're one step closer to {state.reward}!
      </div>
      {/* Week dots */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: i < weekDone ? "white" : "rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
          }}>
            {i < weekDone ? "⭐" : ""}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
        New sticker unlocked! {newSticker}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, width: "100%", maxWidth: 300 }}>
        <button onClick={() => share("whatsapp")} style={{
          fontFamily: "'Fredoka One',cursive", fontSize: 16,
          padding: "14px", borderRadius: 40, border: "none",
          background: "linear-gradient(135deg,#25D366,#128C7E)",
          color: "white", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
        }}>💬 Share with a Mom</button>
        <button onClick={onParent} style={{
          fontFamily: "'Fredoka One',cursive", fontSize: 16,
          padding: "14px", borderRadius: 40, border: "2px solid rgba(255,255,255,0.5)",
          background: "rgba(255,255,255,0.2)", color: "white", cursor: "pointer"
        }}>🔒 Parent View</button>
        <button onClick={onNext} style={{
          fontFamily: "'Fredoka One',cursive", fontSize: 16,
          padding: "14px", borderRadius: 40, border: "none",
          background: "white", color: "#ff5f1f", cursor: "pointer"
        }}>☀️ New Morning</button>
      </div>
    </div>
  );
}

// ── PIN OVERLAY ──
function PinOverlay({ correctPin, onSuccess, onCancel }: { correctPin: string; onSuccess: () => void; onCancel: () => void }) {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);

  function press(digit: string) {
    if (entered.length >= 4) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 4) {
      if (next === correctPin) { onSuccess(); }
      else { setError(true); setTimeout(() => { setEntered(""); setError(false); }, 800); }
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "linear-gradient(180deg,#2d1a00,#1a0a02)",
        border: "1px solid rgba(255,154,60,0.3)", borderRadius: 28,
        padding: "32px 28px", maxWidth: 320, width: "100%", textAlign: "center"
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>Parent Dashboard</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Enter PIN to continue</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: "50%",
              background: i < entered.length ? (error ? "#ff4444" : "#ffd700") : "rgba(255,255,255,0.2)",
              transition: "background 0.2s"
            }} />
          ))}
        </div>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>Wrong PIN — try again</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {["1","2","3","4","5","6","7","8","9","⌫","0","✕"].map((k, i) => (
            <button key={i} onClick={() => {
              if (k === "⌫") setEntered(e => e.slice(0, -1));
              else if (k === "✕") onCancel();
              else press(k);
            }} style={{
              height: 52, borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)", color: "white",
              fontFamily: "'Fredoka One',cursive", fontSize: 20, cursor: "pointer",
              transition: "background 0.15s"
            }}>{k}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PARENT DASHBOARD ──
function ParentDashboard({ state, onBack, onSave }: { state: AppState; onBack: () => void; onSave: (updates: Partial<AppState>) => void }) {
  const [name, setName] = useState(state.childName);
  const [schoolTime, setSchoolTime] = useState(state.schoolTime);
  const [pin, setPin] = useState(state.pin);
  const [language, setLanguage] = useState<Language>(state.language);
  const [, navigate] = useLocation();

  const today = new Date().getDate();
  const completedDays = state.completedDays;

  function renderCalendar() {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const cells = [];
    for (const d of days) {
      cells.push(<div key={`h-${d}`} style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>{d}</div>);
    }
    for (let i = 1; i <= 31; i++) {
      const done = completedDays.includes(i);
      const isToday = i === today;
      cells.push(
        <div key={i} style={{
          height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, fontSize: 11, fontWeight: done ? 900 : 400,
          background: done ? "rgba(255,215,0,0.2)" : isToday ? "rgba(255,95,31,0.2)" : "rgba(255,255,255,0.05)",
          border: done ? "1px solid #ffd700" : isToday ? "1px solid #ff5f1f" : "1px solid transparent",
          color: done ? "#ffd700" : "rgba(255,255,255,0.5)"
        }}>
          {done ? "🌟" : i}
        </div>
      );
    }
    return cells;
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#1a0a02", color: "white",
      fontFamily: "'Nunito',sans-serif", padding: "0 20px 40px", overflowY: "auto"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 16px" }}>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "#ff9a3c" }}>👨‍👩‍👧 Parent View</div>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "8px 16px", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>← Back</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Stars", value: `⭐ ${state.stars}`, color: "#ffd700" },
          { label: "Day Streak", value: `🔥 ${state.streak}`, color: "#ff9a3c" },
          { label: "Week Progress", value: `${state.weekDays.filter(Boolean).length}/7`, color: "#4facfe" },
          { label: "Stickers", value: `🎯 ${state.stickersUnlocked.length}`, color: "#ff5f1f" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ff9a3c", marginBottom: 12 }}>📅 March 2026 Progress</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {renderCalendar()}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>🌟 = Perfect Morning Completed</div>
      </div>

      {/* Settings */}
      <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ff9a3c", marginBottom: 12 }}>⚙️ Settings</div>
      {[
        { label: "Child's name", value: name, setter: setName, type: "text", placeholder: "Emma" },
        { label: "School time", value: schoolTime, setter: setSchoolTime, type: "time", placeholder: "" },
        { label: "Parent PIN (4 digits)", value: pin, setter: setPin, type: "number", placeholder: "1234" },
      ].map((field, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <label style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{field.label}</label>
          <input
            type={field.type}
            value={field.value}
            onChange={e => (field.setter as (v: string) => void)(e.target.value)}
            placeholder={field.placeholder}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 12px", color: "white", fontSize: 14, width: 140, outline: "none", fontFamily: "'Nunito',sans-serif" }}
          />
        </div>
      ))}

      {/* Language */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
        <label style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Language</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["en", "es"] as Language[]).map(lang => (
            <button key={lang} onClick={() => setLanguage(lang)} style={{
              padding: "6px 14px", borderRadius: 20,
              border: `2px solid ${language === lang ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
              background: language === lang ? "rgba(255,215,0,0.2)" : "transparent",
              color: language === lang ? "#ffd700" : "rgba(255,255,255,0.4)",
              fontSize: 12, fontWeight: 800, cursor: "pointer"
            }}>
              {lang === "en" ? "🇺🇸 EN" : "🇪🇸 ES"}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onSave({ childName: name, schoolTime, pin, language })} style={{
        width: "100%", fontFamily: "'Fredoka One',cursive", fontSize: 18,
        padding: "16px", borderRadius: 40, border: "none",
        background: "linear-gradient(135deg,#ff5f1f,#ff9a3c)",
        color: "white", cursor: "pointer", boxShadow: "0 6px 20px rgba(255,95,31,0.3)",
        marginBottom: 12
      }}>💾 Save Settings</button>

      <button onClick={() => navigate("/")} style={{
        width: "100%", fontFamily: "'Fredoka One',cursive", fontSize: 16,
        padding: "14px", borderRadius: 40, border: "2px solid rgba(255,255,255,0.2)",
        background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer"
      }}>← Back to Landing Page</button>
    </div>
  );
}

// ── MAIN APP ──
export default function AppPage() {
  const [appState, setAppState] = useState<AppState>(loadState);
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem("MM_State_v2");
    return saved ? "main" : "onboarding";
  });
  const [showPin, setShowPin] = useState(false);
  const [pinTarget, setPinTarget] = useState<Screen>("parent");

  function updateState(updates: Partial<AppState>) {
    setAppState(prev => {
      const next = { ...prev, ...updates };
      saveState(next);
      return next;
    });
  }

  function handleOnboardingComplete(data: Partial<AppState>) {
    const today = new Date().toDateString();
    const newState = { ...appState, ...data, lastDate: today };
    setAppState(newState);
    saveState(newState);
    setScreen("main");
  }

  function handleWin(starsEarned: number) {
    const today = new Date().getDate();
    const todayStr = new Date().toDateString();
    const newCompletedDays = appState.completedDays.includes(today)
      ? appState.completedDays
      : [...appState.completedDays, today];
    const newStreak = appState.lastDate !== todayStr ? appState.streak + 1 : appState.streak;
    updateState({
      stars: appState.stars + starsEarned,
      streak: newStreak,
      completedDays: newCompletedDays,
      lastDate: todayStr,
      stickersUnlocked: [...appState.stickersUnlocked, WIN_STICKERS[Math.min(appState.stars, WIN_STICKERS.length - 1)]]
    });
    setScreen("win");
  }

  function requestParent() {
    setPinTarget("parent");
    setShowPin(true);
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
      {screen === "onboarding" && <Onboarding onComplete={handleOnboardingComplete} />}
      {screen === "main" && (
        <MainScreen
          state={appState}
          onWin={handleWin}
          onParent={requestParent}
          onUpdateState={updateState}
        />
      )}
      {screen === "win" && (
        <WinScreen
          state={appState}
          onParent={requestParent}
          onNext={() => setScreen("main")}
        />
      )}
      {screen === "parent" && (
        <ParentDashboard
          state={appState}
          onBack={() => setScreen("main")}
          onSave={(updates) => { updateState(updates); setScreen("main"); }}
        />
      )}
      {showPin && (
        <PinOverlay
          correctPin={appState.pin}
          onSuccess={() => { setShowPin(false); setScreen(pinTarget); }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}
