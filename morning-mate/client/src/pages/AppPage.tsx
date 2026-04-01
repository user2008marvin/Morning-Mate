/**
 * GlowJo — Full App Page
 * British warm voice, DB-synced progress, no PIN (uses /parent route)
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// ── CONSTANTS ──
const TASKS_EN = [
  { emoji: "☀️", label: "WAKE UP!", voice_en: "Good morning, lovely! Rise and shine, you brilliant star!", voice_es: "¡Buenos días, pequeño! ¡Levántate, estrella brillante!", sticker: "⭐" },
  { emoji: "🪥", label: "BRUSH TEETH!", voice_en: "Brilliant brushing! You've got the most sparkling smile in the whole world!", voice_es: "¡Cepillado brillante! ¡Tienes la sonrisa más deslumbrante del mundo!", sticker: "✨" },
  { emoji: "🛁", label: "SHOWER TIME!", voice_en: "Super squeaky clean! Well done, you wonderful thing!", voice_es: "¡Súper limpio! ¡Muy bien hecho, pequeño maravilloso!", sticker: "🌟" },
  { emoji: "🥛", label: "EAT BREAKFAST!", voice_en: "Breakfast time! You're fuelling up like an absolute champion!", voice_es: "¡Hora del desayuno! ¡Estás cargando energía como un campeón!", sticker: "💫" },
  { emoji: "👕", label: "GET DRESSED!", voice_en: "You look absolutely wonderful! Have a truly brilliant day!", voice_es: "¡Te ves absolutamente genial! ¡Que tengas un día maravilloso!", sticker: "🌈" },
  { emoji: "🚀", label: "LET'S GO!", voice_en: "You've done it! You are absolutely brilliant and we are so incredibly proud of you!", voice_es: "¡Lo lograste! ¡Eres absolutamente increíble y estamos muy orgullosos de ti!", sticker: "🏆" },
];

const REWARDS = [
  "🍦 Ice Cream Friday", "🎬 Movie Night", "🍕 Pizza Night",
  "🎮 Extra Game Time", "🛝 Park Trip", "⭐ Choose Dinner"
];

const WIN_STICKERS = ["⭐", "🌟", "💫", "✨", "🎯", "🏆", "🦁", "🦊", "🐯", "🦅", "🌈", "🎨"];

type Screen = "onboarding" | "main" | "win";
type Language = "en" | "es";

interface AppState {
  childName: string;
  age: number;
  schoolTime: string;
  reward: string;
  enabledTasks: boolean[];
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
    const saved = localStorage.getItem("GJ_State_v1");
    if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
  } catch {}
  return { ...DEFAULT_STATE };
}

function saveState(state: AppState) {
  localStorage.setItem("GJ_State_v1", JSON.stringify(state));
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

// ── TTS — calls backend, parses tRPC JSON response ──
const audioCache: Record<string, string> = {};

async function speak(text: string, lang: Language = "en") {
  const clean = text
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "")
    .trim();
  if (!clean) return;

  const cacheKey = `${lang}:${clean}`;
  if (audioCache[cacheKey]) {
    new Audio(audioCache[cacheKey]).play().catch(() => {});
    return;
  }

  try {
    // tRPC mutation over HTTP — body must be { json: { ... } } with superjson
    const res = await fetch("/api/trpc/tts.speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ json: { text: clean, language: lang } }),
    });

    if (!res.ok) throw new Error(`TTS ${res.status}`);

    const payload = await res.json() as { result?: { data?: { json?: { audioUrl?: string } } } };
    const audioUrl = payload?.result?.data?.json?.audioUrl;
    if (!audioUrl) throw new Error("no audioUrl in response");

    audioCache[cacheKey] = audioUrl;
    new Audio(audioUrl).play().catch(() => {});
  } catch {
    // Browser fallback — prefer British en-GB voice
    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      if (lang === "es") {
        utterance.voice = voices.find(v => v.lang.startsWith("es")) ?? null;
        utterance.lang = "es-ES";
      } else {
        utterance.voice =
          voices.find(v => v.name.includes("Google UK English")) ??
          voices.find(v => v.name === "Daniel") ??  // iOS British
          voices.find(v => v.lang === "en-GB") ??
          voices.find(v => v.lang.startsWith("en")) ?? null;
        utterance.lang = "en-GB";
      }
      utterance.pitch = 1.05;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}

// ── COUNTDOWN ──
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

// ── ONBOARDING (local quick-start, no auth needed) ──
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
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? "white" : "rgba(255,255,255,0.3)", transition: "all 0.3s"
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>👶</div>
            <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: "white", textAlign: "center", marginBottom: 8 }}>☀️ GlowJo</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 24 }}>
              Set up takes 2 minutes — then hand the phone to your child!
            </div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 6 }}>What's your child's name?</label>
            <input value={childName} onChange={e => setChildName(e.target.value)} placeholder="e.g. Emma" maxLength={20}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 16, marginBottom: 12, outline: "none", fontFamily: "'Nunito',sans-serif", boxSizing: "border-box" }} />
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 6 }}>Age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} min={3} max={12}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 16, marginBottom: 20, outline: "none", fontFamily: "'Nunito',sans-serif", boxSizing: "border-box" }} />
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🏫</div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 6 }}>What time does school start?</label>
            <input type="time" value={schoolTime} onChange={e => setSchoolTime(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 16, marginBottom: 20, outline: "none", fontFamily: "'Nunito',sans-serif", boxSizing: "border-box" }} />
            <label style={{ fontSize: 14, fontWeight: 700, color: "white", display: "block", marginBottom: 10 }}>Pick their weekly reward:</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {REWARDS.map(r => (
                <button key={r} onClick={() => setReward(r)} style={{
                  padding: "10px 8px", borderRadius: 12, border: `2px solid ${reward === r ? "white" : "rgba(255,255,255,0.3)"}`,
                  background: reward === r ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                  color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer"
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
                  const next = [...enabledTasks]; next[i] = !next[i]; setEnabledTasks(next);
                }} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: enabledTasks[i] ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                  border: `2px solid ${enabledTasks[i] ? "white" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: 14, padding: "12px 16px", cursor: "pointer"
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
          boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
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
  state: AppState; onWin: (starsEarned: number) => void;
  onParent: () => void; onUpdateState: (updates: Partial<AppState>) => void;
}) {
  const activeTasks = TASKS_EN.filter((_, i) => state.enabledTasks[i]);
  const [taskIdx, setTaskIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown(state.schoolTime));
  const [ringProgress, setRingProgress] = useState(0);
  const [skipTapped, setSkipTapped] = useState(false);
  const ringTimer = useRef<ReturnType<typeof setInterval>>();
  const skipTimer = useRef<ReturnType<typeof setTimeout>>();
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
      speak("Good morning, lovely! Let's have a brilliant day!", state.language);
      startRing(); return;
    }
    if (!currentTask) return;
    speak(state.language === "es" ? currentTask.voice_es : currentTask.voice_en, state.language);
    if (navigator.vibrate) navigator.vibrate([80, 30, 80]);
    if (confettiRef.current) spawnConfetti(confettiRef.current);
    const nextIdx = taskIdx + 1;
    if (nextIdx >= totalTasks) {
      clearInterval(ringTimer.current);
      setTimeout(() => onWin(totalTasks), 800);
    } else {
      setTaskIdx(nextIdx); resetRing(); startRing();
    }
  }

  function startRing() {
    clearInterval(ringTimer.current); setRingProgress(0);
    let p = 0;
    ringTimer.current = setInterval(() => {
      p += 100 / 180; setRingProgress(Math.min(p, 100));
    }, 1000);
  }
  function resetRing() { clearInterval(ringTimer.current); setRingProgress(0); }

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
      setTimeout(() => onWin(totalTasks), 800);
    } else {
      setTaskIdx(nextIdx); resetRing(); startRing();
    }
    setSkipTapped(false);
  }

  useEffect(() => () => clearInterval(ringTimer.current), []);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;
  const weekDone = state.weekDays.filter(Boolean).length;

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(180deg,#1a0a02 0%,#2d1a00 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 20px 20px", fontFamily: "'Nunito',sans-serif", position: "relative", overflow: "hidden"
    }}>
      <div ref={confettiRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} />

      {/* Top bar */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 8px" }}>
        <div style={{ background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 20, padding: "6px 14px", fontFamily: "'Fredoka One',cursive", fontSize: 16, color: "#ffd700" }}>
          ⭐ {state.stars}
        </div>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 14, color: "#ff9a3c" }}>☀️ GlowJo</div>
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
        <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "8px 16px", marginTop: 8, fontSize: 14, fontWeight: 700, color: "white", maxWidth: 260 }}>
          {!started ? `Good morning, ${state.childName || "superstar"}! 🌟` : currentTask ? `${currentTask.emoji} ${currentTask.label}` : "You did it! 🏆"}
        </div>
      </div>

      <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "white", marginTop: 16, textAlign: "center" }}>
        {!started ? "Ready to start?" : currentTask ? currentTask.label : "ALL DONE!"}
      </div>

      {/* Ring + tap button */}
      <div style={{ position: "relative", marginTop: 16, width: 220, height: 220 }}>
        <svg style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }} width={220} height={220} viewBox="0 0 200 200">
          <circle cx={100} cy={100} r={90} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={8} />
          <circle cx={100} cy={100} r={90} fill="none" stroke="#ffd700" strokeWidth={8}
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.8s linear" }} />
        </svg>
        <button onClick={handleTap} style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 160, height: 160, borderRadius: "50%",
          background: "linear-gradient(135deg,#ff5f1f,#ff9a3c)", border: "none", cursor: "pointer",
          boxShadow: "0 0 40px rgba(255,95,31,0.5),0 8px 30px rgba(255,95,31,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64,
          animation: !started ? "demo-pulse 2s ease-in-out infinite alternate" : undefined
        }}
          onMouseDown={e => (e.currentTarget.style.transform = "translate(-50%,-50%) scale(0.93)")}
          onMouseUp={e => (e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)")}
          onTouchStart={e => (e.currentTarget.style.transform = "translate(-50%,-50%) scale(0.93)")}
          onTouchEnd={e => (e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)")}
        >
          {!started ? "☀️" : currentTask ? currentTask.emoji : "🏆"}
        </button>
        {started && currentTask && (
          <>
            <button onClick={handleSkipTask} style={{
              position: "absolute", bottom: "50%", left: "50%", transform: "translate(-50%, 50%)",
              padding: "8px 16px", borderRadius: 20,
              background: skipTapped ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}>Skip</button>
            {skipTapped && (
              <div style={{ position: "absolute", bottom: "calc(50% - 60px)", left: "50%", transform: "translate(-50%, -50%)", fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                Press again to skip
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress trail */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {activeTasks.map((t, i) => (
          <span key={i} style={{ fontSize: 20, opacity: i < taskIdx ? 1 : 0.3, transition: "opacity 0.3s" }}>{t.emoji}</span>
        ))}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
        {started ? `${Math.min(taskIdx, totalTasks)} / ${totalTasks} tasks` : "Tap ☀️ to begin!"}
      </div>

      {/* Weekly reward bar */}
      <div style={{ width: "100%", maxWidth: 340, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "12px 16px", marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>{state.reward.split(" ")[0]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>WEEKLY GOAL</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i < weekDone ? "#ffd700" : "rgba(255,255,255,0.15)",
                border: `2px solid ${i < weekDone ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12
              }}>{i < weekDone ? "⭐" : ""}</div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#ffd700" }}>{weekDone}/5</div>
      </div>

      {/* Bottom stats */}
      <div style={{ width: "100%", maxWidth: 340, display: "flex", justifyContent: "space-between", marginTop: 12, padding: "10px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 14 }}>
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
            padding: "6px 14px", borderRadius: 20,
            border: `2px solid ${state.language === lang ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
            background: state.language === lang ? "rgba(255,215,0,0.2)" : "transparent",
            color: state.language === lang ? "#ffd700" : "rgba(255,255,255,0.4)",
            fontSize: 12, fontWeight: 800, cursor: "pointer"
          }}>
            {lang === "en" ? "🇬🇧 EN" : "🇪🇸 ES"}
          </button>
        ))}
      </div>

      {/* Parent link — no PIN, navigate to /parent */}
      <button onClick={onParent} style={{
        marginTop: 16, background: "transparent", border: "none",
        color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontWeight: 700
      }}>⚙️ Parent Dashboard</button>
    </div>
  );
}

// ── WIN SCREEN ──
function WinScreen({ state, onParent, onNext }: { state: AppState; onParent: () => void; onNext: () => void }) {
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (confettiRef.current) spawnConfetti(confettiRef.current);
    speak("You've done it! You are absolutely brilliant and Sunny is so incredibly proud of you today!", state.language);
  }, []);

  const weekDone = state.weekDays.filter(Boolean).length;
  const newSticker = WIN_STICKERS[Math.min(state.stars, WIN_STICKERS.length - 1)];

  function share(type: "whatsapp" | "copy") {
    const msg = `${state.childName} just crushed their morning routine on GlowJo! 🏆⭐ ${state.streak} day streak! Try it free: https://glowjo.app`;
    if (type === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    else { navigator.clipboard?.writeText(msg); alert("Link copied!"); }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(180deg,#ff9a3c 0%,#ff5f1f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px", fontFamily: "'Nunito',sans-serif", position: "relative", overflow: "hidden", textAlign: "center"
    }}>
      <div ref={confettiRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} />
      <div style={{ fontSize: 32, marginBottom: 8, animation: "float 2s ease-in-out infinite" }}>⭐⭐⭐⭐⭐</div>
      <div style={{ fontSize: 80, animation: "mascot-bounce 1.5s ease-in-out infinite alternate" }}>🏆</div>
      <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 40, color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        BRILLIANT!
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "white", marginTop: 8 }}>
        Wonderful job, {state.childName}! 🎉
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>Sunny is so incredibly proud of you! ☀️</div>
      <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 16, padding: "12px 24px", marginTop: 16, fontSize: 16, fontWeight: 700, color: "white" }}>
        You're one step closer to {state.reward}!
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: i < weekDone ? "white" : "rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
          }}>{i < weekDone ? "⭐" : ""}</div>
        ))}
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>New sticker unlocked! {newSticker}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, width: "100%", maxWidth: 300 }}>
        <button onClick={() => share("whatsapp")} style={{
          fontFamily: "'Fredoka One',cursive", fontSize: 16, padding: "14px", borderRadius: 40, border: "none",
          background: "linear-gradient(135deg,#25D366,#128C7E)", color: "white", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
        }}>💬 Share with a Parent</button>
        <button onClick={onParent} style={{
          fontFamily: "'Fredoka One',cursive", fontSize: 16, padding: "14px", borderRadius: 40,
          border: "2px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.2)", color: "white", cursor: "pointer"
        }}>👨‍👩‍👧 Parent Dashboard</button>
        <button onClick={onNext} style={{
          fontFamily: "'Fredoka One',cursive", fontSize: 16, padding: "14px", borderRadius: 40, border: "none",
          background: "white", color: "#ff5f1f", cursor: "pointer"
        }}>☀️ New Morning</button>
      </div>
    </div>
  );
}

// ── ROOT ──
export default function AppPage() {
  const [, navigate] = useLocation();
  const [appState, setAppState] = useState<AppState>(loadState);
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem("GJ_State_v1");
    return saved ? "main" : "onboarding";
  });
  const [childId, setChildId] = useState<number | null>(null);

  // Auth + child profile from DB
  const { data: user } = trpc.auth.me.useQuery(undefined, { retry: false, staleTime: 5 * 60 * 1000 });
  const { data: children } = trpc.app.getChildren.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60 * 1000,
  });
  const syncProgress = trpc.app.updateChild.useMutation();

  // Merge DB child profile into local state
  useEffect(() => {
    if (!children?.length) return;
    const child = children[0] as any;
    setChildId(child.id);
    setAppState(prev => ({
      ...prev,
      childName: child.name ?? prev.childName,
      age: child.age ?? prev.age,
      schoolTime: child.schoolTime ?? prev.schoolTime,
      reward: child.reward ?? prev.reward,
      enabledTasks: child.enabledTasks ? JSON.parse(child.enabledTasks) : prev.enabledTasks,
      language: (child.language as Language) ?? prev.language,
      stars: child.stars ?? prev.stars,
      streak: child.streak ?? prev.streak,
      completedDays: child.completedDays ? JSON.parse(child.completedDays) : prev.completedDays,
    }));
    if (child.name && screen === "onboarding") setScreen("main");
  }, [children]);

  function updateState(updates: Partial<AppState>) {
    setAppState(prev => {
      const next = { ...prev, ...updates };
      saveState(next);
      return next;
    });
  }

  function handleOnboardingComplete(data: Partial<AppState>) {
    const today = new Date().toDateString();
    const next = { ...appState, ...data, lastDate: today };
    setAppState(next);
    saveState(next);
    setScreen("main");
  }

  function handleWin(starsEarned: number) {
    const today = new Date().getDate();
    const todayStr = new Date().toDateString();
    const newCompletedDays = appState.completedDays.includes(today)
      ? appState.completedDays : [...appState.completedDays, today];
    const newStreak = appState.lastDate !== todayStr ? appState.streak + 1 : appState.streak;
    const newStars = appState.stars + starsEarned;
    const updates = {
      stars: newStars,
      streak: newStreak,
      completedDays: newCompletedDays,
      lastDate: todayStr,
      stickersUnlocked: [...appState.stickersUnlocked, WIN_STICKERS[Math.min(appState.stars, WIN_STICKERS.length - 1)]]
    };
    updateState(updates);
    // Sync to DB if authenticated
    if (childId) {
      syncProgress.mutate({ childId, stars: newStars, streak: newStreak, completedDays: newCompletedDays });
    }
    setScreen("win");
  }

  function goParent() {
    navigate("/parent");
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
      {screen === "onboarding" && <Onboarding onComplete={handleOnboardingComplete} />}
      {screen === "main" && (
        <MainScreen state={appState} onWin={handleWin} onParent={goParent} onUpdateState={updateState} />
      )}
      {screen === "win" && (
        <WinScreen state={appState} onParent={goParent} onNext={() => setScreen("main")} />
      )}
    </div>
  );
}
