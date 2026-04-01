/**
 * GlowJo Pricing Tiers
 * Freemium (Free) → Starter ($2.99/mo) → Plus ($7.99/mo) → Gold ($12.99/mo)
 */

export type Tier = "freemium" | "starter" | "plus" | "gold";

export interface TierConfig {
  name: string;
  displayName: string;
  price: number;
  billingPeriod: "month" | "year";
  yearlyPrice?: number;
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
    maxTasks: number; // 3 for freemium, 6 for others
  };
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  freemium: {
    name: "freemium",
    displayName: "Freemium",
    price: 0,
    billingPeriod: "month",
    description: "Limited free tier to try the app",
    features: {
      childProfiles: 1,
      voiceEncouragement: false, // Text only
      bilingualMode: false, // English only
      parentDashboard: "none",
      momsVoiceMode: false,
      weekendRoutines: false,
      pdfReports: false,
      brainBossCertificate: false,
      abuelaAccess: false,
      prioritySupport: false,
      maxTasks: 3, // Only Wake Up, Brush Teeth, Pack Bag
    },
  },
  starter: {
    name: "starter",
    displayName: "Starter",
    price: 2.99,
    billingPeriod: "month",
    yearlyPrice: 24,
    description: "Everything you need for one child",
    features: {
      childProfiles: 1,
      voiceEncouragement: true,
      bilingualMode: true,
      parentDashboard: "view-only",
      momsVoiceMode: false,
      weekendRoutines: false,
      pdfReports: false,
      brainBossCertificate: false,
      abuelaAccess: false,
      prioritySupport: false,
      maxTasks: 6,
    },
  },
  plus: {
    name: "plus",
    displayName: "Plus",
    price: 7.99,
    billingPeriod: "month",
    yearlyPrice: 64,
    description: "Perfect for siblings",
    features: {
      childProfiles: 2,
      voiceEncouragement: true,
      bilingualMode: true,
      parentDashboard: "full",
      momsVoiceMode: true, // Mom can record her own voice
      weekendRoutines: true, // Different routines for weekdays vs weekends
      pdfReports: false,
      brainBossCertificate: false,
      abuelaAccess: false,
      prioritySupport: false,
      maxTasks: 6,
    },
  },
  gold: {
    name: "gold",
    displayName: "Gold",
    price: 12.99,
    billingPeriod: "month",
    yearlyPrice: 119,
    description: "Everything for the whole family",
    features: {
      childProfiles: 4,
      voiceEncouragement: true,
      bilingualMode: true,
      parentDashboard: "full",
      momsVoiceMode: true,
      weekendRoutines: true,
      pdfReports: true, // Weekly Brain Power reports
      brainBossCertificate: true, // Printable certificate at 500 stars
      abuelaAccess: true, // Grandma can access from 3 devices
      prioritySupport: true,
      maxTasks: 6,
    },
  },
};

export const STRIPE_PRICES = {
  starter_monthly: "price_starter_monthly", // Replace with real Stripe price ID
  starter_yearly: "price_starter_yearly",
  plus_monthly: "price_plus_monthly",
  plus_yearly: "price_plus_yearly",
  gold_monthly: "price_gold_monthly",
  gold_yearly: "price_gold_yearly",
};

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(tier: Tier, feature: keyof TierConfig["features"]): boolean {
  const config = TIER_CONFIG[tier];
  const featureValue = config.features[feature];

  // Boolean features
  if (typeof featureValue === "boolean") {
    return featureValue;
  }

  // Numeric features (childProfiles, maxTasks)
  if (typeof featureValue === "number") {
    return featureValue > 0;
  }

  // String features (parentDashboard)
  if (typeof featureValue === "string") {
    return featureValue !== "none";
  }

  return false;
}

/**
 * Get the maximum number of child profiles for a tier
 */
export function getMaxChildProfiles(tier: Tier): number {
  return TIER_CONFIG[tier].features.childProfiles;
}

/**
 * Get the maximum number of tasks for a tier
 */
export function getMaxTasks(tier: Tier): number {
  return TIER_CONFIG[tier].features.maxTasks;
}
