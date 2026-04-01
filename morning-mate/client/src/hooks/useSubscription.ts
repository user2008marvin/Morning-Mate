import { trpc } from "@/lib/trpc";
import { useAuth } from "./useAuth";

export function useSubscription() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = trpc.subscription.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const isPro = data ? data.tier !== "freemium" : false;
  const tier = data?.tier ?? "freemium";

  return {
    subscription: data ?? null,
    isLoading,
    isPro,
    tier,
    features: data?.features ?? null,
  };
}
