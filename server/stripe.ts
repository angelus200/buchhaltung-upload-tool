import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { stripe } from "./lib/stripe";
import Stripe from "stripe";
import { getDb } from "./db";
import { subscriptions, onboardingOrders } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Mapping: Plan → Stripe Price ID
 */
const PLAN_PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  business: process.env.STRIPE_PRICE_BUSINESS || "",
} as const;

/**
 * Mapping: Onboarding Package → Stripe Price ID
 */
const ONBOARDING_PRICE_MAP = {
  basis: process.env.STRIPE_PRICE_ONBOARDING_BASIS || "",
  komplett: process.env.STRIPE_PRICE_ONBOARDING_KOMPLETT || "",
  schulung_einzel: process.env.STRIPE_PRICE_SCHULUNG_EINZEL || "",
  schulung_team: process.env.STRIPE_PRICE_SCHULUNG_TEAM || "",
  schulung_intensiv: process.env.STRIPE_PRICE_SCHULUNG_INTENSIV || "",
} as const;

export const stripeRouter = router({
  /**
   * Erstellt eine Stripe Checkout Session für Subscription + optional Onboarding
   * PUBLIC - User ist noch nicht eingeloggt
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        plan: z.enum(["starter", "business"]),
        email: z.string().email().optional(),
        onboarding: z.enum(["basis", "komplett", "schulung_einzel", "schulung_team", "schulung_intensiv"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("🔵 Creating Stripe Checkout Session", input);

        const priceId = PLAN_PRICE_MAP[input.plan];
        if (!priceId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Plan ${input.plan} hat keine gültige Stripe Price ID`,
          });
        }

        // Line Items: Subscription + optional Onboarding
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
          {
            price: priceId,
            quantity: 1,
          },
        ];

        // Optional: Onboarding-Paket als einmaliger Kauf
        if (input.onboarding) {
          const onboardingPriceId = ONBOARDING_PRICE_MAP[input.onboarding];
          if (onboardingPriceId) {
            lineItems.push({
              price: onboardingPriceId,
              quantity: 1,
            });
          }
        }

        const appUrl = process.env.VITE_APP_URL || "https://buchhaltung-ki.app";

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: lineItems,
          success_url: `${appUrl}/sign-up?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/`,
          allow_promotion_codes: true,
          customer_email: input.email,
          metadata: {
            plan: input.plan,
            onboarding: input.onboarding || "",
          },
        });

        console.log("🔵 Checkout Session created:", session.id);

        return { url: session.url };
      } catch (error) {
        console.error("🔵 Checkout Session Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Checkout fehlgeschlagen",
        });
      }
    }),

  /**
   * Verknüpft Clerk User ID mit Stripe Customer ID nach Sign-Up
   * PROTECTED - User muss eingeloggt sein
   */
  linkUserToSubscription: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("🔵 Linking User to Subscription", { sessionId: input.sessionId, clerkUserId: ctx.user.id });

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
        }

        // Stripe Session holen
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        if (!session.customer || typeof session.customer !== "string") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Keine Customer ID in Session gefunden",
          });
        }

        // Update subscription mit clerkUserId
        const result = await db
          .update(subscriptions)
          .set({ clerkUserId: String(ctx.user.id) })
          .where(eq(subscriptions.stripeCustomerId, session.customer));

        console.log("🔵 User linked to subscription:", result);

        return { success: true };
      } catch (error) {
        console.error("🔵 Link User Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Verknüpfung fehlgeschlagen",
        });
      }
    }),

  /**
   * Holt Subscription Status für eingeloggten User
   * PROTECTED - User muss eingeloggt sein
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log("🔵 Getting Subscription Status for:", ctx.user.id);

      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      }

      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.clerkUserId, String(ctx.user.id)))
        .limit(1);

      if (!subscription) {
        console.log("🔵 No subscription found for user:", ctx.user.id);
        return null;
      }

      console.log("🔵 Subscription found:", subscription.plan, subscription.status);

      return {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    } catch (error) {
      console.error("🔵 Get Subscription Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Status-Abfrage fehlgeschlagen",
      });
    }
  }),
});
