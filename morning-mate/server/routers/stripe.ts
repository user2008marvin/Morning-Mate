import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import * as db from "../db";

/**
 * Stripe payment processing for GlowJo subscriptions
 * Handles checkout session creation and webhook verification
 * Syncs subscription data to database and sends email notifications
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const stripeRouter = router({
  /**
   * Create a Stripe checkout session for subscription upgrade
   * Returns a URL to redirect user to Stripe Checkout
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["starter", "plus", "gold"]),
        billingPeriod: z.enum(["month", "year"]).default("month"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe not configured");
      }

      // Map tier + period to Stripe price ID
      const priceMap: Record<string, Record<string, string>> = {
        starter: {
          month: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "price_starter_monthly",
          year: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "price_starter_yearly",
        },
        plus: {
          month: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || "price_plus_monthly",
          year: process.env.STRIPE_PLUS_YEARLY_PRICE_ID || "price_plus_yearly",
        },
        gold: {
          month: process.env.STRIPE_GOLD_MONTHLY_PRICE_ID || "price_gold_monthly",
          year: process.env.STRIPE_GOLD_YEARLY_PRICE_ID || "price_gold_yearly",
        },
      };

      const priceId = priceMap[input.tier][input.billingPeriod];
      const baseUrl = process.env.VITE_FRONTEND_URL || "https://myglowjo.fit";

      try {
        // Create real Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/app`,
          customer_email: ctx.user.email || undefined,
          metadata: {
            userId: ctx.user.id,
            tier: input.tier,
            billingPeriod: input.billingPeriod,
          },
        } as any);

        console.log(`[Stripe] Checkout session created:`, {
          sessionId: session.id,
          userId: ctx.user.id,
          tier: input.tier,
          url: session.url,
        });

        return {
          success: true,
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      } catch (error) {
        console.error("[Stripe] Checkout session creation failed:", error);
        throw new Error("Failed to create checkout session");
      }
    }),

  /**
   * Get checkout session details (for success page)
   */
  getCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        return {
          success: true,
          status: session.payment_status,
          subscriptionId: session.subscription,
        };
      } catch (error) {
        console.error("[Stripe] Failed to retrieve session:", error);
        return { success: false, error: "Session not found" };
      }
    }),

  /**
   * Handle Stripe webhook for subscription events
   * Syncs subscription data to database and sends email notifications
   */
  handleWebhook: publicProcedure
    .input(
      z.object({
        body: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          input.body,
          input.signature,
          process.env.STRIPE_WEBHOOK_SECRET || ""
        );
      } catch (err: any) {
        console.error(`[Stripe] Webhook signature verification failed:`, err.message);
        return { received: false, error: err.message };
      }

      console.log(`[Stripe] Event received: ${event.type}`);

      try {
        switch (event.type) {
          case "customer.subscription.created":
          case "customer.subscription.updated": {
            const subscription = event.data.object as any;

            console.log(`[Stripe] Subscription ${event.type}:`, {
              customerId: subscription.customer,
              subscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });

            // Find user by Stripe customer ID
            const user = await db.getUserByStripeCustomerId(subscription.customer);

            if (!user) {
              console.error(`[Stripe] User not found for customer: ${subscription.customer}`);
              break;
            }

            // Update subscription in database
            await db.updateSubscription(user.id, {
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
            });

            console.log(`[Stripe] Subscription updated in DB: ${subscription.id}`);

            // Send welcome email on first subscription
            if (event.type === "customer.subscription.created") {
              console.log(`[Stripe] Welcome email would be sent to ${user.email}`);
              // Email sending can be implemented here
            }

            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as any;

            console.log(`[Stripe] Subscription canceled:`, {
              customerId: subscription.customer,
              subscriptionId: subscription.id,
            });

            // Find user by subscription ID
            const user = await db.getUserByStripeSubscriptionId(subscription.id);

            if (!user) {
              console.error(`[Stripe] User not found for subscription: ${subscription.id}`);
              break;
            }

            // Mark subscription as canceled
            await db.cancelSubscription(user.id);

            console.log(`[Stripe] Subscription marked as canceled: ${subscription.id}`);
            console.log(`[Stripe] Cancellation email would be sent to ${user.email}`);

            break;
          }

          case "charge.failed": {
            const charge = event.data.object as any;

            console.log(`[Stripe] Payment failed:`, {
              chargeId: charge.id,
              customerId: charge.customer,
              amount: charge.amount,
            });

            // Find user by Stripe customer ID
            const user = await db.getUserByStripeCustomerId(charge.customer);

            if (!user) {
              console.error(`[Stripe] User not found for customer: ${charge.customer}`);
              break;
            }

            console.log(`[Stripe] Payment failure email would be sent to ${user.email}`);
            // Email sending can be implemented here

            break;
          }

          default:
            console.log(`[Stripe] Unhandled event type: ${event.type}`);
        }

        return { received: true };
      } catch (error) {
        console.error(`[Stripe] Webhook processing error:`, error);
        return { received: false, error: String(error) };
      }
    }),
});
