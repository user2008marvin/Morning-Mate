/**
 * GlowJo — Full App Page
 * British warm voice, DB-synced progress, no PIN (uses /parent route)
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSubscription } from "@/hooks/useSubscription";

// ── CONSTANTS ──
const TASKS_EN = [
  {
    emoji: "☀️", label: "WAKE UP!", sticker: "⭐",
    prompt_en: "Good morning, lovely! I hope you slept well. Let's get ready for an exciting day — are you ready to start winning those stars? Come on, let's go!",
    prompt_es: "¡Buenos días, pequeño! Espero que hayas dormido bien. ¡Vamos a prepararnos para un día emocionante! ¿Estás listo para ganar esas estrellas?",
    halfway_en: "What a brilliant start — you are already doing so well, keep it up superstar!",
    halfway_es: "¡Qué comienzo tan brillante! ¡Ya lo estás haciendo tan bien, sigue así superestrella!",
    voice_en: "Amazing! You're up and ready! Now let's get this brilliant morning started — one task at a time!",
    voice_es: "¡Increíble! ¡Estás despierto! ¡Vamos a empezar esta mañana brillante!",
  },
  {
    emoji: "🪥", label: "BRUSH TEETH!", sticker: "✨",
    prompt_en: "Time to brush those teeth and get that sparkling smile shining!",
    prompt_es: "¡Hora de cepillar esos dientes y mostrar esa sonrisa brillante!",
    halfway_en: "Keep going — you are on your way to your gold star!",
    halfway_es: "¡Sigue así! ¡Estás en camino a tu estrella de oro!",
    voice_en: "",
    voice_es: "",
  },
  {
    emoji: "🛁", label: "SHOWER TIME!", sticker: "🌟",
    prompt_en: "Now let's get super squeaky clean in the shower — you've got this!",
    prompt_es: "¡Ahora vamos a ponernos súper limpios en la ducha! ¡Tú puedes!",
    halfway_en: "Almost done — you are doing absolutely brilliantly!",
    halfway_es: "¡Casi terminas! ¡Lo estás haciendo de maravilla!",
    voice_en: "Super squeaky clean! Well done, you wonderful thing!",
    voice_es: "¡Súper limpio! ¡Muy bien hecho, pequeño maravilloso!",
  },
  {
    emoji: "👕", label: "GET DRESSED!", sticker: "🌈",
    prompt_en: "Now let's get dressed for school — pick something brilliant!",
    prompt_es: "¡Ahora vistámonos para la escuela! ¡Elige algo brillante!",
    halfway_en: "Keep going — looking absolutely amazing already!",
    halfway_es: "¡Sigue así! ¡Ya te ves absolutamente increíble!",
    voice_en: "You look absolutely wonderful today! Now it's time to take a picture for mummy. Almost time for brekkie!",
    voice_es: "¡Te ves absolutamente maravilloso hoy! Ahora es hora de tomarle una foto a mamá. ¡Casi es hora del desayuno!",
  },
  {
    emoji: "🥛", label: "EAT BREAKFAST!", sticker: "💫",
    timerSeconds: 600,
    prompt_en: "Time for breakfast — every champion needs their fuel to power through the day!",
    prompt_es: "¡Hora del desayuno! ¡Todo campeón necesita su combustible para el día!",
    halfway_en: "Enjoying your brekkie? You are doing brilliantly — keep going, superstar!",
    halfway_es: "¿Disfrutando el desayuno? ¡Lo estás haciendo de maravilla! ¡Sigue así, superestrella!",
    voice_en: "Brilliant! Breakfast eaten like a true champion! You are absolutely fuelled up and ready to take on the world! When you are ready to leave, press the Let's Go button.",
    voice_es: "¡Brillante! ¡Desayuno comido como un verdadero campeón! ¡Estás listo para conquistar el mundo! Cuando estés listo para salir, presiona el botón Vamos.",
  },
  {
    emoji: "🚀", label: "LET'S GO!", sticker: "🏆",
    prompt_en: "You have completed everything! You are an absolute superstar! Now press Let's Go and have the most brilliant day ever!",
    prompt_es: "¡Lo has completado todo! ¡Eres una superestrella absoluta! ¡Presiona Vamos y ten el día más brillante!",
    halfway_en: "You are an absolute champion — almost time to head off and have the best day!",
    halfway_es: "¡Eres un campeón absoluto! ¡Casi es hora de salir y tener el mejor día!",
    voice_en: "You've done it! You are absolutely brilliant and we are so incredibly proud of you!",
    voice_es: "¡Lo lograste! ¡Eres absolutamente increíble y estamos muy orgullosos de ti!",
  },
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
    // Browser fallback — always pick a FEMALE voice
    // Voices load asynchronously — wait for them if not ready yet
    const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> => {
      return new Promise(resolve => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) { resolve(voices); return; }
        const handler = () => { resolve(window.speechSynthesis.getVoices()); };
        window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
        setTimeout(() => { resolve(window.speechSynthesis.getVoices()); }, 1000);
      });
    };

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = await getVoicesAsync();

      // Known female voice names across platforms (ordered by preference)
      const FEMALE_EN = [
        "Google UK English Female",   // Chrome Windows/Linux ✓
        "Samantha",                   // macOS/iOS US female ✓
        "Karen",                      // iOS Australian female ✓
        "Tessa",                      // iOS South African female ✓
        "Moira",                      // iOS Irish female ✓
        "Fiona",                      // macOS Scottish female ✓
        "Google US English",          // Chrome (female) ✓
        "Microsoft Zira",             // Windows Edge female ✓
        "Microsoft Hazel",            // Windows British female ✓
        "Zira",                       // Windows short name ✓
        "Microsoft Aria Online (Natural)", // Windows Edge Neural female ✓
        "Microsoft Jenny Online (Natural)", // Windows Edge Neural female ✓
        "Microsoft Libby Online (Natural)", // Windows Edge Neural UK female ✓
        "Microsoft Sonia Online (Natural)", // Windows Edge Neural UK female ✓
        "Microsoft Mia Online (Natural)",   // Windows Edge Neural UK female ✓
        "Microsoft Susan Online (Natural)", // Windows Edge Neural female ✓
      ];
      const FEMALE_ES = [
        "Google español",             // Chrome Spanish female ✓
        "Paulina",                    // macOS Mexican Spanish female ✓
        "Monica",                     // iOS Spanish female ✓
        "Google español de Estados Unidos", // Chrome US Spanish ✓
        "Microsoft Helena",           // Windows Spanish female ✓
        "Microsoft Elvira Online (Natural)", // Windows Edge Neural Spanish female ✓
      ];
      // Female name keywords (catches Edge Neural voices with long names)
      const FEMALE_KEYWORDS = ["aria","jenny","libby","sonia","mia","susan","zira","hazel","natasha","victoria","emma","samantha","karen","tessa","moira","fiona","helena","elvira","paulina","monica","alice","grace","isabella"];
      // Male voices to explicitly skip
      const MALE_EN_SKIP = ["Daniel", "Google UK English Male", "Alex", "Fred", "Microsoft David", "Microsoft Mark", "Arthur", "David", "Mark", "George", "Ryan", "Microsoft Ryan", "Microsoft George", "Rishi", "Aaron", "Thomas", "Reed", "Eddy", "Grandpa", "Guy", "Liam", "James", "Chris", "Connor", "Microsoft Guy Online (Natural)", "Microsoft Ryan Online (Natural)", "Microsoft George Online (Natural)", "Microsoft Liam Online (Natural)"];
      const isMale = (v: SpeechSynthesisVoice) =>
        MALE_EN_SKIP.includes(v.name) || v.name.toLowerCase().includes("male");
      const isFemale = (v: SpeechSynthesisVoice) =>
        FEMALE_EN.some(n => v.name.startsWith(n)) ||
        FEMALE_KEYWORDS.some(k => v.name.toLowerCase().includes(k)) ||
        v.name.toLowerCase().includes("female");

      if (lang === "es") {
        utterance.voice =
          voices.find(v => FEMALE_ES.includes(v.name)) ??
          voices.find(v => v.lang.startsWith("es") && isFemale(v)) ??
          voices.find(v => v.lang.startsWith("es") && !isMale(v)) ?? null;
        utterance.lang = "es-ES";
      } else {
        const female = voices.find(v => FEMALE_EN.some(n => v.name.startsWith(n)))
          ?? voices.find(v => v.lang === "en-GB" && isFemale(v))
          ?? voices.find(v => v.lang === "en-GB" && !isMale(v))
          ?? voices.find(v => v.lang.startsWith("en") && isFemale(v))
          ?? voices.find(v => v.lang.startsWith("en") && !isMale(v))
          ?? voices.find(v => isFemale(v)) ?? null;
        utterance.voice = female;
        utterance.lang = "en-GB";
      }

      utterance.pitch = 1.15;
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}

// ── HAPPY KIDS BACKGROUND MUSIC (Web Audio API — Twinkle Twinkle) ──
let _musicCtx: AudioContext | null = null;
let _musicStopped = false;

function startKidsMusic() {
  if (_musicCtx) return;
  _musicStopped = false;
  try {
    const ctx = new AudioContext();
    _musicCtx = ctx;
    // C major Twinkle Twinkle: C C G G A A G | F F E E D D C (×2)
    const C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, C5=523.25;
    const melody = [
      C4,C4,G4,G4,A4,A4,G4,
      F4,F4,E4,E4,D4,D4,C4,
      G4,G4,F4,F4,E4,E4,D4,
      G4,G4,F4,F4,E4,E4,D4,
      C4,C4,G4,G4,A4,A4,G4,
      F4,F4,E4,E4,D4,D4,C4,
      // Harmony octave up snippet
      C5,C5,G4,A4,C5,G4,F4,E4,D4,C4,
    ];
    const beat = 0.38;
    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    function scheduleLoop(startAt: number) {
      if (_musicStopped) return;
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.connect(env); env.connect(master);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t = startAt + i * beat;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.8, t + 0.03);
        env.gain.setValueAtTime(0.6, t + beat * 0.65);
        env.gain.linearRampToValueAtTime(0, t + beat * 0.92);
        osc.start(t); osc.stop(t + beat);
      });
      const loopEnd = startAt + melody.length * beat;
      const delay = (loopEnd - ctx.currentTime - 0.8) * 1000;
      setTimeout(() => { if (!_musicStopped && _musicCtx) scheduleLoop(loopEnd); }, Math.max(0, delay));
    }
    scheduleLoop(ctx.currentTime + 0.1);
  } catch { /* audio not supported */ }
}

function stopKidsMusic() {
  _musicStopped = true;
  if (_musicCtx) { try { _musicCtx.close(); } catch {} _musicCtx = null; }
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
  state, onWin, onParent, onUpdateState, bilingualEnabled
}: {
  state: AppState; onWin: (starsEarned: number) => void;
  onParent: () => void; onUpdateState: (updates: Partial<AppState>) => void;
  bilingualEnabled: boolean;
}) {
  const activeTasks = TASKS_EN.filter((_, i) => state.enabledTasks[i]);
  const [taskIdx, setTaskIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(getCountdown(state.schoolTime));
  const [ringProgress, setRingProgress] = useState(0);
  const [flashSticker, setFlashSticker] = useState<string | null>(null);
  const ringTimer = useRef<ReturnType<typeof setInterval>>();
  const confettiRef = useRef<HTMLDivElement>(null);
  const halfwaySpoken = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown(state.schoolTime)), 30000);
    return () => clearInterval(t);
  }, [state.schoolTime]);

  // Stop music when component unmounts
  useEffect(() => () => { stopKidsMusic(); clearInterval(ringTimer.current); }, []);

  const currentTask = activeTasks[taskIdx];
  const totalTasks = activeTasks.length;

  // Play encouraging prompt whenever a new task appears
  useEffect(() => {
    if (!started || !currentTask) return;
    halfwaySpoken.current = false;
    const prompt = state.language === "es" ? currentTask.prompt_es : currentTask.prompt_en;
    if (prompt) {
      const t = setTimeout(() => speak(prompt, state.language), 400);
      return () => clearTimeout(t);
    }
  }, [taskIdx, started]);

  // Halfway motivational message
  useEffect(() => {
    if (!started || !currentTask || halfwaySpoken.current) return;
    if (ringProgress >= 50) {
      halfwaySpoken.current = true;
      const halfway = state.language === "es"
        ? (currentTask as any).halfway_es
        : (currentTask as any).halfway_en;
      if (halfway) setTimeout(() => speak(halfway, state.language), 200);
    }
  }, [ringProgress]);

  function handleTap() {
    if (!started) {
      setStarted(true);
      startRing(); return;
    }
    if (!currentTask || flashSticker) return;
    const completion = state.language === "es" ? currentTask.voice_es : currentTask.voice_en;
    stopKidsMusic();
    if (completion) speak(completion, state.language);
    if (navigator.vibrate) navigator.vibrate([80, 30, 80]);
    if (confettiRef.current) spawnConfetti(confettiRef.current);

    // Flash sticker on the circle for 1 second
    setFlashSticker(currentTask.sticker);
    setTimeout(() => {
      setFlashSticker(null);
      const nextIdx = taskIdx + 1;
      if (nextIdx >= totalTasks) {
        clearInterval(ringTimer.current);
        setTimeout(() => onWin(totalTasks), 800);
      } else {
        const nextTask = activeTasks[nextIdx];
        setTaskIdx(nextIdx); resetRing(); startRing((nextTask as any).timerSeconds ?? 180);
      }
    }, 1000);
  }

  function startRing(seconds = 180) {
    clearInterval(ringTimer.current); setRingProgress(0);
    startKidsMusic();
    let p = 0;
    ringTimer.current = setInterval(() => {
      p += 100 / seconds; setRingProgress(Math.min(p, 100));
    }, 1000);
  }
  function resetRing() { clearInterval(ringTimer.current); setRingProgress(0); stopKidsMusic(); }

  function handleSkipTask() {
    if (!currentTask) return;
    stopKidsMusic();
    const nextIdx = taskIdx + 1;
    if (nextIdx >= totalTasks) {
      clearInterval(ringTimer.current);
      setTimeout(() => onWin(totalTasks), 800);
    } else {
      const nextTask = activeTasks[nextIdx];
      setTaskIdx(nextIdx); resetRing(); startRing((nextTask as any).timerSeconds ?? 180);
    }
  }

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
          background: flashSticker ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "linear-gradient(135deg,#ff5f1f,#ff9a3c)",
          border: "none", cursor: "pointer",
          boxShadow: flashSticker ? "0 0 50px rgba(124,58,237,0.8)" : "0 0 40px rgba(255,95,31,0.5),0 8px 30px rgba(255,95,31,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: flashSticker ? 76 : 64,
          transition: "background 0.15s, box-shadow 0.15s, font-size 0.15s",
          animation: !started ? "demo-pulse 2s ease-in-out infinite alternate" : undefined,
        }}
          onMouseDown={e => !flashSticker && (e.currentTarget.style.transform = "translate(-50%,-50%) scale(0.93)")}
          onMouseUp={e => !flashSticker && (e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)")}
          onTouchStart={e => !flashSticker && (e.currentTarget.style.transform = "translate(-50%,-50%) scale(0.93)")}
          onTouchEnd={e => !flashSticker && (e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)")}
        >
          {flashSticker ? flashSticker : (!started ? "☀️" : currentTask ? currentTask.emoji : "🏆")}
        </button>
        {started && currentTask && (
          <div style={{ position: "absolute", bottom: "50%", left: "50%", transform: "translate(-50%, 50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, whiteSpace: "nowrap" }}>
              Not doing this today? Press once ↓
            </div>
            <button onClick={handleSkipTask} style={{
              padding: "8px 16px", borderRadius: 20,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}>Skip</button>
          </div>
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

      {/* Language toggle — bilingual is Plus/Gold only */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button onClick={() => onUpdateState({ language: "en" })} style={{
          padding: "6px 14px", borderRadius: 20,
          border: `2px solid ${state.language === "en" ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
          background: state.language === "en" ? "rgba(255,215,0,0.2)" : "transparent",
          color: state.language === "en" ? "#ffd700" : "rgba(255,255,255,0.4)",
          fontSize: 12, fontWeight: 800, cursor: "pointer"
        }}>🇬🇧 EN</button>
        {bilingualEnabled ? (
          <button onClick={() => onUpdateState({ language: "es" })} style={{
            padding: "6px 14px", borderRadius: 20,
            border: `2px solid ${state.language === "es" ? "#ffd700" : "rgba(255,255,255,0.2)"}`,
            background: state.language === "es" ? "rgba(255,215,0,0.2)" : "transparent",
            color: state.language === "es" ? "#ffd700" : "rgba(255,255,255,0.4)",
            fontSize: 12, fontWeight: 800, cursor: "pointer"
          }}>🇪🇸 ES</button>
        ) : (
          <button onClick={() => alert("🌍 Bilingual mode is available on Plus & Gold plans!\n\nGo to getglowjo.com and upgrade to unlock English + Spanish.")} title="Upgrade to Plus for bilingual mode" style={{
            padding: "6px 14px", borderRadius: 20,
            border: "2px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "rgba(255,255,255,0.25)",
            fontSize: 12, fontWeight: 800, cursor: "pointer"
          }}>🔒 ES</button>
        )}
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
  const { tier } = useSubscription();
  const bilingualEnabled = tier === "plus" || tier === "gold";

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
        <MainScreen state={appState} onWin={handleWin} onParent={goParent} onUpdateState={updateState} bilingualEnabled={bilingualEnabled} />
      )}
      {screen === "win" && (
        <WinScreen state={appState} onParent={goParent} onNext={() => setScreen("main")} />
      )}
    </div>
  );
}
