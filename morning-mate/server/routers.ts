import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { subscriptionRouter } from "./routers/subscription";
import { appRouter as appFeaturesRouter } from "./routers/app";
import { ttsRouter } from "./routers/tts";
import { stripeRouter } from "./routers/stripe";
import { analyticsRouter } from "./routers/analytics";
import { emailRouter } from "./routers/email";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as db from "./db";
import { createSessionToken, setSessionCookie } from "./_core/session";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "./utils/email";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(1).max(100),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Please sign in." });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await db.createUserWithPassword({ email: input.email, name: input.name, passwordHash });
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });
        const token = await createSessionToken({ id: user.id, openId: user.openId, email: user.email, name: user.name, role: user.role as "user" | "admin" });
        setSessionCookie(ctx.res, token, ctx.req);
        const baseUrl = `${ctx.req.protocol}://${ctx.req.get("host")}`;
        sendEmail({
          to: input.email,
          subject: "Welcome to GlowJo ☀️",
          template: "welcome",
          data: { userName: input.name, appUrl: `${baseUrl}/app` },
        }).catch(() => {});
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }
        const token = await createSessionToken({ id: user.id, openId: user.openId, email: user.email, name: user.name, role: user.role as "user" | "admin" });
        setSessionCookie(ctx.res, token, ctx.req);
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        // Always return success to prevent email enumeration
        if (!user || !user.passwordHash) return { success: true };
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db.setResetToken(user.id, token, expiry);
        const host = ctx.req.get("host") || "";
        const proto = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${proto}://${host}`;
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        console.log(`[Auth] Password reset requested for ${input.email} — link: ${resetLink}`);
        try {
          await sendEmail({
            to: input.email,
            subject: "Reset your GlowJo password",
            template: "password-reset",
            data: { resetLink, userName: user.name || "there" },
          });
          console.log(`[Auth] Reset email sent to ${input.email}`);
        } catch (e) {
          console.warn("[Auth] Could not send reset email (check MAILGUN config). Link above is still valid:", e);
        }
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByResetToken(input.token);
        if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or has already been used." });
        const expiry = (user as any).resetTokenExpiry;
        if (!expiry || new Date(expiry) < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has expired. Please request a new one." });
        }
        const passwordHash = await bcrypt.hash(input.password, 10);
        await db.updateUserPassword(user.id, passwordHash);
        await db.clearResetToken(user.id);
        const token = await createSessionToken({ id: user.id, openId: user.openId, email: user.email, name: user.name, role: user.role as "user" | "admin" });
        setSessionCookie(ctx.res, token, ctx.req);
        return { success: true };
      }),

    deleteAccount: protectedProcedure
      .mutation(async ({ ctx }) => {
        const userId = ctx.user.id;
        await db.deleteUserAccount(userId);
        ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
        return { success: true };
      }),
  }),

  subscription: subscriptionRouter,
  app: appFeaturesRouter,
  tts: ttsRouter,
  stripe: stripeRouter,
  analytics: analyticsRouter,
  email: emailRouter,
});

export type AppRouter = typeof appRouter;
