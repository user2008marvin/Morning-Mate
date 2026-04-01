import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { emails } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// In-memory storage for analytics events (for real-time tracking)
const analyticsEvents: any[] = [];

export const analyticsRouter = router({
  /**
   * Capture email for newsletter - persists to database
   */
  captureEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        // Get database connection
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Check if email already exists
        const existing = await db.select().from(emails).where(eq(emails.email, input.email)).limit(1);
        if (existing.length > 0) {

          return { success: true, message: "Email already subscribed" };
        }

        // Insert email into database
        await db.insert(emails).values({
          email: input.email,
          source: "landing_page",
        });

        console.log(`[Analytics] Email captured: ${input.email}`);

        // TODO: Send welcome email via SendGrid, Mailgun, or similar
        // const sendgrid = require('@sendgrid/mail');
        // await sendgrid.send({
        //   to: input.email,
        //   from: 'hello@glowjo.com',
        //   subject: 'Welcome to GlowJo!',
        //   html: '...'
        // });

        return { success: true, message: "Email captured" };
      } catch (error) {
        console.error("[Analytics] Error capturing email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to capture email",
        });
      }
    }),

  /**
   * Track analytics event
   */
  trackEvent: publicProcedure
    .input(
      z.object({
        type: z.enum(["pageview", "event", "conversion"]),
        name: z.string().optional(),
        data: z.record(z.string(), z.any()).optional(),
        tier: z.enum(["starter", "plus", "gold"]).optional(),
        amount: z.number().optional(),
        timestamp: z.string(),
        url: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      analyticsEvents.push(input);

      console.log(`[Analytics] Event tracked: ${input.type} - ${input.name}`);

      // TODO: Send to analytics service (Mixpanel, Amplitude, PostHog, etc.)
      // const analytics = require('analytics-node');
      // analytics.track({
      //   userId: 'user-id',
      //   event: input.name,
      //   properties: input.data,
      // });

      return { success: true };
    }),

  /**
   * Get analytics summary (admin only)
   * Protected endpoint - requires admin role
   */
  getSummary: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view analytics summary",
        });
      }
      return next({ ctx });
    })
    .query(async () => {
      try {
        // Get email count from database
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const emailCount = await db.select().from(emails);

        return {
          totalEmails: emailCount.length,
          totalEvents: analyticsEvents.length,
          conversionEvents: analyticsEvents.filter((e: any) => e.type === "conversion").length,
          emails: emailCount.map((e: any) => ({
            email: e.email,
            subscribedAt: e.subscribedAt,
          })),
        };
      } catch (error) {
        console.error("[Analytics] Error getting summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get analytics summary",
        });
      }
    }),

  /**
   * Export all emails for marketing campaigns
   * Admin only
   */
  exportEmails: protectedProcedure
    .use(async ({ ctx, next }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can export emails",
        });
      }
      return next({ ctx });
    })
    .query(async () => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const allEmails = await db.select().from(emails);
        return allEmails.map((e: any) => e.email);
      } catch (error) {
        console.error("[Analytics] Error exporting emails:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export emails",
        });
      }
    }),
});
