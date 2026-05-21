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

// Calm night music — plays during night routine
let _nightMusicAudio: HTMLAudioElement | null = null;
const NIGHT_MUSIC_TRACK = "/music/glowjo-night-calm.mp3";

function startNightMusic() {
  try {
    if (_nightMusicAudio && !_nightMusicAudio.paused) return;
    // If a paused instance exists, just resume it
    if (_nightMusicAudio && _nightMusicAudio.paused) {
      _nightMusicAudio.play().catch(() => {});
      return;
    }
    const audio = new Audio(NIGHT_MUSIC_TRACK);
    audio.loop = true;
    audio.volume = 0.15;
    _nightMusicAudio = audio;
    audio.play().catch(() => {});
  } catch {}
}

export function stopNightMusic() {
  if (_nightMusicAudio) {
    try { _nightMusicAudio.pause(); } catch {}
    _nightMusicAudio.currentTime = 0;
    _nightMusicAudio = null;
  }
}

// Speak with optional onDone callback fired when speech ends (or fails).
// Caller is responsible for cancelling before calling this.
function nightSpeak(text: string, lang: Language = "en", onDone?: () => void) {
  try {
    if (!("speechSynthesis" in window)) { onDone?.(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "es" ? "es-ES" : "en-GB";
    utterance.pitch = 1.0;
    utterance.rate = 0.8;
    if (onDone) {
      utterance.onend = () => onDone();
      utterance.onerror = () => onDone();
    }
    window.speechSynthesis.speak(utterance);
  } catch (_e) { onDone?.(); }
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
    voice_en: "You did an absolutely amazing job tonight — every single task, done! Well done superstar!",
    prompt_es: "¡Hora de apagar las luces y cerrar los ojos!",
    voice_es: "¡Lo hiciste genial esta noche! ¡Todas las tareas completadas, muy bien hecho superestrella!",
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

const BEDTIME_STORIES_EN = [
  `Once upon a time, a little star named {name} flew higher than all the others in the sky. Every task completed tonight added a new twinkle, and now the whole universe is glowing because of how brilliant {name} is. Close those eyes — the star dragons are waiting to take you on the most magical dream adventure.`,
  `Deep in an enchanted forest, a brave explorer called {name} discovered a hidden trail that only the most determined children could find. Each bedtime task was a stepping stone along the path, and tonight every single one was conquered. The forest creatures are cheering, the fireflies are dancing, and now it's time to rest for tomorrow's adventure.`,
  `Far across the Sleepy Sea, there is a golden island that only appears for children who finish their bedtime routine. Tonight {name} earned the map, sailed the waves, and landed on the shore. The island is filled with talking animals, chocolate rivers, and the softest beds made of clouds — and it's all waiting right behind those closing eyes.`,
  `In the kingdom of Dreamville, the king and queen were searching for their most trusted knight. They heard about {name} — so kind, so hardworking, so brilliant at getting ready for bed. Tonight the crown is yours. Sleep tight, brave knight, for tomorrow brings a brand new quest.`,
  `High up on Moon Mountain, a wise old owl watched {name} complete every single bedtime task without giving up. The owl nodded slowly and said — this one is special. So tonight the moon is shining just a little bit brighter, lighting the way to the most wonderful dreams imaginable.`,
  `Once there was a young inventor called {name} who built a rocket out of bedtime tasks — one for every brush of teeth, every pyjama button, every tidy toy. Tonight the rocket is fully fuelled and ready for launch. Close your eyes, count to three, and blast off into the most spectacular dream galaxy ever seen.`,
  `In a cosy little town where the clouds are made of candyfloss, everyone knew {name} as the kindest, most hardworking child around. Tonight the whole town gathered to watch the bedtime fireworks — one explosion of colour for every task completed. The grand finale lit up the sky, and now it's time to snuggle in and dream of that magical town.`,
];

const BEDTIME_STORIES_ES = [
  `Érase una vez una pequeña estrella llamada {name} que voló más alto que todas las demás. Cada tarea completada esta noche añadió un nuevo brillo, y ahora el universo entero resplandece gracias a lo brillante que es {name}. Cierra los ojos — los dragones de las estrellas te esperan para llevarte a la aventura de sueños más mágica.`,
  `En un bosque encantado, un valiente explorador llamado {name} descubrió un sendero escondido que solo los niños más decididos podían encontrar. Esta noche conquistó cada tarea como un campeón. Las criaturas del bosque están aplaudiendo y las luciérnagas bailando — ahora es hora de descansar.`,
  `Al otro lado del Mar Dormido, hay una isla dorada que solo aparece para los niños que terminan su rutina nocturna. Esta noche {name} ganó el mapa, navegó las olas y llegó a la orilla. La isla está llena de animales parlantes y ríos de chocolate — todo esperando detrás de esos ojos que se cierran.`,
  `En el reino de Pueblosueño, el rey y la reina buscaban a su caballero más valiente. Escucharon hablar de {name} — tan amable, tan trabajador, tan brillante. Esta noche la corona es tuya. Duerme bien, valiente caballero, mañana trae una nueva aventura.`,
  `En lo alto de la Montaña Luna, un sabio búho observó a {name} completar cada tarea sin rendirse. El búho asintió lentamente y dijo — este niño es especial. Esta noche la luna brilla un poco más fuerte, iluminando el camino hacia los sueños más maravillosos.`,
  `Había una joven inventora llamada {name} que construyó un cohete con tareas nocturnas. Esta noche el cohete está completamente cargado. Cierra los ojos, cuenta hasta tres, y despega hacia la galaxia de sueños más espectacular jamás vista.`,
  `En un pequeño pueblo acogedor donde las nubes son de algodón de azúcar, todos conocían a {name} como el niño más amable y trabajador. Esta noche el pueblo entero se reunió para ver los fuegos artificiales de la rutina nocturna. Ahora es hora de acurrucarse y soñar con ese pueblo mágico.`,
];

function generateBedtimeStory(name: string, lang: Language): string {
  const day = new Date().getDay();
  const pool = lang === "es" ? BEDTIME_STORIES_ES : BEDTIME_STORIES_EN;
  return pool[day % pool.length].replaceAll("{name}", name);
}

export function NightScreen({
  state,
  onWin,
  onParent,
  bilingualEnabled,
  sendMode,
}: NightScreenProps) {
  const enabledTasks = TASKS_NIGHT_EN;
  const [completed, setCompleted] = useState<boolean[]>(Array(enabledTasks.length).fill(false));
  const [active, setActive] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState<number | null>(null);
  const [showStory, setShowStory] = useState(false);
  const startedRef = useRef(false);
  // Prevent double-taps or tapping while speech/animation is in progress
  const processingRef = useRef(false);
  // Store intro timer IDs so we can cancel them the moment a child taps a task.
  // Without this, the t=4.5s cancel fires mid-congrats and cuts the speech off.
  const introTimer1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introTimer2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearIntroTimers() {
    if (introTimer1.current) { clearTimeout(introTimer1.current); introTimer1.current = null; }
    if (introTimer2.current) { clearTimeout(introTimer2.current); introTimer2.current = null; }
  }

  // startNightMusic already guards against duplicate instances — call it freely;
  // on first tap it retries in case the browser blocked autoplay on mount.
  function tryStartMusic() {
    if (!sendMode) startNightMusic();
  }

  // Start music and first prompt on mount; stop everything on unmount
  useEffect(() => {
    tryStartMusic();
    if (!startedRef.current && enabledTasks.length > 0) {
      startedRef.current = true;
      const t = enabledTasks[0];
      window.speechSynthesis?.cancel();
      const welcome = state.language === "es"
        ? `¿Estás listo para tu rutina nocturna, ${state.childName}?`
        : `Are you ready for your bedtime routine, ${state.childName}?`;
      introTimer1.current = setTimeout(() => nightSpeak(welcome, state.language), 600);
      introTimer2.current = setTimeout(() => {
        window.speechSynthesis?.cancel();
        nightSpeak(state.language === "es" ? t.prompt_es : t.prompt_en, state.language);
      }, 4500);
      setActive(0);
    }
    return () => {
      clearIntroTimers();
      stopNightMusic();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleTap = (idx: number) => {
    // Block if already done or processing
    if (completed[idx] || processingRef.current) return;

    // Cancel intro timers immediately — prevents the t=4.5s cancel from
    // interrupting the congrats speech if the child taps within the first few seconds
    clearIntroTimers();

    // On first tap, try to start music (handles autoplay-blocked browsers)
    tryStartMusic();

    const t = enabledTasks[idx];

    // Story Time — first tap shows the card and reads it aloud; don't complete yet
    if (t.label === "Story Time" && !showStory) {
      window.speechSynthesis?.cancel();
      const story = generateBedtimeStory(state.childName, state.language);
      nightSpeak(story, state.language);
      setShowStory(true);
      return;
    }

    // Lock further taps until speech finishes
    processingRef.current = true;
    setShowStory(false);
    setCelebrating(idx);

    window.speechSynthesis?.cancel();
    const congratsText = state.language === "es" ? t.voice_es : t.voice_en;
    const nextIdx = idx + 1;

    nightSpeak(congratsText, state.language, () => {
      // Speech has finished — now mark task done and advance
      setCompleted(prev => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setCelebrating(null);
      processingRef.current = false;

      if (nextIdx < enabledTasks.length) {
        setActive(nextIdx);
        const nextTask = enabledTasks[nextIdx];
        // Small pause before next prompt so child can absorb the transition
        setTimeout(() => {
          nightSpeak(state.language === "es" ? nextTask.prompt_es : nextTask.prompt_en, state.language);
        }, 500);
      } else {
        stopNightMusic();
        setTimeout(() => onWin(enabledTasks.length), 600);
      }
    });
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
              onClick={() => !isLocked && !done && handleTap(idx)}
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
                cursor: isLocked || done ? "default" : "pointer",
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

  const spokenMessage =
    state.language === "es"
      ? `Dulces sueños, ${state.childName}.`
      : `Sleep tight, ${state.childName}.`;

  useEffect(() => {
    // Cancel any leftover speech from the routine, wait for screen transition, then speak
    window.speechSynthesis?.cancel();
    const timer = setTimeout(() => {
      nightSpeak(spokenMessage, state.language);
    }, 800);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
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
          color: "#e2d9f3",
          fontSize: 30,
          fontWeight: 800,
          marginTop: 20,
          marginBottom: 6,
          textAlign: "center",
          position: "relative",
          zIndex: 10,
          fontFamily: "'Fredoka One', cursive",
        }}
      >
        {message}
      </h1>

      <p style={{ color: "rgba(196,181,253,0.65)", fontSize: 14, marginBottom: 28, position: "relative", zIndex: 10 }}>
        All bedtime tasks done ✦
      </p>

      <div
        style={{
          maxWidth: 380,
          width: "100%",
          padding: "24px",
          borderRadius: 24,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(167,139,250,0.2)",
          marginBottom: 32,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ color: "rgba(196,181,253,0.6)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>
          ✦ Tonight's Story
        </div>
        <p style={{ color: "rgba(224,214,246,0.8)", fontSize: 14, lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>
          {story}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320, position: "relative", zIndex: 10 }}>
        <button
          onClick={onNext}
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 18,
            padding: "16px 32px",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
            color: "white",
            boxShadow: "0 6px 24px rgba(124,58,237,0.4)",
          }}
        >
          Done for Tonight 🌙
        </button>
        {onSwitchChild && (
          <button
            onClick={onSwitchChild}
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 16,
              padding: "14px 28px",
              borderRadius: 50,
              border: "2px solid rgba(167,139,250,0.4)",
              cursor: "pointer",
              background: "rgba(167,139,250,0.1)",
              color: "#c4b5fd",
            }}
          >
            🌟 Switch Child
          </button>
        )}
        <button
          onClick={onParent}
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 14,
            padding: "10px 24px",
            borderRadius: 50,
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Parent Dashboard →
        </button>
      </div>
    </div>
  );
}

// ── Routine mode toggle pill (☀️ / 🌙) ──
interface RoutineModeToggleProps {
  mode: "morning" | "night";
  onChange: (mode: "morning" | "night") => void;
}

export function RoutineModeToggle({ mode, onChange }: RoutineModeToggleProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "rgba(0,0,0,0.25)",
        borderRadius: 50,
        padding: 4,
        gap: 2,
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      {(["morning", "night"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: "6px 14px",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            background: mode === m ? "rgba(255,255,255,0.9)" : "transparent",
            color: mode === m ? (m === "night" ? "#4c1d95" : "#ff5f1f") : "rgba(255,255,255,0.6)",
            transition: "all 0.2s ease",
          }}
        >
          {m === "morning" ? "☀️ Morning" : "🌙 Bedtime"}
        </button>
      ))}
    </div>
  );
}
