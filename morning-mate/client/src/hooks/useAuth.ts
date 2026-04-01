import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
