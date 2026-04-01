import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getOrCreateSubscription, getUserSubscription, updateSubscription } from "../db";
import { TIER_CONFIG, hasFeatureAccess } from "../../shared/pricing";

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
   * Upgrade subscription (called after Stripe payment)
   * This is called by the Stripe webhook
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["starter", "plus", "gold"]),
        stripeCustomerId: z.string(),
        stripeSubscriptionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateSubscription(ctx.user.id, {
        tier: input.tier,
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        status: "active",
      });

      return { success: true };
    }),

  /**
   * Cancel subscription (user initiates)
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await getUserSubscription(ctx.user.id);
    if (!subscription) {
      throw new Error("No subscription found");
    }

    // Mark for cancellation at end of period
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
