import { Request, Response } from "express";
import { stripe } from "../lib/stripe";
import { getDb } from "../db";
import { subscriptions, onboardingOrders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn("🔵 WARNING: STRIPE_WEBHOOK_SECRET not set - webhooks will fail signature verification");
}

/**
 * Leitet Plan aus Stripe Price ID ab
 */
function derivePlanFromPriceId(priceId: string): "starter" | "business" | "enterprise" {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return "starter"; // Fallback
}

/**
 * Leitet Onboarding Package Type aus Stripe Price ID ab
 */
function deriveOnboardingPackage(priceId: string): "basis" | "komplett" | "enterprise" | "schulung_einzel" | "schulung_team" | "schulung_intensiv" | null {
  if (priceId === process.env.STRIPE_PRICE_ONBOARDING_BASIS) return "basis";
  if (priceId === process.env.STRIPE_PRICE_ONBOARDING_KOMPLETT) return "komplett";
  if (priceId === process.env.STRIPE_PRICE_SCHULUNG_EINZEL) return "schulung_einzel";
  if (priceId === process.env.STRIPE_PRICE_SCHULUNG_TEAM) return "schulung_team";
  if (priceId === process.env.STRIPE_PRICE_SCHULUNG_INTENSIV) return "schulung_intensiv";
  return null;
}

/**
 * Stripe Webhook Handler
 * KRITISCH: Muss mit raw body aufgerufen werden (express.raw middleware)
 */
export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig || !WEBHOOK_SECRET) {
    console.error("🔵 Webhook Error: Missing signature or webhook secret");
    return res.status(400).send("Webhook signature missing");
  }

  let event: Stripe.Event;

  try {
    // Signature verification benötigt raw body
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("🔵 Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  console.log("🔵 Webhook received:", event.type);

  const db = await getDb();
  if (!db) {
    console.error("🔵 Database not available");
    return res.status(500).send("Database error");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("🔵 Checkout completed:", session.id);

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const email = session.customer_details?.email || null;

        // Line Items holen um Plan und Onboarding zu identifizieren
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        let plan: "starter" | "business" | "enterprise" = "starter";
        let stripePriceId: string | null = null;
        const onboardingPackages: Array<{ packageType: any; priceId: string; amount: number }> = [];

        for (const item of lineItems.data) {
          const priceId = item.price?.id;
          if (!priceId) continue;

          // Ist es ein Subscription-Plan?
          if (priceId === process.env.STRIPE_PRICE_STARTER || priceId === process.env.STRIPE_PRICE_BUSINESS) {
            plan = derivePlanFromPriceId(priceId);
            stripePriceId = priceId;
          }

          // Ist es ein Onboarding-Paket?
          const onboardingPackage = deriveOnboardingPackage(priceId);
          if (onboardingPackage) {
            onboardingPackages.push({
              packageType: onboardingPackage,
              priceId: priceId,
              amount: item.amount_total || 0,
            });
          }
        }

        // Subscription in DB speichern
        await db.insert(subscriptions).values({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: stripePriceId,
          plan: plan,
          status: "active",
          email: email,
          currentPeriodEnd: session.subscription ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 Tage Fallback
        });

        console.log("🔵 Subscription created:", { customerId, plan, status: "active" });

        // Onboarding-Pakete in DB speichern
        for (const pkg of onboardingPackages) {
          await db.insert(onboardingOrders).values({
            stripeCustomerId: customerId,
            packageType: pkg.packageType,
            stripePaymentIntentId: session.payment_intent as string | null,
            status: "paid",
            amount: pkg.amount,
          });

          console.log("🔵 Onboarding order created:", pkg.packageType);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log("🔵 Subscription updated:", subscription.id);

        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? derivePlanFromPriceId(priceId) : "starter";
        const status = subscription.status;

        await db
          .update(subscriptions)
          .set({
            stripePriceId: priceId,
            plan: plan,
            status: status as any,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log("🔵 Subscription updated in DB:", { customerId, plan, status });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log("🔵 Subscription deleted:", subscription.id);

        const customerId = subscription.customer as string;

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log("🔵 Subscription canceled in DB:", customerId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        console.log("🔵 Payment failed:", invoice.id);

        const customerId = invoice.customer as string;

        await db
          .update(subscriptions)
          .set({
            status: "past_due",
          })
          .where(eq(subscriptions.stripeCustomerId, customerId));

        console.log("🔵 Subscription marked as past_due:", customerId);

        break;
      }

      default:
        console.log("🔵 Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("🔵 Webhook processing error:", error);
    res.status(500).send("Webhook processing failed");
  }
}
