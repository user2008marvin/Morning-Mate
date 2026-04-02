import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getUserByStripeCustomerId, getUserByStripeSubscriptionId, updateSubscription, cancelSubscription } from "../db";

// Map Stripe product IDs → subscription tiers (product IDs are stable, unlike price IDs)
const PRODUCT_TO_TIER: Record<string, "starter" | "plus" | "gold"> = {
  "prod_UFv1lk6xTeRu0r": "starter", // GlowJo Starter — $4.99
  "prod_UFv7wwXLIFTBhw": "plus",    // GlowJo Plus   — $9.99
  "prod_UFvCIa9o0bg0Ei": "gold",    // GlowJo Gold   — $14.99
};

function tierFromProductId(productId: string): "starter" | "plus" | "gold" {
  return PRODUCT_TO_TIER[productId] ?? "starter";
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Paths that must NEVER require authentication (static assets, PWA files)
const PUBLIC_ASSET_PATHS = [
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/robots.txt",
  "/sitemap.xml",
  "/apple-touch-icon.png",
  "/logo192.png",
  "/logo512.png",
];
const PUBLIC_ASSET_PREFIXES = ["/assets/", "/icons/", "/images/", "/static/"];

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Railway sits behind a proxy — trust the X-Forwarded-For header
  app.set("trust proxy", 1);

  // ==================== PUBLIC STATIC ASSET BYPASS ====================
  // MUST be first — before Helmet, CORS, auth, everything.
  // Serves manifest.json and other static assets with open CORS headers so
  // PWA install, OAuth flows, and browsers can always fetch them without
  // being redirected to the login page (fixes Manus custom-domain issue).
  app.use((req, res, next) => {
    const isPublicAsset =
      PUBLIC_ASSET_PATHS.includes(req.path) ||
      PUBLIC_ASSET_PREFIXES.some(prefix => req.path.startsWith(prefix));

    if (isPublicAsset) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Cache-Control", "public, max-age=86400");
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
    }
    next();
  });

  // ==================== SECURITY MIDDLEWARE ====================

  // Security: Helmet for HTTP headers (CSP, X-Frame-Options, etc.)
  app.use(helmet());

  // ==================== STRIPE WEBHOOK (BEFORE CORS & BODY PARSERS) ====================
  // CRITICAL: Stripe webhook MUST be registered BEFORE express.json() and CORS
  // because it needs the raw body for signature verification

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }), // Raw body for signature verification
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const secret = process.env.STRIPE_WEBHOOK_SECRET;

      // Validate signature and secret
      if (!sig || !secret) {
        console.error("[Stripe] Missing signature or secret");
        return res.status(400).send("Missing signature or secret");
      }

      try {
        const event = stripe.webhooks.constructEvent(req.body, sig, secret);
        console.log(`[Stripe] Webhook received: ${event.type}`);

        // checkout.session.completed — user just paid
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as any;
          const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
          const tier = session.metadata?.tier as "starter" | "plus" | "gold" | undefined;
          if (userId && tier) {
            await updateSubscription(userId, {
              tier,
              stripeCustomerId: session.customer ?? undefined,
              status: "active",
            });
            console.log(`[Stripe] Activated ${tier} for user ${userId}`);
          }
        }

        // subscription created / updated
        if (
          event.type === "customer.subscription.created" ||
          event.type === "customer.subscription.updated"
        ) {
          const sub = event.data.object as any;
          const productId = sub.items?.data?.[0]?.price?.product as string | undefined;
          const tier = productId ? tierFromProductId(productId) : undefined;
          const user = await getUserByStripeCustomerId(sub.customer);
          if (user && tier) {
            await updateSubscription(user.id, {
              tier,
              stripeCustomerId: sub.customer,
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : undefined,
              cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
            });
            console.log(`[Stripe] Updated subscription ${sub.id} → ${tier} for user ${user.id}`);
          }
        }

        // subscription cancelled
        if (event.type === "customer.subscription.deleted") {
          const sub = event.data.object as any;
          const user = await getUserByStripeSubscriptionId(sub.id);
          if (user) {
            await cancelSubscription(user.id);
            console.log(`[Stripe] Cancelled subscription for user ${user.id}`);
          }
        }

        res.json({ received: true });
      } catch (err: any) {
        console.error("[Stripe] Webhook error:", err.message);
        res.status(400).send(`Webhook error: ${err.message}`);
      }
    }
  );

  // CORS configuration (AFTER Stripe webhook)
  app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  // Rate limiting: General API limit (100 requests per 15 minutes)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health", // Skip health checks
  });
  app.use("/api/", apiLimiter);

  // Rate limiting: Stricter limit for auth endpoints (5 attempts per 15 min)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later.",
  });

  // HTTPS enforcement in production
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      // Skip for health checks (Railway pings internally over HTTP)
      if (req.path === "/health" || req.path === "/") return next();
      if (req.protocol !== "https" && req.get("x-forwarded-proto") !== "https") {
        return res.redirect(301, `https://${req.get("host")}${req.url}`);
      }
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      next();
    });
  }

  // ==================== BODY PARSERS ====================

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ==================== OAUTH & API ROUTES ====================

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Analytics endpoint (bridges to tRPC analytics router)
  app.post("/api/analytics", express.json(), (req, res) => {
    console.log("[Analytics]", req.body.type, req.body.name);
    res.json({ success: true });
  });

  // Health check endpoint — also shows DB status for diagnostics
  app.get("/health", async (req, res) => {
    const dbUrl = process.env.GLOWJO_DATABASE_URL || process.env.DATABASE_URL || "";
    let dbStatus = "no_url";
    let dbHost = "";
    if (dbUrl) {
      try {
        const u = new URL(dbUrl);
        dbHost = u.hostname;
        const { getDb } = await import("../db");
        const db = await getDb();
        dbStatus = db ? "connected" : "failed";
      } catch (e: any) {
        dbStatus = "error: " + e.message;
      }
    }
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: dbStatus,
      dbHost,
      urlFound: !!dbUrl,
      urlVar: process.env.GLOWJO_DATABASE_URL ? "GLOWJO_DATABASE_URL" : process.env.DATABASE_URL ? "DATABASE_URL" : "none",
    });
  });

  // One-time DB setup endpoint — visits this URL to create all tables
  app.get("/setup-db", async (req, res) => {
    const dbUrl = process.env.GLOWJO_DATABASE_URL || process.env.DATABASE_URL || "";
    if (!dbUrl) {
      return res.json({ success: false, error: "No database URL found" });
    }
    const results: Record<string, string> = {};
    let conn: any;
    try {
      const mysql = (await import("mysql2/promise")).default;
      const u = new URL(dbUrl);
      conn = await mysql.createConnection({
        host: u.hostname,
        port: parseInt(u.port || "4000"),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, "") || "glowjo",
        ssl: { rejectUnauthorized: false },
      });

      const tables: [string, string][] = [
        ["users", `CREATE TABLE IF NOT EXISTS users (
          id int AUTO_INCREMENT NOT NULL,
          openId varchar(64) NOT NULL,
          name text,
          email varchar(320),
          passwordHash varchar(255),
          loginMethod varchar(64),
          role enum('user','admin') NOT NULL DEFAULT 'user',
          createdAt timestamp NOT NULL DEFAULT (now()),
          updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          lastSignedIn timestamp NOT NULL DEFAULT (now()),
          PRIMARY KEY (id),
          UNIQUE KEY users_openId_unique (openId)
        )`],
        ["childProfiles", `CREATE TABLE IF NOT EXISTS childProfiles (
          id int AUTO_INCREMENT NOT NULL,
          userId int NOT NULL,
          name varchar(100) NOT NULL,
          age int,
          schoolTime varchar(5),
          reward varchar(100),
          language enum('en','es') NOT NULL DEFAULT 'en',
          enabledTasks text,
          stars int DEFAULT 0,
          streak int DEFAULT 0,
          completedDays text,
          lastCompletedDate timestamp NULL,
          createdAt timestamp NOT NULL DEFAULT (now()),
          updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )`],
        ["subscriptions", `CREATE TABLE IF NOT EXISTS subscriptions (
          id int AUTO_INCREMENT NOT NULL,
          userId int NOT NULL,
          tier enum('freemium','starter','plus','gold') NOT NULL DEFAULT 'freemium',
          stripeCustomerId varchar(128),
          stripeSubscriptionId varchar(128),
          status enum('active','canceled','past_due','trialing') NOT NULL DEFAULT 'active',
          currentPeriodStart timestamp NULL,
          currentPeriodEnd timestamp NULL,
          cancelAtPeriodEnd int DEFAULT 0,
          createdAt timestamp NOT NULL DEFAULT (now()),
          updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )`],
        ["emails", `CREATE TABLE IF NOT EXISTS emails (
          id int AUTO_INCREMENT NOT NULL,
          email varchar(320) NOT NULL,
          source varchar(50) DEFAULT 'landing_page',
          subscribedAt timestamp NOT NULL DEFAULT (now()),
          createdAt timestamp NOT NULL DEFAULT (now()),
          PRIMARY KEY (id),
          UNIQUE KEY emails_email_unique (email)
        )`],
      ];

      for (const [name, sql] of tables) {
        try {
          await conn.execute(sql);
          results[name] = "created";
        } catch (e: any) {
          results[name] = "error: " + e.message;
        }
      }
      await conn.end();
      res.json({ success: true, tables: results });
    } catch (e: any) {
      if (conn) try { await conn.end(); } catch {}
      res.json({ success: false, error: e.message, tables: results });
    }
  });

  // ==================== STATIC FILES ====================

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ==================== START SERVER ====================

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
    console.log(`[Environment] NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`[Security] Helmet enabled, CORS configured, Rate limiting active`);
  });
}

startServer().catch(console.error);
