import { describe, it, expect, beforeEach, vi } from "vitest";
import { subscriptionRouter } from "./subscription";
import * as db from "../db";

// Mock the database module
vi.mock("../db", () => ({
  getOrCreateSubscription: vi.fn(),
  getUserSubscription: vi.fn(),
  updateSubscription: vi.fn(),
}));

describe("subscriptionRouter", () => {
  const mockUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockContext = {
    user: mockUser,
    req: {} as any,
    res: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSubscription", () => {
    it("should return user subscription with tier and features", async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        tier: "starter" as const,
        status: "active" as const,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getOrCreateSubscription).mockResolvedValue(mockSubscription);

      const caller = subscriptionRouter.createCaller(mockContext);
      const result = await caller.getSubscription();

      expect(result).toHaveProperty("tier", "starter");
      expect(result).toHaveProperty("status", "active");
      expect(result).toHaveProperty("features");
      expect(result.features.childProfiles).toBe(1);
      expect(result.features.voiceEncouragement).toBe(true);
    });
  });

  describe("hasFeature", () => {
    it("should return true for features in tier", async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        tier: "plus" as const,
        status: "active" as const,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getOrCreateSubscription).mockResolvedValue(mockSubscription);

      const caller = subscriptionRouter.createCaller(mockContext);
      const result = await caller.hasFeature("momsVoiceMode");

      expect(result).toBe(true);
    });

    it("should return false for features not in tier", async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        tier: "starter" as const,
        status: "active" as const,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getOrCreateSubscription).mockResolvedValue(mockSubscription);

      const caller = subscriptionRouter.createCaller(mockContext);
      const result = await caller.hasFeature("pdfReports");

      expect(result).toBe(false);
    });
  });

  describe("getMaxChildProfiles", () => {
    it("should return correct max profiles for tier", async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        tier: "gold" as const,
        status: "active" as const,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getOrCreateSubscription).mockResolvedValue(mockSubscription);

      const caller = subscriptionRouter.createCaller(mockContext);
      const result = await caller.getMaxChildProfiles();

      expect(result).toBe(4);
    });
  });

  describe("upgradeSubscription", () => {
    it("should update subscription to new tier", async () => {
      const caller = subscriptionRouter.createCaller(mockContext);
      const result = await caller.upgradeSubscription({
        tier: "gold",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
      });

      expect(result).toEqual({ success: true });
      expect(db.updateSubscription).toHaveBeenCalledWith(1, {
        tier: "gold",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        status: "active",
      });
    });
  });

  describe("cancelSubscription", () => {
    it("should mark subscription for cancellation", async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        tier: "gold" as const,
        status: "active" as const,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserSubscription).mockResolvedValue(mockSubscription);

      const caller = subscriptionRouter.createCaller(mockContext);
      const result = await caller.cancelSubscription();

      expect(result).toEqual({ success: true });
      expect(db.updateSubscription).toHaveBeenCalledWith(1, {
        cancelAtPeriodEnd: 1,
      });
    });
  });
});
