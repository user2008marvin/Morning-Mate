import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, subscriptions, childProfiles, emails, Subscription, ChildProfile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationRun = false;

async function runStartupMigrations(dbUrl: string) {
  if (_migrationRun) return;
  _migrationRun = true;
  try {
    const conn = await mysql.createConnection(dbUrl);
    await conn.execute(
      `ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) NULL`
    ).catch(() => {});
    await conn.end();
    console.log("[DB] Startup migration complete");
  } catch (err) {
    console.warn("[DB] Migration warning:", err);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  const rawUrl = process.env.GLOWJO_DATABASE_URL ?? process.env.DATABASE_URL;
  // Strip leading `=` if the secret was stored incorrectly (e.g. "=mysql://...")
  const dbUrl = rawUrl?.startsWith("=") ? rawUrl.slice(1) : rawUrl;
  if (!_db && dbUrl) {
    try {
      _db = drizzle(dbUrl);
      await runStartupMigrations(dbUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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
