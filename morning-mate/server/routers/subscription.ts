import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getOrCreateSubscription, getUserSubscription, updateSubscription } from "../db";
import { TIER_CONFIG, hasFeatureAccess } from "../../shared/pricing";
import { TRPCError } from "@trpc/server";

export const subscriptionRouter = router({
  /**
   * Get current user's subscription tier and features
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getOrCreateSubscription(ctx.user.id);
    const config = TIER_CONFIG[subscription.tier];
    return {
      tier: subscription.tier,
      status: subscription.status,
      features: config.features,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === 1,
    };
  }),

  /**
   * Check if user has access to a specific feature
   */
  hasFeature: protectedProcedure
    .input(z.enum(["voiceEncouragement", "bilingualMode", "momsVoiceMode", "weekendRoutines", "pdfReports", "brainBossCertificate", "abuelaAccess", "prioritySupport"]))
    .query(async ({ ctx, input }) => {
      const subscription = await getOrCreateSubscription(ctx.user.id);
      return hasFeatureAccess(subscription.tier, input);
    }),

  /**
   * Get max child profiles allowed for user's tier
   */
  getMaxChildProfiles: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await getOrCreateSubscription(ctx.user.id);
    return TIER_CONFIG[subscription.tier].features.childProfiles;
  }),

  /**
   * upgradeSubscription is disabled for direct client calls.
   * Tier changes are handled exclusively by Stripe webhooks.
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["starter", "plus", "gold"]),
        stripeCustomerId: z.string(),
        stripeSubscriptionId: z.string(),
      })
    )
    .mutation(() => {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tier upgrades are handled by Stripe webhooks only. Direct calls are not permitted.",
      });
    }),

  /**
   * Cancel subscription (user initiates)
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await getUserSubscription(ctx.user.id);
    if (!subscription) {
      throw new Error("No subscription found");
    }
    await updateSubscription(ctx.user.id, {
      cancelAtPeriodEnd: 1,
    });
    return { success: true };
  }),

  /**
   * Reactivate canceled subscription
   */
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    await updateSubscription(ctx.user.id, {
      cancelAtPeriodEnd: 0,
    });
    return { success: true };
  }),
});
