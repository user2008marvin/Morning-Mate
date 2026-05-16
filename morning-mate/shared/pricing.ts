/**
 * GlowJo Pricing — Two tiers only: freemium (free) + plus (paid "GlowJo")
 * DB enum keeps freemium|starter|plus|gold but only freemium + plus are used.
 */

export type Tier = "freemium" | "starter" | "plus" | "gold";

export interface TierConfig {
  name: string;
  displayName: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: {
    childProfiles: number;
    voiceEncouragement: boolean;
    bilingualMode: boolean;
    parentDashboard: "none" | "view-only" | "full";
    momsVoiceMode: boolean;
    weekendRoutines: boolean;
    pdfReports: boolean;
    brainBossCertificate: boolean;
    abuelaAccess: boolean;
    prioritySupport: boolean;
    maxTasks: number;
  };
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  freemium: {
    name: "freemium",
    displayName: "Free",
    price: 0,
    yearlyPrice: 0,
    description: "Try GlowJo free",
    features: {
      childProfiles: 2,
      voiceEncouragement: false,
      bilingualMode: false,
      parentDashboard: "none",
      momsVoiceMode: false,
      weekendRoutines: false,
      pdfReports: false,
      brainBossCertificate: false,
      abuelaAccess: false,
      prioritySupport: false,
      maxTasks: 6,
    },
  },
  // plus = the ONE paid tier ("GlowJo" in UI, "GlowJo Plus" in Stripe)
  plus: {
    name: "plus",
    displayName: "GlowJo",
    price: 9.99,
    yearlyPrice: 79.99,
    description: "Everything for the whole family",
    features: {
      childProfiles: 5,
      voiceEncouragement: true,
      bilingualMode: true,
      parentDashboard: "full",
      momsVoiceMode: true,
      weekendRoutines: true,
      pdfReports: false,
      brainBossCertificate: false,
      abuelaAccess: false,
      prioritySupport: true,
      maxTasks: 6,
    },
  },
  // starter + gold kept in type only so DB enum doesn't break
  // Treat both as plus-equivalent if they appear
  starter: {
    name: "starter",
    displayName: "GlowJo",
    price: 9.99,
    yearlyPrice: 79.99,
    description: "Everything for the whole family",
    features: {
      childProfiles: 5,
      voiceEncouragement: true,
      bilingualMode: true,
      parentDashboard: "full",
      momsVoiceMode: true,
      weekendRoutines: true,
      pdfReports: false,
      brainBossCertificate: false,
      abuelaAccess: false,
      prioritySupport: true,
      maxTasks: 6,
    },
  },
  gold: {
    name: "gold",
    displayName: "GlowJo",
    price: 9.99,
    yearlyPrice: 79.99,
    description: "Everything for the whole family",
    features: {
      childProfiles: 5,
      voiceEncouragement: true,
      bilingualMode: true,
      parentDashboard: "full",
      momsVoiceMode: true,
      weekendRoutines: true,
      pdfReports: false,
      brainBossCertificate: false,
      abuelaAccess: false,
      prioritySupport: true,
      maxTasks: 6,
    },
  },
};

// Single paid tier constant — use everywhere instead of hardcoding "plus"
export const PAID_TIER = "plus" as const;

// Convenience: is this tier a paid tier?
export function isPaidTier(tier: Tier): boolean {
  return tier !== "freemium";
}

export function hasFeatureAccess(tier: Tier, feature: keyof TierConfig["features"]): boolean {
  const config = TIER_CONFIG[tier];
  const featureValue = config.features[feature];
  if (typeof featureValue === "boolean") return featureValue;
  if (typeof featureValue === "number") return featureValue > 0;
  if (typeof featureValue === "string") return featureValue !== "none";
  return false;
}

export function getMaxChildProfiles(tier: Tier): number {
  return TIER_CONFIG[tier].features.childProfiles;
}

export function getMaxTasks(tier: Tier): number {
  return TIER_CONFIG[tier].features.maxTasks;
}
