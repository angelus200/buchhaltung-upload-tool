import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { ReactNode } from "react";

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
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

  // Redirect to home if not admin
  if (user.role !== "admin") {
    return <Redirect to="/" />;
  }

  // Render children if authenticated and admin
  return <>{children}</>;
}
