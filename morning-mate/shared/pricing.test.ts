import { describe, it, expect } from "vitest";
import { hasFeatureAccess, getMaxChildProfiles, getMaxTasks, TIER_CONFIG, isPaidTier } from "./pricing";

describe("Pricing Utilities — 2-tier model (freemium + plus)", () => {

  describe("TIER_CONFIG", () => {
    it("freemium should have limited features", () => {
      const f = TIER_CONFIG.freemium;
      expect(f.price).toBe(0);
      expect(f.features.childProfiles).toBe(2);
      expect(f.features.maxTasks).toBe(6);
      expect(f.features.voiceEncouragement).toBe(false);
      expect(f.features.bilingualMode).toBe(false);
      expect(f.features.momsVoiceMode).toBe(false);
      expect(f.features.parentDashboard).toBe("none");
    });

    it("plus should have all paid features", () => {
      const p = TIER_CONFIG.plus;
      expect(p.price).toBe(9.99);
      expect(p.yearlyPrice).toBe(79.99);
      expect(p.features.childProfiles).toBe(5);
      expect(p.features.maxTasks).toBe(6);
      expect(p.features.voiceEncouragement).toBe(true);
      expect(p.features.bilingualMode).toBe(true);
      expect(p.features.momsVoiceMode).toBe(true);
      expect(p.features.parentDashboard).toBe("full");
      expect(p.features.prioritySupport).toBe(true);
    });

    it("starter and gold should behave like plus (legacy compatibility)", () => {
      expect(TIER_CONFIG.starter.features.childProfiles).toBe(5);
      expect(TIER_CONFIG.gold.features.childProfiles).toBe(5);
      expect(TIER_CONFIG.starter.features.voiceEncouragement).toBe(true);
      expect(TIER_CONFIG.gold.features.voiceEncouragement).toBe(true);
    });
  });

  describe("isPaidTier", () => {
    it("freemium is not paid", () => {
      expect(isPaidTier("freemium")).toBe(false);
    });
    it("plus is paid", () => {
      expect(isPaidTier("plus")).toBe(true);
    });
    it("starter and gold are treated as paid", () => {
      expect(isPaidTier("starter")).toBe(true);
      expect(isPaidTier("gold")).toBe(true);
    });
  });

  describe("hasFeatureAccess", () => {
    it("freemium has no voice or bilingual", () => {
      expect(hasFeatureAccess("freemium", "voiceEncouragement")).toBe(false);
      expect(hasFeatureAccess("freemium", "bilingualMode")).toBe(false);
      expect(hasFeatureAccess("freemium", "momsVoiceMode")).toBe(false);
    });
    it("plus has voice and bilingual", () => {
      expect(hasFeatureAccess("plus", "voiceEncouragement")).toBe(true);
      expect(hasFeatureAccess("plus", "bilingualMode")).toBe(true);
      expect(hasFeatureAccess("plus", "momsVoiceMode")).toBe(true);
    });
  });

  describe("getMaxChildProfiles", () => {
    it("freemium gets 2 profiles", () => {
      expect(getMaxChildProfiles("freemium")).toBe(2);
    });
    it("plus gets 5 profiles", () => {
      expect(getMaxChildProfiles("plus")).toBe(5);
    });
  });

  describe("getMaxTasks", () => {
    it("all tiers get 6 tasks", () => {
      expect(getMaxTasks("freemium")).toBe(6);
      expect(getMaxTasks("plus")).toBe(6);
    });
  });
});
