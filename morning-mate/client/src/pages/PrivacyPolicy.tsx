import React from "react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();
  return (
    <div style={{ minHeight: "100vh", background: "#fffdf9", fontFamily: "'Nunito', sans-serif", color: "#333" }}>
      <nav style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 0 }} aria-label="Back to home">←</button>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: "#ff5f1f" }}>Glow<span style={{ color: "#1a1a2e" }}>Jo</span></span>
        <span style={{ color: "#bbb", fontSize: 14 }}>/ Privacy Policy</span>
      </nav>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "44px 24px 96px" }}>
        <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "2rem", color: "#1a1a2e", marginBottom: 4, marginTop: 0 }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>Last updated: April 2026</p>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "#555", marginBottom: 36, paddingBottom: 24, borderBottom: "1px solid #f0f0f0" }}>
          GlowJo is a morning routine app designed to help children build healthy habits. We take the privacy of children very seriously. This policy explains exactly what information we collect, why we collect it, and how parents can control or delete it.
        </p>

        <Block title="1. Who this policy applies to">
          This policy applies to all users of GlowJo (getglowjo.com), including parents, carers, and children whose profiles are managed within the app. Accounts are created and managed by adults. Children do not create their own accounts.
        </Block>

        <Block title="2. What data we collect about children">
          <p>When a parent adds a child profile, we store only the following:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, marginTop: 8 }}>
            <li><strong>First name</strong> — used to personalise the app ("Good morning, Emma!")</li>
            <li><strong>Age</strong> — used to tailor the experience appropriately</li>
            <li><strong>Stars earned</strong> — number of completed routines</li>
            <li><strong>Streak</strong> — consecutive days the routine was completed</li>
            <li><strong>Routine settings</strong> — which tasks are enabled, school start time, weekly reward goal</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            <strong>We do not collect:</strong> surnames, photos, location, device identifiers, IP addresses linked to the child, behavioural data, or any other information about the child beyond what is listed above.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>No tracking.</strong> We do not use any advertising networks, social media pixels, or third-party analytics tools that process children's data. There are no cookies placed on a child's device by third parties.
          </p>
        </Block>

        <Block title="3. What data we collect about parents">
          When you create an account we store your <strong>email address</strong> and a securely hashed (bcrypt) password. We use this solely to authenticate you and to send transactional emails (e.g. password reset). We do not send marketing emails without your explicit opt-in.
        </Block>

        <Block title="4. Voice recordings (Parents' Voice)">
          If you use the Parents' Voice feature, your recordings are stored <strong>locally on your device only</strong>, in your browser's IndexedDB storage. They are never uploaded to our servers and are never accessible to anyone other than you. Clearing your browser data removes them permanently.
        </Block>

        <Block title="5. COPPA compliance (United States — children under 13)">
          GlowJo complies with the <strong>Children's Online Privacy Protection Act (COPPA)</strong>. We do not knowingly collect personal information directly from children under 13. All data about a child is entered by their parent or carer, who gives consent at account creation. We do not use children's information for advertising, profiling, or any purpose beyond operating the app. If you believe we have inadvertently collected data from a child under 13 without proper parental consent, please contact us immediately at <Link href="mailto:hello@getglowjo.com">hello@getglowjo.com</Link> and we will delete it within 48 hours.
        </Block>

        <Block title="6. GDPR-K compliance (UK — Children's Code / Age Appropriate Design Code)">
          GlowJo complies with the <strong>UK Children's Code (Age Appropriate Design Code)</strong> and the data protection obligations under the <strong>UK GDPR</strong> as they apply to children's data. Specifically:
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, marginTop: 8 }}>
            <li>We apply the <strong>best interests of the child</strong> as a primary consideration in all data decisions</li>
            <li>We collect the <strong>minimum data necessary</strong> to operate the service (data minimisation)</li>
            <li>We do not use children's data for profiling, targeted advertising, or any commercial purpose beyond the app itself</li>
            <li>We do not use nudge techniques or dark patterns to encourage children to share more data</li>
            <li>Geolocation data is not collected (the weather widget uses the browser's optional Geolocation API purely to show the local weather and does not store or transmit location data)</li>
            <li>Children's data is not shared with or processed by third parties for their own purposes</li>
          </ul>
          Our legal basis for processing children's data under UK GDPR is <strong>legitimate interests</strong> (Article 6(1)(f)) — specifically, delivering the service a parent has explicitly set up for their child — balanced against the child's right to privacy and data protection.
        </Block>

        <Block title="7. Payments">
          Premium subscriptions are processed by <strong>Stripe</strong>, a PCI-DSS certified payment processor. GlowJo never sees or stores card numbers. Stripe's privacy policy governs all payment data: <Link href="https://stripe.com/privacy">stripe.com/privacy</Link>. Stripe does not receive or process any child data.
        </Block>

        <Block title="8. Data sharing">
          We do not sell, rent, or share personal data with any third party for their own purposes. Data is shared only with the infrastructure providers necessary to run the service (hosting, database). Those providers are contractually bound to handle data in accordance with GDPR.
        </Block>

        <Block title="9. Parent's right to delete — account and all child data">
          <p>
            <strong>Deleting your account permanently removes all data we hold about you and your child — immediately and irreversibly.</strong> This includes your email address, password hash, and all child profiles (name, age, stars, streak, settings, and completed day history).
          </p>
          <p style={{ marginTop: 10 }}>
            To delete: go to <strong>Parent Dashboard → Account → Delete My Account</strong>. You can also request deletion by emailing <Link href="mailto:hello@getglowjo.com">hello@getglowjo.com</Link> and we will complete it within 48 hours.
          </p>
        </Block>

        <Block title="10. Your other rights">
          Depending on your location, you may have the right to access, correct, or port the data we hold. To exercise any right, email <Link href="mailto:hello@getglowjo.com">hello@getglowjo.com</Link>. We will respond within 30 days (UK GDPR standard) or 45 days (CCPA standard).
        </Block>

        <Block title="11. Data retention">
          We retain your data for as long as your account is active. If you delete your account, all data is removed. We do not retain backups of deleted accounts beyond 7 days.
        </Block>

        <Block title="12. Security">
          Passwords are hashed using bcrypt (never stored in plain text). All data is transmitted over HTTPS/TLS. Access to the database is restricted to authorised systems only. No system is 100% secure — if you discover a vulnerability, please email <Link href="mailto:hello@getglowjo.com">hello@getglowjo.com</Link>.
        </Block>

        <Block title="13. Changes to this policy">
          If we make material changes, we will update the date at the top of this page. Continued use of GlowJo after a material change constitutes acceptance of the updated policy.
        </Block>

        <Block title="14. Contact">
          <p>For all data requests, questions, or complaints about how we handle children's data:</p>
          <p style={{ marginTop: 8 }}>
            <strong>Email:</strong> <Link href="mailto:hello@getglowjo.com">hello@getglowjo.com</Link><br />
            <strong>Website:</strong> getglowjo.com
          </p>
          <p style={{ marginTop: 10, fontSize: 14, color: "#888" }}>
            If you are in the UK and are not satisfied with our response, you have the right to lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong> at ico.org.uk.
          </p>
        </Block>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #eee", fontSize: 13, color: "#aaa", textAlign: "center" }}>
          © 2026 GetGlowJo · <Link href="mailto:hello@getglowjo.com">hello@getglowjo.com</Link>
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.05rem", color: "#ff5f1f", marginBottom: 10, marginTop: 0 }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.85, color: "#444" }}>{children}</div>
    </div>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ color: "#ff5f1f", textDecoration: "underline" }} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
      {children}
    </a>
  );
}
