import React, { useState, useEffect, useRef } from "react";

type Language = "en" | "es";

interface AppState {
  childName: string;
  age: number;
  schoolTime: string;
  reward: string;
  enabledTasks: boolean[];
  avatarEmoji: string;
  language: Language;
  stars: number;
  streak: number;
  completedDays: number[];
  weekDays: boolean[];
  lastDate: string;
}

interface Task {
  label: string;
  emoji: string;
  prompt_en: string;
  voice_en: string;
  prompt_es: string;
  voice_es: string;
  sticker: string;
}

// Soft night music — calmest available tracks played at low volume
let _nightMusicAudio: HTMLAudioElement | null = null;
const NIGHT_MUSIC_POOL = ["/music/sweet.mp3", "/music/bright-wish.mp3", "/music/carefree.mp3", "/music/cookie.mp3", "/music/vacation.mp3"];

function startNightMusic() {
  try {
    if (_nightMusicAudio && !_nightMusicAudio.paused) return;
    const src = NIGHT_MUSIC_POOL[new Date().getDay() % NIGHT_MUSIC_POOL.length];
    _nightMusicAudio = new Audio(src);
    _nightMusicAudio.loop = true;
    _nightMusicAudio.volume = 0.15;
    _nightMusicAudio.play().catch(() => {});
  } catch {}
}

function stopNightMusic() {
  if (_nightMusicAudio) {
    _nightMusicAudio.pause();
    _nightMusicAudio.currentTime = 0;
    _nightMusicAudio = null;
  }
}

// Fire-and-forget speech — no cancel inside; caller cancels when needed
function nightSpeak(text: string, lang: Language = "en") {
  try {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "es" ? "es-ES" : "en-GB";
    utterance.pitch = 1.0;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  } catch {}
}

export const TASKS_NIGHT_EN: Task[] = [
  {
    label: "Bath Time",
    emoji: "🛁",
    prompt_en: "Time for a warm, cosy bath!",
    voice_en: "Great job! You're so fresh and clean now!",
    prompt_es: "¡Hora del baño calentito!",
    voice_es: "¡Genial! ¡Estás muy limpio y fresquito!",
    sticker: "🛁",
  },
  {
    label: "Brush Teeth",
    emoji: "🪥",
    prompt_en: "Let's brush those teeth nice and bright!",
    voice_en: "Wonderful! Your smile is sparkling tonight!",
    prompt_es: "¡Vamos a cepillar esos dientes!",
    voice_es: "¡Maravilloso! ¡Tu sonrisa brilla esta noche!",
    sticker: "✨",
  },
  {
    label: "Pyjamas On",
    emoji: "🌙",
    prompt_en: "Time to put on your cosy pyjamas!",
    voice_en: "You look so snuggly and ready for bed!",
    prompt_es: "¡Hora de ponerse el pijama!",
    voice_es: "¡Qué acogedor! ¡Estás listo para dormir!",
    sticker: "🌙",
  },
  {
    label: "Tidy Up",
    emoji: "🧸",
    prompt_en: "Let's put our toys away so they can rest too!",
    voice_en: "Amazing! Your room looks wonderful — well done!",
    prompt_es: "¡Guardemos los juguetes para que también descansen!",
    voice_es: "¡Increíble! ¡Tu cuarto se ve genial, muy bien hecho!",
    sticker: "🧸",
  },
  {
    label: "Story Time",
    emoji: "📖",
    prompt_en: "Snuggle up — it's story time!",
    voice_en: "That was a wonderful story. Sweet dreams are coming!",
    prompt_es: "¡Acurrúcate, es hora del cuento!",
    voice_es: "¡Qué cuento tan bonito! ¡Los sueños dulces ya vienen!",
    sticker: "📖",
  },
  {
    label: "Lights Off",
    emoji: "💤",
    prompt_en: "Time to turn the lights off and close your eyes!",
    voice_en: "Sleep tight, superstar. You did an amazing job tonight!",
    prompt_es: "¡Hora de apagar las luces y cerrar los ojos!",
    voice_es: "¡Dulces sueños, superestrella! ¡Lo hiciste genial esta noche!",
    sticker: "💤",
  },
];

const NUM_STARS = 60;
const starData = Array.from({ length: NUM_STARS }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 2.5 + 0.8,
  delay: Math.random() * 4,
  duration: Math.random() * 3 + 2,
}));

function StarField() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {starData.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "white",
            opacity: 0,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes floatMoon {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.4); }
          70% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(167,139,250,0.3); }
          50% { box-shadow: 0 0 28px rgba(167,139,250,0.7); }
        }
      `}</style>
    </div>
  );
}

interface NightScreenProps {
  state: AppState;
  onWin: (starsEarned: number) => void;
  onParent: () => void;
  onUpdateState: (updates: Partial<AppState>) => void;
  bilingualEnabled: boolean;
  sendMode: boolean;
}

function generateBedtimeStory(name: string, lang: Language): string {
  if (lang === "es") {
    return `Érase una vez, ${name} terminó todas sus tareas de la noche con mucho cuidado y amor. Las estrellas del cielo brillaron más fuerte que nunca para celebrar lo maravilloso que es. Ahora, mientras cierra los ojos, los sueños más dulces y mágicos ya vienen volando hacia él.`;
  }
  return `Once upon a time, ${name} finished every single bedtime task with such care and love. The stars in the sky shone just a little brighter tonight, because they were so proud of how wonderful ${name} is. Now, as those eyes grow heavy, the sweetest dreams are already floating gently through the door.`;
}

export function NightScreen({
  state,
  onWin,
  onParent,
  bilingualEnabled,
  sendMode,
}: NightScreenProps) {
  const enabledTasks = TASKS_NIGHT_EN.filter((_, i) => state.enabledTasks[i] !== false);
  const [completed, setCompleted] = useState<boolean[]>(Array(enabledTasks.length).fill(false));
  const [active, setActive] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState<number | null>(null);
  const [showStory, setShowStory] = useState(false);
  const startedRef = useRef(false);

  // Start music and first prompt on mount; stop everything on unmount
  useEffect(() => {
    if (!sendMode) startNightMusic();
    if (!startedRef.current && enabledTasks.length > 0) {
      startedRef.current = true;
      const t = enabledTasks[0];
      // Cancel any leftover speech, then speak first prompt after brief delay
      window.speechSynthesis?.cancel();
      setTimeout(() => nightSpeak(state.language === "es" ? t.prompt_es : t.prompt_en, state.language), 600);
      setActive(0);
    }
    return () => {
      stopNightMusic();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleTap = (idx: number) => {
    if (completed[idx]) return;
    const t = enabledTasks[idx];

    // Story Time — first tap shows the card and reads it aloud; don't complete yet
    if (t.label === "Story Time" && !showStory) {
      window.speechSynthesis?.cancel();
      const story = generateBedtimeStory(state.childName, state.language);
      nightSpeak(story, state.language);
      setShowStory(true);
      return;
    }

    // All other taps (or second tap on Story Time) — complete the task
    setShowStory(false);
    window.speechSynthesis?.cancel();
    nightSpeak(state.language === "es" ? t.voice_es : t.voice_en, state.language);
    setCelebrating(idx);

    setTimeout(() => {
      const next = [...completed];
      next[idx] = true;
      setCompleted(next);
      setCelebrating(null);

      const nextIdx = idx + 1;
      if (nextIdx < enabledTasks.length) {
        setActive(nextIdx);
        const nextTask = enabledTasks[nextIdx];
        setTimeout(() => {
          window.speechSynthesis?.cancel();
          nightSpeak(state.language === "es" ? nextTask.prompt_es : nextTask.prompt_en, state.language);
        }, 1500);
      } else {
        stopNightMusic();
        setTimeout(() => onWin(enabledTasks.length), 700);
      }
    }, 1000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0a0a1a 0%, #0d0d2b 40%, #1a0a2e 70%, #0f0f23 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 40px",
        position: "relative",
        fontFamily: "'Nunito', sans-serif",
        overflowX: "hidden",
      }}
    >
      <StarField />

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "64px 0 0",
          position: "relative",
          zIndex: 10,
        }}
      >
        <button
          onClick={onParent}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            color: "rgba(255,255,255,0.6)",
            padding: "8px 14px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ⚙️ Parent
        </button>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          ✦ {completed.filter(Boolean).length}/{enabledTasks.length} done
        </div>
      </div>

      <div
        style={{
          fontSize: 72,
          marginTop: 24,
          animation: "floatMoon 4s ease-in-out infinite",
          position: "relative",
          zIndex: 10,
          filter: "drop-shadow(0 0 20px rgba(167,139,250,0.5))",
        }}
      >
        🌙
      </div>

      <h1
        style={{
          color: "#e2d9f3",
          fontSize: 22,
          fontWeight: 700,
          marginTop: 10,
          marginBottom: 4,
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        Bedtime Routine
      </h1>
      <p
        style={{
          color: "rgba(200,185,230,0.6)",
          fontSize: 14,
          marginBottom: 28,
          position: "relative",
          zIndex: 10,
        }}
      >
        {state.childName}'s wind-down time ✨
      </p>

      {sendMode && active !== null && active + 1 < enabledTasks.length && !completed[active] && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, position: "relative", zIndex: 10 }}>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>Now</span>
          <span>{enabledTasks[active].emoji}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>Next</span>
          <span style={{ color: "#ffd700" }}>{enabledTasks[active + 1].emoji} {enabledTasks[active + 1].label}</span>
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          position: "relative",
          zIndex: 10,
        }}
      >
        {showStory && (
          <div style={{
            maxWidth: 420,
            width: "100%",
            marginBottom: 12,
            padding: "24px 24px",
            borderRadius: 24,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(167,139,250,0.25)",
            position: "relative",
            zIndex: 10,
            animation: "slideUp 0.5s ease forwards",
          }}>
            <div style={{
              color: "rgba(196,181,253,0.7)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}>
              ✦ Tonight's Story
            </div>
            <p style={{
              color: "rgba(224,214,246,0.85)",
              fontSize: 15,
              lineHeight: 1.75,
              margin: 0,
              fontStyle: "italic",
            }}>
              {generateBedtimeStory(state.childName, state.language)}
            </p>
            <div style={{
              marginTop: 16,
              fontSize: 13,
              color: "rgba(196,181,253,0.5)",
              textAlign: "center",
              letterSpacing: "0.05em",
            }}>
              Tap the task again when the story is done 🌙
            </div>
          </div>
        )}

        {enabledTasks.map((task, idx) => {
          const done = completed[idx];
          const isActive = active === idx && !done;
          const isCelebrating = celebrating === idx;
          const isLocked = !done && active !== null && idx > active;

          return (
            <div
              key={task.label}
              onClick={() => !isLocked && handleTap(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 20px",
                borderRadius: 20,
                background: done
                  ? "rgba(139,92,246,0.18)"
                  : isActive
                  ? "rgba(167,139,250,0.14)"
                  : "rgba(255,255,255,0.04)",
                border: done
                  ? "1.5px solid rgba(139,92,246,0.5)"
                  : isActive
                  ? "1.5px solid rgba(167,139,250,0.6)"
                  : "1.5px solid rgba(255,255,255,0.07)",
                cursor: isLocked ? "default" : "pointer",
                opacity: isLocked ? 0.35 : 1,
                transform: isCelebrating ? "scale(1.04)" : "scale(1)",
                transition: "all 0.25s ease",
                animation: isActive && !done ? "glowPulse 2s ease-in-out infinite" : "none",
              }}
            >
              <div
                style={{
                  fontSize: isCelebrating ? 40 : 32,
                  transition: "font-size 0.2s ease",
                  animation: isCelebrating ? "popIn 0.5s ease forwards" : "none",
                  minWidth: 44,
                  textAlign: "center",
                }}
              >
                {done ? task.sticker : task.emoji}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: done ? "rgba(200,185,240,0.6)" : "#e2d9f3",
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {task.label}
                </div>
                {(isActive || isCelebrating) && !done && (
                  <div
                    style={{
                      color: "rgba(196,181,253,0.8)",
                      fontSize: 12,
                      marginTop: 4,
                      animation: "slideUp 0.3s ease forwards",
                      fontStyle: "italic",
                    }}
                  >
                    {state.language === "es" ? task.prompt_es : task.prompt_en}
                  </div>
                )}
              </div>

              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: done
                    ? "none"
                    : isActive
                    ? "2px solid rgba(167,139,250,0.8)"
                    : "2px solid rgba(255,255,255,0.12)",
                  background: done ? "rgba(139,92,246,0.8)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                  color: "white",
                }}
              >
                {done ? "✓" : isActive ? "👆" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface NightWinScreenProps {
  state: AppState;
  onParent: () => void;
  onNext: () => void;
  onSwitchChild?: () => void;
  sendMode?: boolean;
}

export function NightWinScreen({ state, onParent, onNext, onSwitchChild }: NightWinScreenProps) {
  const story = generateBedtimeStory(state.childName, state.language);
  const message =
    state.language === "es"
      ? `¡Dulces sueños, ${state.childName}! 🌙`
      : `Sleep tight, ${state.childName}! 🌙`;

  useEffect(() => {
    nightSpeak(message, state.language);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #050510 0%, #0d0a2a 50%, #12082a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        position: "relative",
        fontFamily: "'Nunito', sans-serif",
        overflow: "hidden",
      }}
    >
      <StarField />

      <div
        style={{
          position: "absolute",
          top: "28%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          fontSize: 88,
          animation: "floatMoon 5s ease-in-out infinite",
          filter: "drop-shadow(0 0 30px rgba(167,139,250,0.6))",
          position: "relative",
          zIndex: 10,
        }}
      >
        🌙
      </div>

      <h1
        style={{
          color: "#e9e3f7",
          fontSize: 28,
          fontWeight: 700,
          marginTop: 24,
          textAlign: "center",
          position: "relative",
          zIndex: 10,
          animation: "slideUp 0.6s ease forwards",
        }}
      >
        {message}
      </h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          marginBottom: 8,
          position: "relative",
          zIndex: 10,
          animation: "slideUp 0.7s ease forwards",
        }}
      >
        {Array.from({ length: Math.min(state.stars, 6) }).map((_, i) => (
          <span key={i} style={{ fontSize: 22, animation: `popIn 0.4s ease ${i * 0.08}s both` }}>⭐</span>
        ))}
      </div>

      <div
        style={{
          maxWidth: 400,
          width: "100%",
          marginTop: 28,
          padding: "28px",
          borderRadius: 24,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(167,139,250,0.2)",
          position: "relative",
          zIndex: 10,
          animation: "slideUp 0.8s ease forwards",
        }}
      >
        <div
          style={{
            color: "rgba(196,181,253,0.7)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          ✦ Tonight's Story
        </div>
        <p
          style={{
            color: "rgba(224,214,246,0.85)",
            fontSize: 15,
            lineHeight: 1.75,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          {story}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 32,
          width: "100%",
          maxWidth: 360,
          position: "relative",
          zIndex: 10,
          animation: "slideUp 0.9s ease forwards",
        }}
      >
        <button
          onClick={onNext}
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4c1d95)",
            border: "none",
            borderRadius: 18,
            color: "#f3f0ff",
            fontSize: 16,
            fontFamily: "inherit",
            fontWeight: 700,
            padding: "17px 24px",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
          }}
        >
          🌙 Done for Tonight
        </button>

        {onSwitchChild && (
          <button
            onClick={onSwitchChild}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              color: "rgba(200,185,240,0.7)",
              fontSize: 14,
              fontFamily: "inherit",
              padding: "14px 24px",
              cursor: "pointer",
            }}
          >
            👶 Switch Child
          </button>
        )}

        <button
          onClick={onParent}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(167,139,250,0.5)",
            fontSize: 13,
            fontFamily: "inherit",
            padding: "8px",
            cursor: "pointer",
          }}
        >
          ⚙️ Parent Settings
        </button>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes floatMoon {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.4); }
          70% { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(167,139,250,0.3); }
          50% { box-shadow: 0 0 28px rgba(167,139,250,0.7); }
        }
      `}</style>
    </div>
  );
}

interface RoutineModeToggleProps {
  mode: "morning" | "night";
  onChange: (m: "morning" | "night") => void;
}

export function RoutineModeToggle({ mode, onChange }: RoutineModeToggleProps) {
  const isNight = mode === "night";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: 4,
        background: isNight
          ? "linear-gradient(135deg, #0d0d2b, #1a0a2e)"
          : "linear-gradient(135deg, #fef3c7, #fde68a)",
        border: isNight
          ? "1.5px solid rgba(167,139,250,0.35)"
          : "1.5px solid rgba(251,191,36,0.5)",
        boxShadow: isNight
          ? "0 2px 14px rgba(88,28,220,0.25)"
          : "0 2px 14px rgba(251,191,36,0.25)",
        transition: "all 0.35s ease",
        userSelect: "none",
      }}
    >
      <button
        onClick={() => onChange("morning")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 16px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          transition: "all 0.3s ease",
          background: !isNight ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : "transparent",
          color: !isNight ? "#7c2d12" : "rgba(167,139,250,0.55)",
          boxShadow: !isNight ? "0 2px 10px rgba(245,158,11,0.4)" : "none",
        }}
      >
        <span>☀️</span>
        <span>Morning</span>
      </button>

      <button
        onClick={() => onChange("night")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 16px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          transition: "all 0.3s ease",
          background: isNight ? "linear-gradient(135deg, #4c1d95, #7c3aed)" : "transparent",
          color: isNight ? "#e9e3f7" : "rgba(120,53,15,0.45)",
          boxShadow: isNight ? "0 2px 10px rgba(124,58,237,0.45)" : "none",
        }}
      >
        <span>🌙</span>
        <span>Night</span>
      </button>
    </div>
  );
}
