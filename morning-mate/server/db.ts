import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, subscriptions, childProfiles, emails, Subscription, ChildProfile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationRun = false;

function parsePoolConfig(dbUrl: string) {
  try {
    const u = new URL(dbUrl);
    return {
      host: u.hostname,
      port: parseInt(u.port || "3306"),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 5,
    };
  } catch {
    return null;
  }
}

async function runStartupMigrations(dbUrl: string) {
  if (_migrationRun) return;
  _migrationRun = true;
  try {
    const cfg = parsePoolConfig(dbUrl);
    const conn = cfg
      ? await mysql.createConnection(cfg)
      : await mysql.createConnection(dbUrl);

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`openId\` varchar(64) NOT NULL,
      \`name\` text,
      \`email\` varchar(320),
      \`passwordHash\` varchar(255),
      \`loginMethod\` varchar(64),
      \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`childProfiles\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`name\` varchar(100) NOT NULL,
      \`age\` int,
      \`schoolTime\` varchar(5),
      \`reward\` varchar(100),
      \`language\` enum('en','es') NOT NULL DEFAULT 'en',
      \`enabledTasks\` text,
      \`stars\` int DEFAULT 0,
      \`streak\` int DEFAULT 0,
      \`completedDays\` text,
      \`lastCompletedDate\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`childProfiles_id\` PRIMARY KEY(\`id\`)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`subscriptions\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`tier\` enum('freemium','starter','plus','gold') NOT NULL DEFAULT 'freemium',
      \`stripeCustomerId\` varchar(128),
      \`stripeSubscriptionId\` varchar(128),
      \`status\` enum('active','canceled','past_due','trialing') NOT NULL DEFAULT 'active',
      \`currentPeriodStart\` timestamp,
      \`currentPeriodEnd\` timestamp,
      \`cancelAtPeriodEnd\` int DEFAULT 0,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`subscriptions_id\` PRIMARY KEY(\`id\`)
    )`);

    await conn.execute(`CREATE TABLE IF NOT EXISTS \`emails\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`email\` varchar(320) NOT NULL,
      \`source\` varchar(50) DEFAULT 'landing_page',
      \`subscribedAt\` timestamp NOT NULL DEFAULT (now()),
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`emails_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`emails_email_unique\` UNIQUE(\`email\`)
    )`);

    await conn.execute(
      `ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) NULL`
    ).catch(() => {});

    await conn.execute(
      `ALTER TABLE users ADD COLUMN resetToken VARCHAR(128) NULL`
    ).catch(() => {});

    await conn.execute(
      `ALTER TABLE users ADD COLUMN resetTokenExpiry TIMESTAMP NULL`
    ).catch(() => {});

    await conn.execute(
      `ALTER TABLE childProfiles ADD COLUMN avatarEmoji VARCHAR(10) NULL`
    ).catch(() => {});

    await conn.end();
    console.log("[DB] Startup migrations complete — all tables ready");
  } catch (err) {
    console.warn("[DB] Migration warning:", err);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  // Check all possible variable names — user confirmed variable starts with DATABASE
  const rawUrl =
    process.env.GLOWJO_DATABASE_URL ||
    process.env.GLOW_DATABASE_URL ||
    process.env.GLOWDATABASE_URL ||
    process.env.GLOWJO_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    process.env.DATABASE_PUBLIC_URL;

  // Strip leading `=` if the secret was stored incorrectly (e.g. "=mysql://...")
  const dbUrl = rawUrl?.startsWith("=") ? rawUrl.slice(1) : rawUrl;

  // Log which variable was found (first 15 chars of value, no password exposed)
  const foundVar = process.env.GLOWJO_DATABASE_URL ? "GLOWJO_DATABASE_URL"
    : process.env.GLOW_DATABASE_URL ? "GLOW_DATABASE_URL"
    : process.env.GLOWDATABASE_URL ? "GLOWDATABASE_URL"
    : process.env.GLOWJO_DB_URL ? "GLOWJO_DB_URL"
    : process.env.DATABASE_URL ? "DATABASE_URL"
    : process.env.DATABASE_PRIVATE_URL ? "DATABASE_PRIVATE_URL"
    : process.env.DATABASE_PUBLIC_URL ? "DATABASE_PUBLIC_URL"
    : "NONE";
  console.log(`[DB] URL source: ${foundVar}, value starts: ${dbUrl?.slice(0,15) ?? "undefined"}`);

  if (!_db && dbUrl) {
    try {
      const cfg = parsePoolConfig(dbUrl);
      if (cfg) {
        console.log(`[DB] Connecting with pool to ${cfg.host}:${cfg.port}/${cfg.database} (SSL enabled)`);
        const pool = mysql.createPool(cfg);
        _db = drizzle(pool);
      } else {
        console.log("[DB] Falling back to URL string connection");
        _db = drizzle(dbUrl);
      }
      await runStartupMigrations(dbUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  } else if (!dbUrl) {
    console.error("[DB] No valid MySQL database URL found. Set GLOWJO_DATABASE_URL or DATABASE_URL in Railway.");
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `email:${data.email}`;
  await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  return getUserByEmail(data.email);
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function setResetToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const isoExpiry = expiry.toISOString().slice(0, 19).replace("T", " ");
  await db.execute(sql`UPDATE users SET resetToken = ${token}, resetTokenExpiry = ${isoExpiry} WHERE id = ${userId}`);
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.execute(sql`SELECT * FROM users WHERE resetToken = ${token} LIMIT 1`) as any;
  const rows = Array.isArray(result) ? result[0] : result;
  return (Array.isArray(rows) ? rows[0] : rows) ?? null;
}

export async function clearResetToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`UPDATE users SET resetToken = NULL, resetTokenExpiry = NULL WHERE id = ${userId}`);
}

// ── SUBSCRIPTION QUERIES ──

export async function getOrCreateSubscription(userId: number): Promise<Subscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new freemium subscription
  const result = await db.insert(subscriptions).values({
    userId,
    tier: "freemium",
    status: "active",
  });

  const created = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return created[0]!;
}

export async function updateSubscription(userId: number, updates: Partial<Subscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}

export async function getUserSubscription(userId: number): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ── CHILD PROFILE QUERIES ──

export async function getChildProfiles(userId: number): Promise<ChildProfile[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(childProfiles).where(eq(childProfiles.userId, userId));
}

export async function getChildProfile(childId: number): Promise<ChildProfile | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, childId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createChildProfile(userId: number, data: Omit<ChildProfile, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(childProfiles).values({
    ...data,
    userId,
  });

  const created = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, result[0].insertId))
    .limit(1);

  return created[0]!;
}

export async function updateChildProfile(childId: number, updates: Partial<ChildProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(childProfiles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(childProfiles.id, childId));
}

export async function deleteChildProfile(childId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(childProfiles).where(eq(childProfiles.id, childId));
}

export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use raw SQL with explicit transaction so all-or-nothing, and verify the user row was actually removed
  await db.execute(sql`START TRANSACTION`);
  try {
    await db.execute(sql`DELETE FROM childProfiles WHERE userId = ${userId}`);
    await db.execute(sql`DELETE FROM subscriptions WHERE userId = ${userId}`);
    const result = await db.execute(sql`DELETE FROM users WHERE id = ${userId}`) as any;
    const affectedRows = result?.[0]?.affectedRows ?? result?.affectedRows ?? 0;
    if (affectedRows === 0) {
      await db.execute(sql`ROLLBACK`);
      throw new Error(`No user found with id ${userId} — account may already be deleted`);
    }
    await db.execute(sql`COMMIT`);
    console.log(`[Auth] Account ${userId} permanently deleted`);
  } catch (err) {
    await db.execute(sql`ROLLBACK`).catch(() => {});
    throw err;
  }
}

// ── STRIPE QUERIES ──

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // Find subscription by Stripe customer ID, then get user
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);

  if (subscription.length === 0) return undefined;

  // Get user by subscription userId
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, subscription[0].userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByStripeSubscriptionId(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // Find subscription by Stripe subscription ID, then get user
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);

  if (subscription.length === 0) return undefined;

  // Get user by subscription userId
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, subscription[0].userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function cancelSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}
