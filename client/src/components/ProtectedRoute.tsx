import { useAuth } from "@/hooks/useAuth";
import { Redirect, useLocation } from "wouter";
import { ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface ProtectedRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
}

export default function ProtectedRoute({ children, requireSubscription = true }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [location] = useLocation();

  // Subscription Status holen (nur wenn User eingeloggt)
  const { data: subscription, isLoading: subLoading } = trpc.stripe.getSubscriptionStatus.useQuery(
    undefined,
    {
      enabled: !!user && requireSubscription,
    }
  );

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-sm text-slate-600">Lädt...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Skip subscription check for setup page
  if (location === "/app/setup") {
    return <>{children}</>;
  }

  // Check subscription if required
  if (requireSubscription) {
    if (subLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            <p className="text-sm text-slate-600">Subscription wird geprüft...</p>
          </div>
        </div>
      );
    }

    // Kein aktives Abo → Redirect zur Landing Page
    if (!subscription || subscription.status !== "active") {
      console.log("🔵 No active subscription, redirecting to landing page");
      return <Redirect to="/" />;
    }
  }

  // Render children if authenticated and subscribed
  return <>{children}</>;
}
