import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useAuth() {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const login = useCallback(() => {
    // Redirect to OAuth login
    window.location.href = "/api/auth/login";
  }, []);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    await refetch();
    window.location.href = "/login";
  }, [logoutMutation, refetch]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refetch,
  };
}
