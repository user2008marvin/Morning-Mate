import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import * as db from "../db";

/**
 * Stripe payment processing for GlowJo subscriptions
 * Handles checkout session creation and webhook verification
 * Syncs subscription data to database and sends email notifications
 */

const rawStripeKey = (process.env.STRIPE_SECRET_KEY || "").replace(/^=+/, "").trim();
const stripe = new Stripe(rawStripeKey);

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

      // Look up product by name (works across any Stripe account)
      const TIER_NAMES: Record<string, string> = {
        starter: "GlowJo Starter",
        plus:    "GlowJo Plus",
        gold:    "GlowJo Gold",
      };
      const tierName = TIER_NAMES[input.tier];
      if (!tierName) throw new Error(`Unknown tier: ${input.tier}`);

      const allProducts = await stripe.products.list({ active: true, limit: 20 });
      const product = allProducts.data.find(
        p => p.name.toLowerCase() === tierName.toLowerCase()
      );
      if (!product) {
        throw new Error(`Product "${tierName}" not found in Stripe. Visit /setup-stripe to create it.`);
      }

      // Look up the active recurring price for this product from Stripe
      const allPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        type: "recurring",
        limit: 10,
      });

      // Filter by billing interval (month/year)
      const matchingPrice = allPrices.data.find(
        p => p.recurring?.interval === input.billingPeriod
      ) ?? allPrices.data[0]; // fallback to first price if no interval match

      const priceId = matchingPrice?.id;
      if (!priceId) {
        throw new Error(`No active price found for ${input.tier}. Visit /setup-stripe to create prices.`);
      }

      const baseUrl = process.env.VITE_FRONTEND_URL || "https://getglowjo.com";

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
          payment_method_types: ["card"],
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
      } catch (error: any) {
        console.error("[Stripe] Checkout session creation failed:", error);
        const detail = error?.message || String(error);
        throw new Error(`Stripe error: ${detail}`);
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
   * Verify a completed checkout session and activate the subscription directly.
   * Used as a reliable backup in case the Stripe webhook hasn't fired yet.
   */
  verifyAndActivate: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
          expand: ["subscription"],
        });

        if (session.payment_status !== "paid") {
          return { success: false, reason: "Payment not completed" };
        }

        const metaUserId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
        const tier = session.metadata?.tier as "starter" | "plus" | "gold" | undefined;

        if (!tier || metaUserId !== ctx.user.id) {
          return { success: false, reason: "Session does not belong to this user" };
        }

        const sub = session.subscription as Stripe.Subscription | null;
        await db.updateSubscription(ctx.user.id, {
          tier,
          stripeCustomerId: (session.customer as string) ?? undefined,
          stripeSubscriptionId: sub?.id ?? undefined,
          status: "active",
        });

        console.log(`[Stripe] verifyAndActivate: activated ${tier} for user ${ctx.user.id}`);
        return { success: true, tier };
      } catch (err: any) {
        console.error("[Stripe] verifyAndActivate error:", err.message);
        return { success: false, reason: err.message };
      }
    }),

  /**
   * Sync subscription from Stripe by looking up the user's email in Stripe.
   * Fixes users who paid but are still showing as freemium (e.g. webhook never fired).
   */
  syncSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const email = ctx.user.email;
      if (!email) return { success: false, reason: "No email on account" };

      const customers = await stripe.customers.list({ email, limit: 5 });
      if (!customers.data.length) {
        return { success: false, reason: "No Stripe customer found for this email" };
      }

      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: "active",
          limit: 1,
          expand: ["data.items.data.price.product"],
        });

        if (subs.data.length > 0) {
          const sub = subs.data[0];
          const product = sub.items.data[0]?.price?.product as Stripe.Product | undefined;
          const productId = typeof product === "string" ? product : product?.id;
          const tierMap: Record<string, "starter" | "plus" | "gold"> = {
            "prod_UFv1lk6xTeRu0r": "starter",
            "prod_UFv7wwXLIFTBhw": "plus",
            "prod_UFvCIa9o0bg0Ei": "gold",
          };
          const tier = productId ? (tierMap[productId] ?? "starter") : "starter";

          await db.updateSubscription(ctx.user.id, {
            tier,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: sub.id,
            status: "active",
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : undefined,
          });

          console.log(`[Stripe] syncSubscription: activated ${tier} for user ${ctx.user.id} via customer ${customer.id}`);
          return { success: true, tier };
        }
      }

      return { success: false, reason: "No active subscription found in Stripe" };
    } catch (err: any) {
      console.error("[Stripe] syncSubscription error:", err.message);
      return { success: false, reason: err.message };
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

            // Resolve the tier from the product attached to this subscription
            let resolvedTier: "starter" | "plus" | "gold" | null = null;
            try {
              const fullSub = await stripe.subscriptions.retrieve(subscription.id, {
                expand: ["items.data.price.product"],
              });
              const product = fullSub.items.data[0]?.price?.product;
              const productName = typeof product === "object" && product !== null
                ? (product as { name?: string }).name?.toLowerCase() ?? ""
                : "";
              const productId = typeof product === "string" ? product
                : typeof product === "object" && product !== null
                ? (product as { id: string }).id : "";

              // Map by product name (preferred) or by known product ID
              const idMap: Record<string, "starter" | "plus" | "gold"> = {
                "prod_UFv1lk6xTeRu0r": "starter",
                "prod_UFv7wwXLIFTBhw": "plus",
                "prod_UFvCIa9o0bg0Ei": "gold",
              };
              if (productName.includes("starter") || productName.includes("glowjo starter")) resolvedTier = "starter";
              else if (productName.includes("plus") || productName.includes("glowjo plus")) resolvedTier = "plus";
              else if (productName.includes("gold") || productName.includes("glowjo gold")) resolvedTier = "gold";
              else if (productId && idMap[productId]) resolvedTier = idMap[productId];
            } catch (tierErr) {
              console.warn(`[Stripe] Could not resolve tier for subscription ${subscription.id}:`, tierErr);
            }

            // Update subscription in database — always include tier when we can resolve it
            const subUpdate: Parameters<typeof db.updateSubscription>[1] = {
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
            };
            if (resolvedTier) subUpdate.tier = resolvedTier;
            await db.updateSubscription(user.id, subUpdate);

            console.log(`[Stripe] Subscription updated in DB: ${subscription.id} tier=${resolvedTier ?? "unresolved"}`);

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

          case "checkout.session.completed": {
            const session = event.data.object as any;
            if (session.payment_status !== "paid") break;

            const metaUserId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
            const tier = session.metadata?.tier as "starter" | "plus" | "gold" | undefined;

            if (!tier || !metaUserId) {
              console.warn(`[Stripe] checkout.session.completed missing metadata`, session.metadata);
              break;
            }

            // Look up user in our DB
            const cusUser = await db.getUserByStripeCustomerId(session.customer);
            const targetUserId = cusUser?.id ?? metaUserId;

            await db.updateSubscription(targetUserId, {
              tier,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription ?? undefined,
              status: "active",
            });

            console.log(`[Stripe] checkout.session.completed: activated ${tier} for userId ${targetUserId}`);
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
