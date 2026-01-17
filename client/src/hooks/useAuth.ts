import { trpc } from "@/lib/trpc";
import { useClerk } from "@clerk/clerk-react";
import { useCallback } from "react";

export function useAuth() {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery();
  const clerk = useClerk();

  const login = useCallback(() => {
    // Clerk handles login redirect automatically
    window.location.href = "/login";
  }, []);

  const logout = useCallback(async () => {
    await clerk.signOut();
    window.location.href = "/login";
  }, [clerk]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetch,
  };
}
