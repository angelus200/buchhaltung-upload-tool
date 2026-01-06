import { trpc } from "@/lib/trpc";
import { useCallback } from "react";
import { getLoginUrl } from "@/const";

export function useAuth() {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const login = useCallback(() => {
    // Redirect to OAuth portal login
    window.location.href = getLoginUrl();
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
