import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { toast } from "sonner";
import { saveRecording, getRecording, deleteRecording, getSupportedMimeType } from "@/lib/voiceRecordings";

const BG = "linear-gradient(180deg, #4facfe 0%, #ff9a3c 60%, #ff6b35 100%)";

const TIER_LABELS: Record<string, string> = {
  freemium: "Free", starter: "GlowJo ⭐", plus: "GlowJo ⭐", gold: "GlowJo ⭐",
};

function LoginPrompt() {
  const { openAuthModal } = useAuthModal();
  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Fredoka One', cursive", padding: "24px", textAlign: "center",
    }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>👨‍👩‍👧</div>
      <h1 style={{ color: "white", fontSize: "2rem", marginBottom: "8px" }}>Parent Dashboard</h1>
      <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: "32px" }}>
        Sign in to manage your kids' morning routines
      </p>
      <button
        onClick={() => openAuthModal()}
        style={{
          background: "white", color: "#4facfe", border: "none", borderRadius: "16px",
          padding: "16px 32px", fontSize: "1.1rem", cursor: "pointer",
          fontFamily: "'Fredoka One', cursive", fontWeight: "bold",
        }}
      >
        🔐 Sign In / Create Account
      </button>
      <a href="/" style={{ color: "rgba(255,255,255,0.7)", marginTop: "16px", fontSize: "0.9rem", display: "block" }}>
        ← Back to Home
      </a>
    </div>
  );
}

const AVATARS = ["🦄", "🚀", "🦁", "🐸", "🐼", "🦊", "🐶", "🐱", "🦋", "🐉", "⭐", "🎃"];

type Child = {
  id: number;
  name: string;
  age: number | null;
  schoolTime: string | null;
  reward: string | null;
  language: "en" | "es";
  enabledTasks: string | null;
  avatarEmoji: string | null;
  completedDays: string | null;
  stars: number | null;
  streak: number | null;
};

function ChildCard({
  child, onEdit, onDelete, canDelete,
}: {
  child: Child; onEdit: (c: Child) => void; onDelete: (id: number) => void; canDelete: boolean;
}) {
  const tasks = child.enabledTasks ? JSON.parse(child.enabledTasks) : [true, true, true, true, true, true];
  const taskLabels = ["☀️ Wake Up", "🛁 Shower", "🥛 Breakfast", "🪥 Teeth", "🎒 Pack Bag", "🚀 Let's Go"];
  const enabledCount = (tasks as boolean[]).filter(Boolean).length;
  const sendOn = child.id ? localStorage.getItem(`gj_send_${child.id}`) === "1" : false;

  return (
    <div style={{
      background: "white", borderRadius: "20px", padding: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "2.4rem", lineHeight: 1 }}>{child.avatarEmoji || "🌟"}</div>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "#1a1a2e", fontFamily: "'Fredoka One', cursive" }}>{child.name}</div>
            <div style={{ fontSize: "0.85rem", color: "#888" }}>
              {child.age ? `Age ${child.age}` : ""}
              {child.schoolTime ? ` · 🏫 ${child.schoolTime}` : ""}
              {` · ${enabledCount} tasks`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => onEdit(child)} style={{ background: "#f0f4ff", color: "#4facfe", border: "none", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem" }}>✏️ Edit</button>
          {canDelete && <button onClick={() => onDelete(child.id)} style={{ background: "#fff0f0", color: "#ff4444", border: "none", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem" }}>🗑️</button>}
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
        {taskLabels.map((label, i) => (
          <span key={i} style={{ background: tasks[i] ? "#e8f5e9" : "#f5f5f5", color: tasks[i] ? "#2e7d32" : "#bbb", borderRadius: "8px", padding: "4px 8px", fontSize: "0.75rem" }}>{label}</span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: sendOn ? "#eef6ff" : "#fafafa", border: `1.5px solid ${sendOn ? "#4facfe" : "#eee"}`, borderRadius: "12px", padding: "8px 12px", marginBottom: "12px" }}>
        <div>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1a1a2e" }}>🧩 SEND Mode</span>
          <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: 8 }}>Calmer voice · no music · Now &amp; Next view</span>
        </div>
        <button
          onClick={() => onEdit(child)}
          style={{ background: sendOn ? "linear-gradient(135deg,#4facfe,#00f2fe)" : "#ddd", color: "white", border: "none", borderRadius: "16px", padding: "4px 14px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
        >
          {sendOn ? "ON" : "OFF"} · Edit
        </button>
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.3rem" }}>⭐ {child.stars ?? 0}</div>
          <div style={{ fontSize: "0.7rem", color: "#aaa" }}>Stars</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.3rem" }}>🔥 {child.streak ?? 0}</div>
          <div style={{ fontSize: "0.7rem", color: "#aaa" }}>Streak</div>
        </div>
        {child.reward && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.75rem", color: "#aaa" }}>🎁 Reward goal</div>
            <div style={{ fontSize: "0.9rem", color: "#333" }}>{child.reward}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WEEK STAR CHART ──
const WEEK_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function WeekStarChart({ child }: { child: Child }) {
  const weekDates = getCurrentWeekDates();
  // completedDays stores day-of-month numbers; parse safely
  const completedDayNums: number[] = (() => {
    try { return child.completedDays ? JSON.parse(child.completedDays) : []; }
    catch { return []; }
  })();
  const todayNum = new Date().getDate();

  function handlePrint() {
    const chartId = `gj-wk-${child.id}`;
    const style = document.createElement("style");
    style.textContent = `@media print{body *{visibility:hidden!important}#${chartId},#${chartId} *{visibility:visible!important}#${chartId}{position:fixed!important;left:0!important;top:0!important;width:100%!important;padding:32px!important}}`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }

  return (
    <div id={`gj-wk-${child.id}`} style={{ background: "white", borderRadius: "16px", padding: "14px 18px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: "1rem", color: "#ff9a3c" }}>
          ⭐ {child.name}'s Week
        </span>
        <button onClick={handlePrint} style={{ background: "transparent", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "5px 12px", cursor: "pointer", fontSize: "0.78rem", color: "#666", fontFamily: "'Nunito',sans-serif", fontWeight: 700 }}>
          🖨️ Print Chart
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {weekDates.map((d, i) => {
          const dayNum = d.getDate();
          const isCompleted = completedDayNums.includes(dayNum);
          const isToday = dayNum === todayNum;
          const isFuture = d > new Date() && !isCompleted;
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: isToday ? "#ff9a3c" : "#bbb", marginBottom: "3px", letterSpacing: "0.03em", textTransform: "uppercase" }}>
                {WEEK_DAY_LABELS[i]}
              </div>
              <div style={{ fontSize: "1.35rem", opacity: isFuture ? 0.35 : 1 }}>
                {isCompleted ? "⭐" : "☆"}
              </div>
              <div style={{ fontSize: "0.6rem", color: "#ccc", marginTop: "2px" }}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PRESET_REWARDS = [
  "🍦 Ice Cream Friday",
  "🍕 Pizza Night",
  "🎬 Movie Night",
  "🎮 Extra Game Time",
  "🛝 Park Trip",
  "⭐ Choose Dinner",
  "🍫 Chocolate Treat",
  "🎨 Arts & Crafts",
  "🧸 New Toy / Book",
  "🏊 Swimming Trip",
  "🎉 Friend Sleepover",
  "🍔 Burger Night",
];

function EditChildModal({ child, onSave, onClose }: { child: Child | null; onSave: (data: Partial<Child> & { id?: number }) => void; onClose: () => void; }) {
  const defaultTasks = child?.enabledTasks ? JSON.parse(child.enabledTasks) : [true, true, true, true, true, true];
  const [name, setName] = useState(child?.name ?? "");
  const [age, setAge] = useState(child?.age?.toString() ?? "");
  const [schoolTime, setSchoolTime] = useState(child?.schoolTime ?? "");
  const [reward, setReward] = useState(child?.reward ?? "");
  const [customReward, setCustomReward] = useState(
    child?.reward && !PRESET_REWARDS.includes(child.reward) ? child.reward : ""
  );
  const [tasks, setTasks] = useState<boolean[]>(defaultTasks);
  const [avatarEmoji, setAvatarEmoji] = useState(child?.avatarEmoji ?? AVATARS[0]);
  const [sendMode, setSendMode] = useState(() =>
    child?.id ? localStorage.getItem(`gj_send_${child.id}`) === "1" : false
  );

  const toggleTask = (i: number) => setTasks(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  const finalReward = customReward.trim() || reward;
  const handleSave = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (child?.id) {
      if (sendMode) localStorage.setItem(`gj_send_${child.id}`, "1");
      else localStorage.removeItem(`gj_send_${child.id}`);
    }
    onSave({ id: child?.id, name: name.trim(), age: age ? parseInt(age) : undefined, schoolTime: schoolTime || undefined, reward: finalReward || undefined, enabledTasks: JSON.stringify(tasks), avatarEmoji: avatarEmoji || undefined });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 100 }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "28px", width: "100%", maxWidth: "420px", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.5rem", marginBottom: "16px", color: "#1a1a2e" }}>
          {child ? "✏️ Edit Child" : "➕ Add Child"}
        </h2>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#666", marginBottom: "8px" }}>Choose an Avatar</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
            {AVATARS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatarEmoji(a)}
                style={{
                  fontSize: "1.6rem", padding: "6px", borderRadius: "12px", cursor: "pointer",
                  border: `2px solid ${avatarEmoji === a ? "#4facfe" : "#eee"}`,
                  background: avatarEmoji === a ? "#e8f5ff" : "white",
                  transition: "border 0.1s, background 0.1s",
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <label style={{ display: "block", marginBottom: "12px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#666", marginBottom: "4px" }}>Name *</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emma" style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #eee", fontSize: "1rem", outline: "none", boxSizing: "border-box" }} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <label>
            <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#666", marginBottom: "4px" }}>Age</div>
            <input type="number" min="3" max="12" value={age} onChange={e => setAge(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #eee", fontSize: "1rem", boxSizing: "border-box" }} />
          </label>
          <label>
            <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#666", marginBottom: "4px" }}>School Time</div>
            <input type="time" value={schoolTime} onChange={e => setSchoolTime(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #eee", fontSize: "1rem", boxSizing: "border-box" }} />
          </label>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#666", marginBottom: "8px" }}>🎁 Weekly Reward</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
            {PRESET_REWARDS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setReward(r); setCustomReward(""); }}
                style={{
                  padding: "9px 8px", borderRadius: "12px", cursor: "pointer", textAlign: "left", fontSize: "0.82rem",
                  border: `2px solid ${reward === r && !customReward ? "#4facfe" : "#eee"}`,
                  background: reward === r && !customReward ? "#e8f5ff" : "white",
                  color: reward === r && !customReward ? "#1a6fb8" : "#333",
                  fontWeight: reward === r && !customReward ? 700 : 400,
                  transition: "border 0.1s, background 0.1s",
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            value={customReward}
            onChange={e => { setCustomReward(e.target.value); setReward(""); }}
            placeholder="Or type your own… e.g. Trampoline Park"
            style={{ width: "100%", padding: "10px 12px", borderRadius: "12px", border: `2px solid ${customReward ? "#4facfe" : "#eee"}`, fontSize: "0.9rem", boxSizing: "border-box", outline: "none" }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "600", color: "#666", marginBottom: "10px" }}>Tasks to Include</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {TASKS.map((t, i) => (
              <label key={t.label} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={tasks[i]} onChange={() => toggleTask(i)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <span style={{ fontSize: "0.95rem" }}>{t.emoji} {t.label}</span>
              </label>
            ))}
          </div>
        </div>
        {child?.id && (
          <div style={{ marginBottom: "20px", background: sendMode ? "#f0f7ff" : "#fafafa", border: `2px solid ${sendMode ? "#4facfe" : "#eee"}`, borderRadius: "16px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1a1a2e" }}>🧩 SEND Mode</div>
                <div style={{ fontSize: "0.78rem", color: "#888", marginTop: 3 }}>Calmer voice · no flashing · no music · Now & Next view</div>
              </div>
              <button
                type="button"
                onClick={() => setSendMode(v => !v)}
                style={{
                  minWidth: 56, height: 30, borderRadius: 20, border: "none", cursor: "pointer",
                  background: sendMode ? "linear-gradient(135deg, #4facfe, #00f2fe)" : "#ddd",
                  color: "white", fontWeight: 700, fontSize: "0.8rem",
                  transition: "background 0.2s",
                }}
              >
                {sendMode ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "2px solid #eee", background: "white", color: "#666", fontSize: "1rem", cursor: "pointer", fontFamily: "'Fredoka One', cursive" }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 2, padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #4facfe, #00f2fe)", color: "white", fontSize: "1rem", cursor: "pointer", fontFamily: "'Fredoka One', cursive" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

const TASKS = [
  { label: "WAKE UP!",       emoji: "☀️" },
  { label: "BRUSH TEETH!",   emoji: "🪥" },
  { label: "SHOWER TIME!",   emoji: "🛁" },
  { label: "GET DRESSED!",   emoji: "👕" },
  { label: "EAT BREAKFAST!", emoji: "🥛" },
  { label: "LET'S GO!",      emoji: "🚀" },
];

type VoiceSlot = "prompt" | "completion";

function VoiceSlotRow({ taskLabel, slot, label }: { taskLabel: string; slot: VoiceSlot; label: string }) {
  const key = `${slot}_${taskLabel}`;
  const [hasRecording, setHasRecording] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    getRecording(key).then(b => setHasRecording(!!b)).catch(() => {});
  }, [key]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, [key]);

  async function startRecord() {
    // Guard: browser support check
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Your browser doesn't support recording. Try Chrome or Safari.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      toast.error("Recording not supported on this browser. Please use Chrome or Safari.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("[VoiceRecord] getUserMedia failed:", err?.name, err?.message);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied. Please allow mic access in your browser settings and try again.");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        toast.error("No microphone found. Please connect a microphone and try again.");
      } else if (err?.name === "NotReadableError") {
        toast.error("Microphone is in use by another app. Close other apps and try again.");
      } else {
        toast.error(`Couldn't access microphone: ${err?.message || err?.name || "unknown error"}`);
      }
      return;
    }

    try {
      const mimeType = getSupportedMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onerror = (e: any) => {
        console.error("[VoiceRecord] MediaRecorder error:", e);
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        toast.error("Recording error — please try again.");
      };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (chunks.current.length === 0) {
          toast.error("Nothing recorded — make sure your mic is not muted and try again.");
          setRecording(false);
          return;
        }
        // Use the actual format the recorder chose, not our requested format
        const actualMime = mr.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type: actualMime });
        if (blob.size < 500) {
          toast.error("Recording too short or silent — please try again.");
          setRecording(false);
          return;
        }
        await saveRecording(key, blob);
        setHasRecording(true);
        setRecording(false);
        toast.success("Voice saved! 🎙️");
      };
      mr.start(200);
      mediaRecorder.current = mr;
      setRecording(true);
    } catch (err: any) {
      console.error("[VoiceRecord] MediaRecorder setup failed:", err?.name, err?.message);
      stream.getTracks().forEach(t => t.stop());
      toast.error(`Recording setup failed: ${err?.message || err?.name || "unknown error"}`);
    }
  }

  function stopRecord() {
    mediaRecorder.current?.stop();
  }

  async function playBack() {
    try {
      // Stop any existing playback first
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }

      const blob = await getRecording(key);
      if (!blob) { toast.error("Recording not found — try recording again"); return; }

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => { setPlaying(false); toast.error("Playback failed — try re-recording"); };

      setPlaying(true);
      await audio.play();
    } catch {
      setPlaying(false);
      toast.error("Could not play — try re-recording this clip");
    }
  }

  async function remove() {
    await deleteRecording(key);
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    audioRef.current = null;
    setHasRecording(false);
    toast.success("Removed");
  }

  const btnBase: React.CSSProperties = {
    border: "none", borderRadius: 10, padding: "6px 12px", fontSize: "0.78rem",
    cursor: "pointer", fontFamily: "'Fredoka One', cursive", fontWeight: 700,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <div style={{ fontSize: "0.8rem", color: "#555", width: 90, flexShrink: 0 }}>{label}</div>
      {recording ? (
        <button onClick={stopRecord} style={{ ...btnBase, background: "#ff4444", color: "white", animation: "pulse 1s infinite" }}>
          ⏹ Stop
        </button>
      ) : (
        <button onClick={startRecord} style={{ ...btnBase, background: hasRecording ? "#e0f0ff" : "#4facfe", color: hasRecording ? "#333" : "white" }}>
          🎙️ {hasRecording ? "Re-record" : "Record"}
        </button>
      )}
      {hasRecording && !recording && (
        <>
          <button onClick={playBack} disabled={playing} style={{ ...btnBase, background: "#e8f5e9", color: "#2e7d32" }}>
            {playing ? "▶ Playing…" : "▶ Play"}
          </button>
          <button onClick={remove} style={{ ...btnBase, background: "#fdecea", color: "#c62828" }}>
            🗑
          </button>
        </>
      )}
      {hasRecording && !recording && (
        <span style={{ fontSize: "0.72rem", color: "#4caf50", marginLeft: 2 }}>✓ saved</span>
      )}
    </div>
  );
}

function MumsVoice() {
  return (
    <div style={{ background: "white", borderRadius: 20, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginTop: 16 }}>
      <div style={{ fontSize: "1.1rem", color: "#1a1a2e", marginBottom: 4 }}>🎙️ Parents' Voice</div>
      <div style={{ fontSize: "0.82rem", color: "#888", marginBottom: 16 }}>
        Record your own voice for each task. Kids love hearing you!<br />
        Tap <strong>Record</strong>, speak your message, then tap <strong>Stop</strong>.
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      {TASKS.map(t => (
        <div key={t.label} style={{ background: "#f8faff", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#333", marginBottom: 10 }}>
            {t.emoji} {t.label}
          </div>
          <VoiceSlotRow taskLabel={t.label} slot="prompt" label="Task start" />
          <VoiceSlotRow taskLabel={t.label} slot="completion" label="Task done" />
        </div>
      ))}
    </div>
  );
}

// ── MUM'S EVENING PREP ──
const DEFAULT_EVENING_TASKS = [
  "Set out school clothes",
  "Pack school bag",
  "Fill water bottle",
  "Prepare lunch / snacks",
  "Charge tablet / devices",
  "Sign any letters or forms",
];

function EveningPrep() {
  const todayKey = `gj_evening_${new Date().toDateString()}`;
  const customKey = "gj_evening_custom";

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(todayKey) || "{}"); } catch { return {}; }
  });
  const [custom, setCustom] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(customKey) || "[]"); } catch { return []; }
  });
  const [newTask, setNewTask] = useState("");

  function toggle(label: string) {
    const next = { ...checked, [label]: !checked[label] };
    setChecked(next);
    localStorage.setItem(todayKey, JSON.stringify(next));
  }

  function addTask() {
    const t = newTask.trim();
    if (!t) return;
    const next = [...custom, t];
    setCustom(next);
    localStorage.setItem(customKey, JSON.stringify(next));
    setNewTask("");
  }

  function removeCustom(i: number) {
    const next = custom.filter((_, idx) => idx !== i);
    setCustom(next);
    localStorage.setItem(customKey, JSON.stringify(next));
  }

  const allTasks = [...DEFAULT_EVENING_TASKS, ...custom];
  const doneCount = allTasks.filter(t => checked[t]).length;

  return (
    <div style={{ background: "white", borderRadius: 20, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: "1.1rem", color: "#1a1a2e" }}>🌙 Tonight's Prep</div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: doneCount === allTasks.length ? "#4caf50" : "#aaa" }}>
          {doneCount}/{allTasks.length} done
        </div>
      </div>
      <div style={{ fontSize: "0.8rem", color: "#aaa", marginBottom: 14 }}>Resets each morning — your nightly checklist</div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "#f0f0f0", borderRadius: 4, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(doneCount / allTasks.length) * 100}%`, background: "linear-gradient(90deg,#4facfe,#00f2fe)", borderRadius: 4, transition: "width 0.3s" }} />
      </div>

      {allTasks.map((task, i) => (
        <div key={task + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
          <button
            onClick={() => toggle(task)}
            style={{
              width: 26, height: 26, borderRadius: 8, border: `2px solid ${checked[task] ? "#4facfe" : "#ddd"}`,
              background: checked[task] ? "#4facfe" : "white", cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}
          >{checked[task] ? "✓" : ""}</button>
          <span style={{ fontSize: "0.9rem", color: checked[task] ? "#aaa" : "#333", textDecoration: checked[task] ? "line-through" : "none", flex: 1 }}>{task}</span>
          {i >= DEFAULT_EVENING_TASKS.length && (
            <button onClick={() => removeCustom(i - DEFAULT_EVENING_TASKS.length)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16, padding: 0 }}>×</button>
          )}
        </div>
      ))}

      {/* Add custom task */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
          placeholder="Add your own task…"
          style={{ flex: 1, border: "1px solid #e0e0e0", borderRadius: 10, padding: "8px 12px", fontSize: "0.85rem", fontFamily: "inherit", outline: "none" }}
        />
        <button onClick={addTask} style={{ background: "linear-gradient(135deg,#4facfe,#00f2fe)", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Fredoka One', cursive" }}>
          +
        </button>
      </div>
    </div>
  );
}

const PLANS = [
  {
    tier: "pro" as const,
    backendTier: "plus" as const,
    label: "GlowJo",
    emoji: "🌟",
    monthly: 9.99,
    yearly: 99.90,
    features: "3 children · AI voice · Music · Bilingual EN+ES · Weekly rewards · Priority support",
    color: "rgba(255,154,60,0.35)",
    border: "rgba(255,154,60,0.7)",
    badge: "MOST POPULAR",
  },
  {
    tier: "glowjo_plus" as const,
    backendTier: "gold" as const,
    label: "GlowJo+",
    emoji: "🏆",
    monthly: 14.99,
    yearly: 149.90,
    features: "5 children · AI voice · Music · Bilingual · Night routine · SEND mode · Priority support",
    color: "rgba(167,139,250,0.35)",
    border: "rgba(167,139,250,0.7)",
    badge: "BEST VALUE",
  },
];

function UpgradeCard({ tier }: { tier: string }) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => { if (data.checkoutUrl) window.location.href = data.checkoutUrl; },
    onError: (err) => toast.error(err.message || "Failed to start checkout"),
  });
  if (tier !== "freemium") return null;

  return (
    <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: "20px", padding: "20px", color: "white", marginBottom: "20px" }}>
      <div style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "4px" }}>🌟 Upgrade GlowJo</div>
      <p style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: "14px" }}>Multiple kids · British voice · Bilingual mode</p>

      {/* Monthly / Yearly toggle */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        {(["month", "year"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: "6px 14px", borderRadius: "7px", border: "none", cursor: "pointer",
            fontFamily: "'Fredoka One', cursive", fontSize: "0.8rem",
            background: period === p ? "white" : "transparent",
            color: period === p ? "#764ba2" : "rgba(255,255,255,0.7)",
            fontWeight: 700,
          }}>
            {p === "month" ? "Monthly" : "Yearly"}
            {p === "year" && <span style={{ marginLeft: 4, fontSize: "0.65rem", background: "#ffd700", color: "#333", borderRadius: 4, padding: "1px 4px" }}>SAVE 17%</span>}
          </button>
        ))}
      </div>

      {/* Plan buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {PLANS.map(plan => (
          <button key={plan.tier}
            onClick={() => createCheckout.mutate({ tier: plan.backendTier, billingPeriod: period })}
            disabled={createCheckout.isPending}
            style={{
              background: plan.color, color: "white",
              border: `2px solid ${plan.border}`, borderRadius: "14px",
              padding: "12px 16px", cursor: "pointer", textAlign: "left",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              opacity: createCheckout.isPending ? 0.6 : 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)", position: "relative",
            }}>
            {plan.badge && (
              <span style={{ position: "absolute", top: -10, right: 12, background: "#ff5f1f", color: "white", fontSize: "0.62rem", fontWeight: 900, padding: "2px 8px", borderRadius: 20, letterSpacing: 0.5 }}>
                {plan.badge}
              </span>
            )}
            <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1rem" }}>
                {plan.emoji} {plan.label}
              </span>
              <span style={{ fontWeight: 400, fontSize: "0.72rem", opacity: 0.85 }}>{plan.features}</span>
            </span>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: "0.95rem", whiteSpace: "nowrap", marginLeft: 12 }}>
              {period === "month"
                ? `$${plan.monthly.toFixed(2)}/mo`
                : `$${plan.yearly.toFixed(2)}/yr`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { tier, daysUntilRenewal, cancelAtPeriodEnd, currentPeriodEnd } = useSubscription();
  const [editingChild, setEditingChild] = useState<Child | null | "new">(null);
  const [isNightMode, setIsNightMode] = useState(() => localStorage.getItem("gj_routine_mode") === "night");

  useEffect(() => {
    const onStorage = () => setIsNightMode(localStorage.getItem("gj_routine_mode") === "night");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { data: children = [], isLoading: childrenLoading, refetch } = trpc.app.getChildren.useQuery(undefined, { enabled: !!user });

  const createChild = trpc.app.createChild.useMutation({
    onSuccess: () => { toast.success("Child added!"); refetch(); setEditingChild(null); },
    onError: (err) => toast.error(err.message || "Failed to add child"),
  });
  const updateChild = trpc.app.updateChild.useMutation({
    onSuccess: () => { toast.success("Saved!"); refetch(); setEditingChild(null); },
    onError: (err) => toast.error(err.message || "Failed to save"),
  });
  const deleteChild = trpc.app.deleteChild.useMutation({
    onSuccess: () => { toast.success("Removed"); refetch(); },
    onError: (err) => toast.error(err.message || "Failed to remove"),
  });

  const utils = trpc.useUtils();
  const syncSubscription = trpc.stripe.syncSubscription.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        utils.subscription.getSubscription.invalidate();
        toast.success("✅ Plan activated! All features including Spanish are now unlocked.");
      }
    },
  });

  useEffect(() => {
    if (tier === "freemium" && user && !syncSubscription.isPending && !syncSubscription.isSuccess) {
      syncSubscription.mutate();
    }
  }, [tier, user]);

  const handleSave = (data: Partial<Child> & { id?: number }) => {
    if (data.id) {
      updateChild.mutate({ childId: data.id, name: data.name, age: data.age ?? undefined, schoolTime: data.schoolTime ?? undefined, reward: data.reward ?? undefined, enabledTasks: data.enabledTasks ? JSON.parse(data.enabledTasks) : undefined, avatarEmoji: data.avatarEmoji ?? undefined });
    } else {
      createChild.mutate({ name: data.name!, age: data.age ?? undefined, schoolTime: data.schoolTime ?? undefined, reward: data.reward ?? undefined, enabledTasks: data.enabledTasks ? JSON.parse(data.enabledTasks) : undefined, avatarEmoji: data.avatarEmoji ?? undefined, language: "en" });
    }
  };

  const handleDelete = (id: number) => { if (confirm("Remove this child?")) deleteChild.mutate({ childId: id }); };

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      // Clear ALL local state so no trace of the old account can leak to a new one
      localStorage.removeItem("GJ_State_v1");
      localStorage.removeItem("gj_free_mornings");
      utils.app.getChildren.reset(); // clear cached children
      utils.auth.me.reset();
      navigate("/");
    },
    onError: () => toast.error("Could not delete account — please try again"),
  });

  function handleDeleteAccount() {
    if (!window.confirm("Are you sure? This will permanently delete your account, all children's profiles and data. This cannot be undone.")) return;
    deleteAccountMutation.mutate();
  }

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { navigate("/"); },
  });
  const handleLogout = () => logoutMutation.mutate();

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "48px", animation: "spin 1s linear infinite" }}>⭐</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return <LoginPrompt />;

  const maxChildren = tier === "freemium" ? 1 : 3;

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", fontFamily: "'Fredoka One', cursive" }}>
      <div style={{ background: BG, padding: "24px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "480px", margin: "0 auto" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>GlowJo ☀️</div>
            <div style={{ color: "white", fontSize: "1.6rem" }}>Hi, {user.name?.split(" ")[0] ?? "Parent"} 👋</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem" }}>{TIER_LABELS[tier]} · {children.length}/{maxChildren} kids</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => navigate("/app")} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: "12px", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem" }}>🚀 App</button>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: "12px", padding: "8px 14px", cursor: "pointer", fontSize: "0.85rem" }}>Sign Out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto 0", padding: "16px 16px 80px" }}>

        {/* Renewal / expiry reminder for paid subscribers */}
        {tier !== "freemium" && currentPeriodEnd && (() => {
          const days = daysUntilRenewal ?? 999;
          const dateStr = currentPeriodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
          if (cancelAtPeriodEnd) {
            return (
              <div style={{ background: "rgba(220,50,50,0.1)", border: "1.5px solid rgba(220,50,50,0.4)", borderRadius: 16, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 24 }}>⚠️</div>
                <div>
                  <div style={{ fontWeight: 700, color: "#cc2222", fontSize: "0.95rem" }}>Subscription ending {dateStr}</div>
                  <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>Your plan has been cancelled and will end on this date. Renew any time from your billing portal to keep GlowJo going.</div>
                </div>
              </div>
            );
          }
          if (days <= 0) {
            return (
              <div style={{ background: "rgba(220,50,50,0.1)", border: "1.5px solid rgba(220,50,50,0.4)", borderRadius: 16, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 24 }}>🔴</div>
                <div>
                  <div style={{ fontWeight: 700, color: "#cc2222", fontSize: "0.95rem" }}>Your subscription has expired</div>
                  <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>Renew now to restore music, Parents' Voice, and all GlowJo features.</div>
                </div>
              </div>
            );
          }
          if (days <= 5) {
            return (
              <div style={{ background: "rgba(255,150,0,0.1)", border: "1.5px solid rgba(255,150,0,0.5)", borderRadius: 16, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 24 }}>🔔</div>
                <div>
                  <div style={{ fontWeight: 700, color: "#b36a00", fontSize: "0.95rem" }}>Renews in {days} day{days !== 1 ? "s" : ""} — {dateStr}</div>
                  <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>Your card will be charged automatically. Nothing to do — just a heads up!</div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "1.2rem", color: "#1a1a2e" }}>👧 My Kids</div>
          {children.length < maxChildren && (
            <button onClick={() => setEditingChild("new")} style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)", color: "white", border: "none", borderRadius: "12px", padding: "10px 16px", cursor: "pointer", fontSize: "0.9rem" }}>+ Add Kid</button>
          )}
        </div>

        {childrenLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>Loading…</div>
        ) : children.length === 0 ? (
          <div style={{ background: "white", borderRadius: "20px", padding: "40px 24px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👶</div>
            <div style={{ fontSize: "1.1rem", color: "#333", marginBottom: "8px" }}>No kids yet!</div>
            <div style={{ fontSize: "0.9rem", color: "#aaa", marginBottom: "20px" }}>Add your first child to get started</div>
            <button onClick={() => setEditingChild("new")} style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)", color: "white", border: "none", borderRadius: "14px", padding: "14px 28px", cursor: "pointer", fontSize: "1rem", fontFamily: "'Fredoka One', cursive" }}>➕ Add First Child</button>
          </div>
        ) : (
          <>
            {(children as Child[]).map(c => (
              <React.Fragment key={c.id}>
                <ChildCard child={c} onEdit={setEditingChild} onDelete={handleDelete} canDelete={children.length > 1} />
                <WeekStarChart child={c} />
              </React.Fragment>
            ))}
            <button
              onClick={() => navigate("/app")}
              style={{
                width: "100%", padding: "18px", borderRadius: "20px", border: "none",
                background: "linear-gradient(135deg, #ff9a3c, #ff5f1f)",
                color: "white", fontSize: "1.2rem", fontFamily: "'Fredoka One', cursive",
                cursor: "pointer", boxShadow: "0 6px 24px rgba(255,95,31,0.35)",
                marginBottom: "16px",
              }}
            >
              {isNightMode ? "🌙 Start Night Routine" : "🌅 Start Morning Routine"}
            </button>
          </>
        )}

        {tier !== "freemium" && <MumsVoice />}

        <EveningPrep />

        <UpgradeCard tier={tier} />

        {/* Sensory Aids cross-promo */}
        <a
          href="https://www.getsensoryaids.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", textDecoration: "none", marginTop: "8px" }}
        >
          <div style={{
            background: "linear-gradient(135deg, #e0f7fa, #b2ebf2)",
            borderRadius: "20px", padding: "18px 20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", gap: 14,
            border: "1.5px solid rgba(0,172,193,0.2)",
          }}>
            <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>🧩</div>
            <div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1rem", color: "#00838f", marginBottom: 2 }}>
                Looking for sensory resources?
              </div>
              <div style={{ fontSize: "0.82rem", color: "#00696f", lineHeight: 1.4 }}>
                Visit <strong>getsensoryaids.com</strong> — our SEND shop for tools, toys and aids that help kids thrive. ↗
              </div>
            </div>
          </div>
        </a>

        <div style={{ background: "white", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginTop: "8px" }}>
          <div style={{ fontSize: "1.1rem", color: "#1a1a2e", marginBottom: "14px" }}>⚙️ Account</div>
          <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "8px" }}>📧 {user.email ?? "No email on file"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "14px" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>🏷️ Plan:</span>
            {syncSubscription.isPending ? (
              <span style={{ fontSize: "0.85rem", color: "#ff9a3c", fontWeight: 700 }}>Checking your subscription…</span>
            ) : (
              <span style={{
                fontSize: "0.85rem", fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                background: tier === "freemium" ? "#f0f0f0" : "linear-gradient(135deg,#ff9a3c,#ff5f1f)",
                color: tier === "freemium" ? "#888" : "white",
              }}>
                {tier === "freemium" ? "Free" : tier === "gold" ? "GlowJo+ ⭐" : "GlowJo ⭐"}
              </span>
            )}
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: "12px",
              border: "2px solid #eee", background: "white",
              color: "#999", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: "12px", marginTop: "8px",
              border: "2px solid #fee2e2", background: "white",
              color: "#dc2626", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {deleteAccountMutation.isPending ? "Deleting…" : "🗑️ Delete Account"}
          </button>
        </div>
      </div>

      {editingChild !== null && (
        <EditChildModal child={editingChild === "new" ? null : editingChild} onSave={handleSave} onClose={() => setEditingChild(null)} />
      )}
    </div>
  );
}
