# GlowJo — Recent Changes & Go-Live Checklist

---

## What Was Built (Recent Session)

### 1. Welcome Email on Sign-Up
Every new parent who creates a GlowJo account now receives a branded welcome email automatically.

- Sent instantly when they complete registration
- Includes their name, a warm intro message, 3 next steps (set up child profile, choose tasks, start first routine)
- Orange GlowJo branding with a "Start Your First Morning →" button linking directly to the app
- Silently skipped if Mailgun is not configured (no crash)

### 2. Forgot Password Flow
Users can now reset their password from the Sign In screen.

- "Forgot password?" link appears next to the password field on the Sign In tab
- User enters their email → receives a branded reset link (expires in 1 hour)
- Clicking the link opens `/reset-password` → they set a new password and are automatically signed in
- Secure: the token is never logged, always returns success (prevents email guessing), single-use only

### 3. Sign-Up Required Before Using the App
Previously users could bypass the app without an account.

- Every button that leads to the app ("Try 3 Mornings Free", "See Demo", "Get Started Free", pricing CTA) now opens the Sign In / Create Account modal first
- If someone types `/app` directly into the browser, they are redirected to the home page
- Once signed in, they go straight through — no interruption

### 4. One Routine Per Day (Tamper-Proof)
Previously users could replay the routine multiple times a day or bypass the limit by clearing their browser or using incognito.

- When a child completes their routine, the completion is stamped in the database with the server's clock
- On every page load, the app checks the database — if today is already marked done, they see the "All done for today!" screen
- Clearing browser storage, using incognito, a different browser, or changing the device clock no longer works
- The "All done for today!" screen shows the child's name, stars, streak, and a link to the Parent Dashboard

### 5. Monthly / Yearly Pricing Toggle
- Pricing section now has a Monthly / Yearly toggle
- **Monthly:** $4.99/month
- **Yearly:** $39.99/year — shown as "Just $3.33/month — 2 months free! 🎉" with a green "SAVE 33%" badge
- Selecting Yearly and checking out sends the user to the correct Stripe annual price
- Yearly price already created in Stripe **test mode** ✅

---

## Emails GlowJo Sends

| Trigger | Subject | What it does |
|---|---|---|
| New account created | Welcome to GlowJo ☀️ | Warm welcome, 3 next steps, link to app |
| Forgot password request | Reset your GlowJo password | Reset link, expires in 1 hour |
| Subscription started | (Stripe/existing) | Confirms subscription is active |
| Subscription cancelled | (Stripe/existing) | Notifies user, offers reactivation link |

All emails require Mailgun to be configured. Until then they are silently skipped.

---

## Go-Live Checklist

When you're ready to switch from test to production, complete every item below in order.

---

### STRIPE

- [ ] Go to **dashboard.stripe.com** → switch to **Live mode**
- [ ] Open **Products → GlowJo Starter**
- [ ] Add the **monthly price**: $4.99 / month / recurring (if not already there)
- [ ] Add the **yearly price**: $39.99 / year / recurring
- [ ] Go to **Developers → Webhooks** → Add a new live webhook pointing to:
  `https://getglowjo.com/api/stripe/webhook`
  Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Copy the **live Webhook Signing Secret** (starts with `whsec_`)

---

### MAILGUN

- [ ] In Mailgun → **Sending → Domains → Add Domain**
  Suggested: `mg.getglowjo.com` (or `mail.getglowjo.com`)
- [ ] Add the DNS records Mailgun gives you at your domain registrar (where you bought getglowjo.com)
- [ ] Wait for Mailgun to verify the domain (can take a few minutes to a few hours)
- [ ] Once verified, note your **domain name** and **Private API Key**

---

### RAILWAY — Environment Variables

Go to Railway → Morning-Mate service → **Variables** and update/add these:

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | Your live key — starts with `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Your live webhook signing secret — starts with `whsec_...` |
| `MAILGUN_API_KEY` | Your Mailgun Private API Key (the long one) |
| `MAILGUN_DOMAIN` | Your verified sending domain e.g. `mg.getglowjo.com` |
| `MAILGUN_FROM_EMAIL` | e.g. `hello@getglowjo.com` |

---

### FINAL STEP

- [ ] Click **Deploy** on Railway
- [ ] Test the full flow on getglowjo.com:
  - Sign up with a real email → check inbox for welcome email
  - Complete one morning routine → try to play again (should be blocked)
  - Try forgot password → check inbox for reset email
  - Try the yearly checkout → should open Stripe with annual billing
  - Try monthly checkout → should open Stripe with monthly billing

---

## Notes

- Test mode and live mode in Stripe are completely separate — prices created in test mode do NOT carry over to live mode
- The yearly price ($39.99) must be added in **both** Stripe test mode (already done ✅) and Stripe live mode (checklist above)
- Mailgun sandbox domains can only send to manually verified addresses — real users need the verified custom domain
- Until Mailgun is configured, welcome and reset emails are silently skipped — the app continues to work, emails just won't send
