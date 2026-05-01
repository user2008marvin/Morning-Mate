import React from "react";
import { useLocation } from "wouter";

export default function Privacy() {
  const [, navigate] = useLocation();
  return (
    <div style={{ minHeight: "100vh", background: "#fffdf9", fontFamily: "'Nunito',sans-serif" }}>
      <nav style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0 }}>←</button>
        <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "#ff5f1f" }}>Glow<span style={{ color: "#1a1a2e" }}>Jo</span></span>
        <span style={{ color: "#aaa", fontSize: 14 }}>Privacy Policy</span>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "2rem", color: "#1a1a2e", marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ color: "#999", fontSize: 13, marginBottom: 32 }}>Last updated: April 2026</p>

        <Section title="Who we are">
          GlowJo (getglowjo.com) is a morning routine app designed to help children aged 3–12 build healthy habits. It is operated by a small independent team. If you have any questions, contact us at <a href="mailto:hello@getglowjo.com" style={{ color: "#ff5f1f" }}>hello@getglowjo.com</a>.
        </Section>

        <Section title="What data we collect">
          When you create an account we collect your <strong>email address</strong> and a securely hashed password. We also store the child profile information you enter — your child's <strong>first name, age, school start time, and chosen reward goal</strong>. We do not collect your child's surname, photo, location, or any other identifying information.
        </Section>

        <Section title="Children's data">
          GlowJo is used by parents and carers on behalf of children. <strong>We do not knowingly collect data directly from children.</strong> All accounts are created and managed by adults. The only child-related data stored is what a parent enters (first name, age, school time, reward). We keep this data only for as long as your account exists.
        </Section>

        <Section title="Voice recordings (Parents' Voice)">
          If you use the Parents' Voice feature, your voice recordings are stored <strong>locally on your device only</strong> using your browser's IndexedDB storage. They are never uploaded to our servers. Clearing your browser data or deleting the app will permanently remove them.
        </Section>

        <Section title="How we use your data">
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>To run your account and sync your child's routine across devices</li>
            <li>To remember stars earned, streak, and routine settings</li>
            <li>To send account emails (password reset, etc.) — we do not send marketing emails</li>
            <li>To process payments securely via Stripe if you subscribe to Premium</li>
          </ul>
        </Section>

        <Section title="Payments">
          Premium subscriptions are processed by <strong>Stripe</strong>. GlowJo never sees or stores your card details. Stripe's privacy policy applies to all payment data: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#ff5f1f" }}>stripe.com/privacy</a>.
        </Section>

        <Section title="Cookies and local storage">
          We use browser localStorage to save your session and app preferences (such as which child profile is active). We do not use advertising cookies or third-party tracking. We do not share any data with advertisers.
        </Section>

        <Section title="Data sharing">
          We do not sell, rent, or share your personal data with third parties, except as required to operate the service (e.g. our hosting provider) or as required by law.
        </Section>

        <Section title="Data retention and deletion">
          You can permanently delete your account and all associated data at any time from the Parent Dashboard → Account settings. Deletion removes your email, child profiles, stars, streak, and all stored data from our servers within 24 hours.
        </Section>

        <Section title="Your rights">
          Depending on where you live, you may have the right to access, correct, or delete the data we hold about you. To exercise any of these rights, email us at <a href="mailto:hello@getglowjo.com" style={{ color: "#ff5f1f" }}>hello@getglowjo.com</a> and we will respond within 30 days.
        </Section>

        <Section title="Security">
          Passwords are hashed using bcrypt and never stored in plain text. All data is transmitted over HTTPS. We use industry-standard practices to protect your data, though no system is 100% secure.
        </Section>

        <Section title="Changes to this policy">
          If we make material changes to this policy we will update the date at the top of this page. Continued use of GlowJo after changes constitutes acceptance of the updated policy.
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #eee", fontSize: 13, color: "#aaa", textAlign: "center" }}>
          © 2026 GetGlowJo. Questions? <a href="mailto:hello@getglowjo.com" style={{ color: "#ff5f1f" }}>hello@getglowjo.com</a>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: "1.1rem", color: "#ff5f1f", marginBottom: 8, marginTop: 0 }}>{title}</h2>
      <div style={{ color: "#444", fontSize: 15, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}
