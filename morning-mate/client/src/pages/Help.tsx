/**
 * GlowJo — User Manual / Help Page
 * Accessible at /help
 */
import React from "react";
import { useLocation } from "wouter";

// ── SMALL HELPERS ──
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#ff9a3c,#ff5f1f)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fredoka One',cursive", fontSize: 16, flexShrink: 0 }}>{n}</div>
      <div><div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{title}</div><div style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>{children}</div></div>
    </div>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, color: "#ff5f1f", fontSize: 15, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "10px 14px", marginTop: 12, fontSize: 14, color: "#5d4037" }}>
      💡 {children}
    </div>
  );
}

const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 8, borderRadius: 10, overflow: "hidden" };
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ background: "#ff5f1f", color: "white", padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", ...style }}>{children}</td>;
}

// ── SECTIONS DATA ──
const SECTIONS = [
  {
    id: "what",
    emoji: "☀️",
    title: "What is GlowJo?",
    content: (
      <p>
        GlowJo is a morning routine app for children aged 3–12. It turns the daily school-morning rush into a fun,
        star-earning game that kids actually <em>want</em> to play — reducing stress, nagging, and late starts for
        the whole family. Kids tap through their tasks one by one, earn stars, hear encouraging voices, and work
        towards a weekly reward chosen by you.
      </p>
    ),
  },
  {
    id: "start",
    emoji: "🚀",
    title: "Getting Started",
    content: (
      <>
        <Step n={1} title="Visit the App">
          Go to <strong>getglowjo.com</strong> on any phone, tablet, or computer. No app store download needed — it
          runs in the browser.
        </Step>
        <Step n={2} title="Sign Up">
          Tap <strong>Start Free</strong> on the home page. Enter your email and choose a password.
          <Note>Signing up is free — no credit card required. Try the demo first to see GlowJo in action.</Note>
        </Step>
        <Step n={3} title="First-Time Setup">
          <p style={{ marginBottom: 8 }}>You will be asked a few quick questions:</p>
          <table style={tableStyle}>
            <thead><tr><Th>Question</Th><Th>Example</Th></tr></thead>
            <tbody>
              {[
                ["Child's name", "Emma"],
                ["Age", "3–12"],
                ["School start time", "Used for countdown clock"],
                ["Weekly reward", "Pizza Night, Movie Night…"],
                ["Tasks to include", "Tick the ones that apply"],
              ].map(([q, a], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                  <Td>{q}</Td><Td style={{ color: "#555" }}>{a}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Step>
      </>
    ),
  },
  {
    id: "routine",
    emoji: "🌟",
    title: "The Morning Routine (Child's Screen)",
    content: (
      <>
        <Sub title="Starting">
          Hand the phone or tablet to your child. They will see a sleeping sun ☀️, their name, total stars ⭐ and
          streak 🔥. Tap the big circle to wake up Sunny and begin.
        </Sub>
        <Sub title="Completing Tasks">
          Each task appears one at a time. The child taps the big button when done. Sunny reacts with praise and
          a voice message plays. A golden ring fills around the button as tasks are completed.
          <br /><br />
          <strong>Skip:</strong> If a task doesn't apply today, tap the small <em>Skip</em> button below.
        </Sub>
        <Sub title="Weekly Star Strip">
          Five circles below the task button represent Mon–Fri. Each fills with ⭐ when the routine is completed
          that day.
        </Sub>
      </>
    ),
  },
  {
    id: "win",
    emoji: "🏆",
    title: "The Win Screen",
    content: (
      <p>
        When all tasks are done, Sunny celebrates with confetti and a trophy! The child sees their weekly progress
        and can <strong>Share</strong> on WhatsApp, go to the <strong>Parent Dashboard</strong>, or start a{" "}
        <strong>New Morning</strong>.
      </p>
    ),
  },
  {
    id: "dashboard",
    emoji: "👩‍💼",
    title: "Parent Dashboard",
    content: (
      <>
        <p style={{ marginBottom: 12 }}>
          Go to <strong>getglowjo.com/parent</strong> or tap <em>Parent Dashboard</em> on the win screen.
        </p>
        <Sub title="Child Profiles">
          Tap the <strong>✏️ pencil icon</strong> to edit name, age, school time, reward, and which tasks are
          included. Tap <strong>+ Add Child</strong> to set up a second child.
        </Sub>
        <Sub title="Choosing a Weekly Reward">
          Tap any of the 12 preset rewards or type your own in the box below:
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {[
              "🍦 Ice Cream Friday","🍕 Pizza Night","🎬 Movie Night",
              "🎮 Extra Game Time","🛝 Park Trip","⭐ Choose Dinner",
              "🍫 Chocolate Treat","🎨 Arts & Crafts","🧸 New Toy / Book",
              "🏊 Swimming Trip","🎉 Friend Sleepover","🍔 Burger Night",
            ].map(r => (
              <span key={r} style={{ background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 20, padding: "4px 10px", fontSize: 13 }}>{r}</span>
            ))}
          </div>
        </Sub>
        <Sub title="🎙️ Parents' Voice (GlowJo subscribers)">
          <p style={{ marginBottom: 10 }}>
            Parents' Voice <strong>replaces Sunny's voice</strong> during the morning routine. The app checks for your
            recording first — if one exists for that task, it plays yours. If not, it falls back to Sunny.
          </p>
          <table style={tableStyle}>
            <thead><tr><Th>What parents record</Th><Th>What the child hears</Th></tr></thead>
            <tbody>
              <tr style={{ background: "#f9f9f9" }}><Td>Nothing (default)</Td><Td>Sunny's voice ☀️</Td></tr>
              <tr><Td>A recording for "Wake Up!"</Td><Td>Your voice 🎙️</Td></tr>
              <tr style={{ background: "#f9f9f9" }}><Td>Recordings for all 6 tasks</Td><Td>Your voice throughout 💛</Td></tr>
            </tbody>
          </table>
          <Note>
            The win screen celebration at the very end ("You've done it! Brilliant!") always uses Sunny's voice
            as it's a general celebration. Everything during the actual routine can be your voice.
          </Note>
          <p style={{ marginTop: 12, marginBottom: 6 }}>How to record:</p>
          <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Go to the <strong>Parent Dashboard</strong></li>
            <li>Tap <strong>🎙️ Record</strong> next to any task</li>
            <li>Speak your message (e.g. "Come on sweetheart, time to brush those teeth!")</li>
            <li>Tap <strong>Stop</strong> — saves automatically</li>
            <li>Tap <strong>▶ Play</strong> to hear it back</li>
            <li>Tap <strong>Delete</strong> to re-record</li>
          </ol>
          <Note>To fully replace Sunny, record a clip for each of the 6 tasks.</Note>
        </Sub>
        <Sub title="🌙 Tonight's Prep Checklist">
          A nightly checklist for parents. Ticks reset each morning so it's fresh every night. Default tasks:
          <ol style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li>Set out school clothes</li>
            <li>Pack school bag</li>
            <li>Fill water bottle</li>
            <li>Prepare lunch / snacks</li>
            <li>Charge tablet / devices</li>
            <li>Sign any letters or forms</li>
          </ol>
          Tap <strong>+</strong> to add your own — custom tasks carry over every night.
        </Sub>
      </>
    ),
  },
  {
    id: "music",
    emoji: "🎵",
    title: "Music",
    content: (
      <>
        <p style={{ marginBottom: 12 }}>Upbeat, child-friendly background music plays during the routine to create energy and momentum.</p>
        <table style={tableStyle}>
          <thead><tr><Th>Plan</Th><Th>Music</Th></tr></thead>
          <tbody>
            <tr style={{ background: "#f9f9f9" }}><Td>Free</Td><Td>2 days of music per month</Td></tr>
            <tr><Td>GlowJo (£4.99/mo)</Td><Td>Unlimited — different track each day of the week</Td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: "plans",
    emoji: "💛",
    title: "Plans & Pricing",
    content: (
      <>
        <table style={tableStyle}>
          <thead><tr><Th>Feature</Th><Th>Free</Th><Th>GlowJo £4.99/mo</Th></tr></thead>
          <tbody>
            {[
              ["Morning routine app", "✅", "✅"],
              ["Reward picker", "✅", "✅"],
              ["Tonight's Prep checklist", "✅", "✅"],
              ["Stars & weekly progress", "✅", "✅"],
              ["2 free music days/month", "✅", "—"],
              ["Unlimited daily music", "—", "✅"],
              ["Bilingual (EN + ES)", "—", "✅"],
              ["Parents' Voice recordings", "—", "✅"],
              ["Progress saved to account", "✅ (logged in)", "✅"],
            ].map(([f, fr, pa], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                <Td>{f}</Td>
                <Td style={{ textAlign: "center" }}>{fr}</Td>
                <Td style={{ textAlign: "center", color: pa === "✅" ? "#4caf50" : "#999" }}>{pa}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>To upgrade: go to the Parent Dashboard and tap <strong>Upgrade to GlowJo</strong>. Cancel any time.</Note>
      </>
    ),
  },
  {
    id: "tips",
    emoji: "💡",
    title: "Tips for Using with Kids",
    content: (
      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li><strong>Set a routine time</strong> — Open GlowJo at the same time every morning so it becomes habit.</li>
        <li><strong>Let them hold the phone</strong> — Ownership matters. Kids engage more when they're in control.</li>
        <li><strong>Celebrate the win screen</strong> — Make a fuss when they finish — the app cheers, you cheer too!</li>
        <li><strong>Use the weekly reward</strong> — Talk about it each morning ("Remember, if you do this all week we get Pizza Night!").</li>
        <li><strong>Record Parents' Voice</strong> — Kids respond better to a familiar voice. Even 5 seconds works wonders.</li>
        <li><strong>Tonight's Prep</strong> — Do the checklist the night before — a prepared morning is a calmer morning.</li>
      </ul>
    ),
  },
  {
    id: "troubleshoot",
    emoji: "🔧",
    title: "Troubleshooting",
    content: (
      <>
        {[
          {
            q: "The app won't play sound",
            a: "Most browsers block audio until the user taps something. Once your child taps the start button, sound should play. Check the phone isn't on silent.",
          },
          {
            q: "My child's stars have reset",
            a: "Stars are saved in the browser. If you cleared browser data or switched devices, log in to restore saved progress from your account.",
          },
          {
            q: "The weekly star circles are empty",
            a: "The weekly star strip resets each Sunday. Stars earned this week will show correctly after the next completed morning.",
          },
          {
            q: "I can't access the Parent Dashboard",
            a: "You must be logged in to view the Parent Dashboard. Tap Log In at the top of the page.",
          },
          {
            q: "Music isn't playing",
            a: "Free accounts get 2 music days per month. If your free days are used up, upgrade to GlowJo for unlimited music.",
          },
        ].map(({ q, a }, i) => (
          <div key={i} style={{ marginBottom: 16, padding: "12px 16px", background: "#f9f9f9", borderRadius: 12, borderLeft: "4px solid #ff9a3c" }}>
            <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>Q: {q}</div>
            <div style={{ color: "#555", fontSize: 15 }}>A: {a}</div>
          </div>
        ))}
      </>
    ),
  },
];

// ── PAGE ──
export default function Help() {
  const [, navigate] = useLocation();

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap'); @media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#ff9a3c,#ff5f1f)", padding: "40px 24px 32px", textAlign: "center" }}>
        <div className="no-print" style={{ marginBottom: 16 }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", color: "white", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            ← Back to GlowJo
          </button>
        </div>
        <div style={{ fontSize: 56 }}>☀️</div>
        <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(28px,7vw,48px)", color: "white", margin: "8px 0 4px" }}>GlowJo User Manual</h1>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 16 }}>Everything you need to know to get the most out of GlowJo</div>
        <button
          className="no-print"
          onClick={() => window.print()}
          style={{ marginTop: 20, background: "white", color: "#ff5f1f", border: "none", borderRadius: 30, padding: "10px 28px", fontFamily: "'Fredoka One',cursive", fontSize: 16, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Quick nav */}
      <div className="no-print" style={{ background: "white", borderBottom: "1px solid #eee", padding: "12px 24px", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{ fontSize: 13, color: "#ff5f1f", textDecoration: "none", background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 20, padding: "4px 12px", whiteSpace: "nowrap" }}>
            {s.emoji} {s.title}
          </a>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>
        {SECTIONS.map(s => (
          <div key={s.id} id={s.id} style={{ background: "white", borderRadius: 20, padding: "28px 28px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 24, color: "#1a1a2e", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span>{s.emoji}</span>{s.title}
            </h2>
            <div style={{ color: "#444", lineHeight: 1.7, fontSize: 15 }}>{s.content}</div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa", fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
          <strong style={{ color: "#ff5f1f" }}>GlowJo</strong> — Making mornings magical, one star at a time.<br />
          <a href="https://getglowjo.com" style={{ color: "#ff5f1f" }}>getglowjo.com</a>
        </div>
      </div>
    </div>
  );
}
