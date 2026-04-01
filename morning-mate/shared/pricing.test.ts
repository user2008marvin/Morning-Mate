import { describe, it, expect } from "vitest";
import { hasFeatureAccess, getMaxChildProfiles, getMaxTasks, TIER_CONFIG } from "./pricing";

describe("Pricing Utilities", () => {
  describe("TIER_CONFIG", () => {
    it("should have all 4 tiers defined", () => {
      expect(Object.keys(TIER_CONFIG)).toHaveLength(4);
      expect(TIER_CONFIG).toHaveProperty("freemium");
      expect(TIER_CONFIG).toHaveProperty("starter");
      expect(TIER_CONFIG).toHaveProperty("plus");
      expect(TIER_CONFIG).toHaveProperty("gold");
    });

    it("freemium tier should have limited features", () => {
      const freemium = TIER_CONFIG.freemium;
      expect(freemium.price).toBe(0);
      expect(freemium.features.childProfiles).toBe(1);
      expect(freemium.features.maxTasks).toBe(3);
      expect(freemium.features.voiceEncouragement).toBe(false);
      expect(freemium.features.bilingualMode).toBe(false);
      expect(freemium.features.parentDashboard).toBe("none");
    });

    it("gold tier should have all features", () => {
      const gold = TIER_CONFIG.gold;
      expect(gold.price).toBe(12.99);
      expect(gold.features.childProfiles).toBe(4);
      expect(gold.features.maxTasks).toBe(6);
      expect(gold.features.voiceEncouragement).toBe(true);
      expect(gold.features.pdfReports).toBe(true);
    });
  });

  describe("hasFeatureAccess", () => {
    it("should return true for features enabled in tier", () => {
      expect(hasFeatureAccess("starter", "voiceEncouragement")).toBe(true);
      expect(hasFeatureAccess("gold", "pdfReports")).toBe(true);
    });

    it("should return false for features disabled in tier", () => {
      expect(hasFeatureAccess("freemium", "voiceEncouragement")).toBe(false);
      expect(hasFeatureAccess("starter", "pdfReports")).toBe(false);
    });
  });

  describe("getMaxChildProfiles", () => {
    it("should return correct max profiles for each tier", () => {
      expect(getMaxChildProfiles("freemium")).toBe(1);
      expect(getMaxChildProfiles("starter")).toBe(1);
      expect(getMaxChildProfiles("plus")).toBe(2);
      expect(getMaxChildProfiles("gold")).toBe(4);
    });
  });

  describe("getMaxTasks", () => {
    it("should return correct max tasks for each tier", () => {
      expect(getMaxTasks("freemium")).toBe(3);
      expect(getMaxTasks("starter")).toBe(6);
      expect(getMaxTasks("plus")).toBe(6);
      expect(getMaxTasks("gold")).toBe(6);
    });
  });
});
