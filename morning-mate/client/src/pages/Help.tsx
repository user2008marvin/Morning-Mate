/**
 * GlowJo — User Manual / Help Page
 * Accessible at /help
 */
import React from "react";
import { useLocation } from "wouter";

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

const SECTIONS = [
  {
    id: "what",
    emoji: "☀️",
    title: "What is GlowJo?",
    content: (
      <p>
        GlowJo is a routine app for children aged 3–12. It turns the daily school-morning rush — and the evening wind-down — into a fun,
        star-earning game that kids actually <em>want</em> to play. Less nagging, fewer late starts, calmer bedtimes.
        Kids tap through their tasks one at a time, earn stars, hear encouraging voices, and work towards a weekly reward you choose.
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
          Go to <strong>getglowjo.com</strong> on any phone, tablet, or computer. No app store download needed — it runs in the browser.
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
        <Step n={4} title="Day 2 and Every Day After — No Sign-In Needed">
          Once you have signed in on a device, <strong>GlowJo stays signed in automatically</strong> — your child can
          open the app and tap to start their routine every morning without you needing to touch it. Just bookmark{" "}
          <strong>getglowjo.com/app</strong> on the family tablet or phone and hand it to them directly.
          <Note>
            <strong>Each routine can only be completed once per day.</strong> If someone else opens the app after your
            child has finished, they will see the "All done for today!" screen — there is nothing more they can play
            or access.
          </Note>
          <Note>
            <strong>Changing device or passing it on?</strong> Always sign out first — go to the Parent Dashboard
            (tap ⚙️ in the app), scroll to the Account section, and tap <em>Sign Out</em>. This removes your account
            from that device immediately.
          </Note>
        </Step>
      </>
    ),
  },
  {
    id: "morning",
    emoji: "🌟",
    title: "Morning Routine (Child's Screen)",
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
          Seven circles below the task button represent the full week (Monday–Sunday). Each fills with ⭐ when the
          routine is completed that day. The strip <strong>resets automatically every Monday</strong> so each week
          starts fresh.
        </Sub>
        <Sub title="The Win Screen">
          When all tasks are done, Sunny celebrates! The child sees their weekly progress and a{" "}
          <strong>🏆 Full Week!</strong> celebration banner if they completed all 7 days this week, naming the reward they've earned.
          Options to Share on WhatsApp, go to the Parent Dashboard, or start a New Morning.
        </Sub>
      </>
    ),
  },
  {
    id: "night",
    emoji: "🌙",
    title: "Night Routine (Bedtime Mode)",
    content: (
      <>
        <p style={{ marginBottom: 12 }}>
          Switch to Night Mode by tapping the <strong>☀️ / 🌙 toggle</strong> at the top of the app screen. The app
          transforms into a dark, star-filled sky theme with calming music and gentler voice prompts to help children wind down.
        </p>
        <Note>The routine always resets to Morning Mode when you open the app or pick a child — a previous night session won't carry over by accident.</Note>
        <Sub title="Night Tasks">
          <table style={{ ...tableStyle, marginTop: 10 }}>
            <thead><tr><Th>Task</Th><Th>What it covers</Th></tr></thead>
            <tbody>
              {[
                ["🛁 Bath Time", "Warm bath to relax"],
                ["🪥 Brush Teeth", "Nighttime brush"],
                ["👕 Pyjamas On", "Getting cosy"],
                ["📦 Tidy Up", "Putting toys away"],
                ["📚 Story Time", "Personalised bedtime story (see below)"],
                ["💡 Lights Off", "All done — sleep tight!"],
              ].map(([t, d], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f0f4ff" : "white" }}>
                  <Td>{t}</Td><Td style={{ color: "#555" }}>{d}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Sub>
        <Sub title="Night Routine Voice">
          When night mode starts, Moony greets your child with <em>"Are you ready for your nightly routine, [name]?"</em> before reading the first task aloud.
        </Sub>
        <Sub title="✨ Story Time">
          When your child reaches Story Time:
          <ol style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li><strong>First tap</strong> — the story card slides in and Moony reads it aloud. A unique story plays for each day of the week (7 stories in English, 7 in Spanish), personalised with your child's name.</li>
            <li><strong>Second tap</strong> — once the story is finished, tap again to complete and move on to Lights Off.</li>
          </ol>
        </Sub>
        <Sub title="Night Win Screen">
          After all bedtime tasks are done, Moony says <em>"Sleep tight, [name]"</em> and the win screen shows the full bedtime story so you can read it together.
        </Sub>
      </>
    ),
  },
  {
    id: "send",
    emoji: "🧩",
    title: "SEND Mode",
    content: (
      <>
        <p style={{ marginBottom: 12 }}>
          SEND Mode is designed for children with additional sensory or neurodivergent needs. It creates a calmer, lower-stimulation
          experience without changing the routine itself.
        </p>
        <Sub title="What changes in SEND Mode">
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 4 }}>
            <li>🐢 <strong>Slower speech</strong> — Sunny and Moony speak more slowly and clearly</li>
            <li>🔇 <strong>No background music</strong> — completely silent apart from voice</li>
            <li>✨ <strong>No confetti or flashing</strong> — calm, still win screens</li>
            <li>📋 <strong>Now &amp; Next panel</strong> — shows the current task and the next one so your child knows what's coming</li>
          </ul>
        </Sub>
        <Sub title="How to turn SEND Mode on or off">
          <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Go to the <strong>Parent Dashboard</strong></li>
            <li>Find your child's card — the <strong>🧩 SEND Mode</strong> row shows OFF or ON at a glance</li>
            <li>Tap <strong>✏️ Edit</strong> on the card</li>
            <li>Toggle SEND Mode and tap <strong>Save</strong></li>
          </ol>
          <Note>Each child has their own SEND Mode setting. Siblings are not affected by each other's settings.</Note>
        </Sub>
        <Sub title="SEND Mode in Night Routine">
          SEND Mode also applies to the Night Routine — no music, slower voice, and Now &amp; Next is shown throughout the bedtime tasks.
        </Sub>
      </>
    ),
  },
  {
    id: "bilingual",
    emoji: "🌍",
    title: "Bilingual Mode (English + Spanish)",
    content: (
      <>
        <p style={{ marginBottom: 12 }}>
          GlowJo supports <strong>English and Spanish</strong> for both the morning and night routines — including all task prompts,
          praise messages, voice guidance, and the 7 personalised bedtime stories.
        </p>
        <Sub title="How to switch language">
          Tap the <strong>EN / ES</strong> buttons flanking Sunny at the top of the routine screen. The language switches instantly.
          Your choice is remembered for future sessions.
        </Sub>
        <Sub title="What's available in Spanish">
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 4 }}>
            <li>All morning task prompts and completion phrases</li>
            <li>Sunny's voice guidance throughout the morning routine</li>
            <li>All night task prompts and Moony's bedtime voice</li>
            <li>7 personalised Spanish bedtime stories in Story Time</li>
            <li>Win screen messages</li>
          </ul>
        </Sub>
        <Note>Bilingual mode is available on GlowJo ($9.99/mo) and GlowJo+ ($14.99/mo) plans.</Note>
      </>
    ),
  },
  {
    id: "multi",
    emoji: "👨‍👩‍👧‍👦",
    title: "Multi-Child Families",
    content: (
      <>
        <p style={{ marginBottom: 12 }}>
          If you have more than one child profile set up, the app shows a <strong>child picker</strong> screen when opened.
          Each child's card shows their name, avatar, stars, streak, and whether they have already completed today's routine.
        </p>
        <Sub title="Child picker">
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 4 }}>
            <li>Children who have <em>already</em> completed today show a trophy badge</li>
            <li>Morning mode shows a sunrise background; Night mode shows a dark starry sky</li>
            <li>Each child's progress (stars, streak, SEND mode) is completely independent</li>
          </ul>
        </Sub>
        <Sub title="Switching between children">
          After one child finishes, a <strong>Switch Child</strong> button appears on the win screen so the next sibling can take their turn without you needing to navigate away.
          When 2+ children still have their routine to do, the button shows the next child's name (e.g. "🌟 Sophie's Turn!").
        </Sub>
      </>
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
          Each child card shows their avatar, name, age, tasks, and SEND Mode status at a glance.
          Tap <strong>✏️ Edit</strong> to:
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.8 }}>
            <li>Change name, age, or school time</li>
            <li>Pick or change the weekly reward</li>
            <li>Toggle which tasks are included</li>
            <li>Toggle SEND Mode on or off</li>
          </ul>
          Tap <strong>+ Add Child</strong> to set up additional children (up to your plan limit).
        </Sub>
        <Sub title="Choosing a Weekly Reward">
          Pick from 12 presets or type your own:
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
            Record your own voice for each task. When your child reaches that task, they hear your voice instead of Sunny.
          </p>
          <table style={tableStyle}>
            <thead><tr><Th>What you record</Th><Th>What your child hears</Th></tr></thead>
            <tbody>
              <tr style={{ background: "#f9f9f9" }}><Td>Nothing (default)</Td><Td>Sunny's voice ☀️</Td></tr>
              <tr><Td>A clip for "Wake Up!"</Td><Td>Your voice 🎙️</Td></tr>
              <tr style={{ background: "#f9f9f9" }}><Td>Clips for all tasks</Td><Td>Your voice throughout 💛</Td></tr>
            </tbody>
          </table>
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
          A nightly checklist for parents — ticks reset each morning so it's fresh every night.
          Default tasks: School clothes · School bag · Water bottle · Lunch/snacks · Charge devices · Sign letters.
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
        <p style={{ marginBottom: 12 }}>
          GlowJo plays upbeat background music during morning routines and calm ambient music during night routines.
          Music rotates daily so a different track plays each day of the week.
        </p>
        <table style={tableStyle}>
          <thead><tr><Th>Plan</Th><Th>Morning Music</Th><Th>Night Music</Th></tr></thead>
          <tbody>
            <tr style={{ background: "#f9f9f9" }}><Td>Free</Td><Td>2 days/month</Td><Td>—</Td></tr>
            <tr><Td>GlowJo ($9.99/mo)</Td><Td>Unlimited, daily rotation</Td><Td>Unlimited, calm ambient</Td></tr>
            <tr style={{ background: "#f9f9f9" }}><Td>GlowJo+ ($14.99/mo)</Td><Td>Unlimited, daily rotation</Td><Td>Unlimited, calm ambient</Td></tr>
          </tbody>
        </table>
        <Note>SEND Mode automatically mutes music for that child — even on paid plans.</Note>
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
          <thead>
            <tr>
              <Th>Feature</Th>
              <Th>Free</Th>
              <Th>GlowJo $9.99/mo</Th>
              <Th>GlowJo+ $14.99/mo</Th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Morning routine app", "✅", "✅", "✅"],
              ["Night routine & Story Time", "✅", "✅", "✅"],
              ["Reward picker", "✅", "✅", "✅"],
              ["Tonight's Prep checklist", "✅", "✅", "✅"],
              ["Stars & weekly progress", "✅", "✅", "✅"],
              ["Full Week celebration", "✅", "✅", "✅"],
              ["2 free music days/month", "✅", "—", "—"],
              ["Unlimited daily music", "—", "✅", "✅"],
              ["Bilingual (EN + ES)", "—", "✅", "✅"],
              ["Parents' Voice recordings", "—", "✅", "✅"],
              ["SEND Mode", "—", "✅", "✅"],
              ["Multi-child handoff", "—", "✅", "✅"],
              ["Number of children", "1", "3", "5"],
              ["Priority support", "—", "✅", "✅"],
            ].map(([f, fr, pa, pl], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                <Td>{f}</Td>
                <Td style={{ textAlign: "center" }}>{fr}</Td>
                <Td style={{ textAlign: "center", color: pa === "✅" ? "#4caf50" : "#999" }}>{pa}</Td>
                <Td style={{ textAlign: "center", color: pl === "✅" ? "#4caf50" : "#999" }}>{pl}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>Annual billing available — save roughly 17% vs monthly. To upgrade: Parent Dashboard → choose your plan. Cancel any time.</Note>
        <div style={{ marginTop: 20, background: "linear-gradient(135deg, #e0f7fa, #b2ebf2)", borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ fontWeight: 700, color: "#00796b", marginBottom: 6, fontSize: 15 }}>🧩 Also recommended for families with additional needs</div>
          <p style={{ color: "#555", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Visit <a href="https://getsensoryaids.com" target="_blank" rel="noopener noreferrer" style={{ color: "#00796b", fontWeight: 700 }}>getsensoryaids.com</a> for sensory tools, fidgets, and aids that pair perfectly with GlowJo SEND Mode.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "tips",
    emoji: "💡",
    title: "Tips for Using with Kids",
    content: (
      <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
        <li><strong>Set a routine time</strong> — Open GlowJo at the same time every morning and evening so it becomes habit.</li>
        <li><strong>Let them hold the phone</strong> — Ownership matters. Kids engage more when they are in control.</li>
        <li><strong>Celebrate the win screen</strong> — Make a fuss when they finish — the app cheers, you cheer too!</li>
        <li><strong>Use the weekly reward</strong> — Mention it each morning ("Remember, if we do this all week we get Pizza Night!").</li>
        <li><strong>Record Parents' Voice</strong> — Kids respond better to a familiar voice. Even 5 seconds works wonders.</li>
        <li><strong>Tonight's Prep</strong> — Do the checklist the night before — a prepared morning is a calmer morning.</li>
        <li><strong>Night Routine</strong> — Start the bedtime flow 30 minutes before lights-out for best results.</li>
        <li><strong>SEND Mode</strong> — Check each child card in the dashboard — SEND Mode status is shown right there. Tap Edit to change it.</li>
        <li><strong>Bilingual</strong> — Tap EN or ES at the top of the screen to switch language instantly. Great for bilingual homes.</li>
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
            a: "Most browsers block audio until the user taps something. Once your child taps the start button, sound should play. Check your phone is not on silent.",
          },
          {
            q: "My child's stars have reset",
            a: "Stars are saved locally in the browser. If you cleared browser data or switched devices, log in to restore your saved progress from your account.",
          },
          {
            q: "The weekly star strip shows the wrong days",
            a: "The weekly star strip resets every Monday. Stars earned during the current week show correctly. Completing any routine this week will refresh the strip automatically.",
          },
          {
            q: "The app opened in Night Mode by mistake",
            a: "The app always resets to Morning Mode when you open it or pick a child. Use the ☀️/🌙 toggle at the top to switch modes.",
          },
          {
            q: "I signed in and was sent to payment even though I already subscribe",
            a: "Signing in now takes you straight to the app. If you ever land on a payment page unexpectedly, go back and tap Dashboard in the navigation — you are already logged in.",
          },
          {
            q: "I can't find SEND Mode",
            a: "SEND Mode is shown on every child card in the Parent Dashboard. Look for the 🧩 SEND Mode row — it shows OFF or ON. Tap Edit on the card to toggle it.",
          },
          {
            q: "The Story Time story is the same every night",
            a: "GlowJo has 7 different stories (one per day of the week). The story changes each evening at midnight.",
          },
          {
            q: "The night routine voice says the wrong greeting",
            a: "Make sure Night Mode is selected (🌙 toggle at the top). The night greeting 'Are you ready for your nightly routine?' plays a moment after the child picker or when the routine starts.",
          },
          {
            q: "Music is playing even in SEND Mode",
            a: "SEND Mode must be saved in Edit on the child's card. After saving, reload the app and pick the child again — music will be muted automatically.",
          },
          {
            q: "I can't access the Parent Dashboard",
            a: "You must be logged in. Tap Log In at the top of the page.",
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

export default function Help() {
  const [, navigate] = useLocation();

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap'); @media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div style={{ background: "linear-gradient(135deg,#ff9a3c,#ff5f1f)", padding: "40px 24px 32px", textAlign: "center" }}>
        <div className="no-print" style={{ marginBottom: 16 }}>
          <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", color: "white", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
            ← Back to GlowJo
          </button>
        </div>
        <div style={{ fontSize: 56 }}>☀️</div>
        <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "clamp(28px,7vw,48px)", color: "white", margin: "8px 0 4px" }}>GlowJo User Manual</h1>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 16 }}>Everything you need to know — v2.1</div>
        <button
          className="no-print"
          onClick={() => window.print()}
          style={{ marginTop: 20, background: "white", color: "#ff5f1f", border: "none", borderRadius: 30, padding: "10px 28px", fontFamily: "'Fredoka One',cursive", fontSize: 16, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="no-print" style={{ background: "white", borderBottom: "1px solid #eee", padding: "12px 24px", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} style={{ fontSize: 13, color: "#ff5f1f", textDecoration: "none", background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 20, padding: "4px 12px", whiteSpace: "nowrap" }}>
            {s.emoji} {s.title}
          </a>
        ))}
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px" }}>
        {SECTIONS.map(s => (
          <div key={s.id} id={s.id} style={{ background: "white", borderRadius: 20, padding: "28px 28px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 24, color: "#1a1a2e", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <span>{s.emoji}</span>{s.title}
            </h2>
            <div style={{ color: "#444", lineHeight: 1.7, fontSize: 15 }}>{s.content}</div>
          </div>
        ))}

        <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa", fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
          <strong style={{ color: "#ff5f1f" }}>GlowJo</strong> — Making mornings (and bedtimes) magical, one star at a time.<br />
          <a href="https://getglowjo.com" style={{ color: "#ff5f1f" }}>getglowjo.com</a>
        </div>
      </div>
    </div>
  );
}
