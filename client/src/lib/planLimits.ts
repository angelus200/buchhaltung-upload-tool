/**
 * Plan-Limits für Stripe Subscriptions
 */
export const PLAN_LIMITS = {
  starter: {
    maxFirmen: 1,
    maxUser: 2,
    name: "Starter",
    price: "299€/Monat",
  },
  business: {
    maxFirmen: 5,
    maxUser: 5,
    name: "Business",
    price: "499€/Monat",
  },
  enterprise: {
    maxFirmen: 999,
    maxUser: 999,
    name: "Enterprise",
    price: "Auf Anfrage",
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/**
 * Prüft ob ein Limit erreicht wurde
 */
export function isPlanLimitReached(
  plan: Plan,
  limitType: "maxFirmen" | "maxUser",
  currentCount: number
): boolean {
  const limit = PLAN_LIMITS[plan][limitType];
  return currentCount >= limit;
}

/**
 * Gibt verbleibende Anzahl zurück
 */
export function getRemainingCount(
  plan: Plan,
  limitType: "maxFirmen" | "maxUser",
  currentCount: number
): number {
  const limit = PLAN_LIMITS[plan][limitType];
  return Math.max(0, limit - currentCount);
}
