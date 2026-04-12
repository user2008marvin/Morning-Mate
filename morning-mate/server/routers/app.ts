import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getChildProfiles, createChildProfile, updateChildProfile, deleteChildProfile, getOrCreateSubscription } from "../db";
import { getMaxChildProfiles } from "../../shared/pricing";

export const appRouter = router({
  /**
   * Get all child profiles for current user
   */
  getChildren: protectedProcedure.query(async ({ ctx }) => {
    return getChildProfiles(ctx.user.id);
  }),

  /**
   * Create a new child profile
   * Respects tier limits (freemium: 1, starter: 1, plus: 2, gold: 4)
   */
  createChild: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        age: z.number().min(3).max(12).optional(),
        schoolTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        reward: z.string().optional(),
        language: z.enum(["en", "es"]).default("en"),
        enabledTasks: z.array(z.boolean()).length(6).optional(),
        avatarEmoji: z.string().max(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check tier limits
      const subscription = await getOrCreateSubscription(ctx.user.id);
      const maxProfiles = getMaxChildProfiles(subscription.tier);
      const existing = await getChildProfiles(ctx.user.id);

      // Enforce child profile limits per tier
      if (existing.length >= maxProfiles) {
        const tierMessages: Record<string, string> = {
          freemium: "Upgrade to GlowJo to add up to 3 child profiles",
          starter: "You have reached the 3-child limit on your GlowJo plan. Upgrade to Gold for up to 4 profiles",
          plus: "Upgrade to Gold to add more child profiles",
          gold: "You have reached the maximum of 4 child profiles on the Gold plan",
        };
        throw new Error(tierMessages[subscription.tier] ?? "Child profile limit reached — please upgrade your plan");
      }

      return createChildProfile(ctx.user.id, {
        name: input.name,
        age: input.age ?? null,
        schoolTime: input.schoolTime ?? null,
        reward: input.reward ?? null,
        language: input.language,
        enabledTasks: input.enabledTasks ? JSON.stringify(input.enabledTasks) : JSON.stringify([true, true, true, true, true, true]),
        avatarEmoji: input.avatarEmoji ?? null,
        stars: 0,
        streak: 0,
        completedDays: JSON.stringify([]),
      } as any);
    }),

  /**
   * Update child profile
   */
  updateChild: protectedProcedure
    .input(
      z.object({
        childId: z.number(),
        name: z.string().optional(),
        age: z.number().optional(),
        schoolTime: z.string().optional(),
        reward: z.string().optional(),
        language: z.enum(["en", "es"]).optional(),
        enabledTasks: z.array(z.boolean()).optional(),
        avatarEmoji: z.string().max(10).optional(),
        stars: z.number().optional(),
        streak: z.number().optional(),
        completedDays: z.array(z.number()).optional(),
        markCompletedToday: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const child = await getChildProfiles(ctx.user.id);
      const found = child.find(c => c.id === input.childId);

      if (!found) {
        throw new Error("Child profile not found");
      }

      const updates: Record<string, unknown> = {};

      if (input.name !== undefined) updates.name = input.name;
      if (input.age !== undefined) updates.age = input.age;
      if (input.schoolTime !== undefined) updates.schoolTime = input.schoolTime ?? null;
      if (input.reward !== undefined) updates.reward = input.reward ?? null;
      if (input.language !== undefined) updates.language = input.language;
      if (input.enabledTasks !== undefined) updates.enabledTasks = JSON.stringify(input.enabledTasks);
      if (input.avatarEmoji !== undefined) updates.avatarEmoji = input.avatarEmoji || null;
      if (input.stars !== undefined) updates.stars = input.stars;
      if (input.streak !== undefined) updates.streak = input.streak;
      if (input.completedDays !== undefined) updates.completedDays = JSON.stringify(input.completedDays);
      if (input.markCompletedToday) updates.lastCompletedDate = new Date();

      await updateChildProfile(input.childId, updates as any);
      return { success: true };
    }),

  /**
   * Delete child profile
   */
  deleteChild: protectedProcedure
    .input(z.object({ childId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const child = await getChildProfiles(ctx.user.id);
      const found = child.find(c => c.id === input.childId);

      if (!found) {
        throw new Error("Child profile not found");
      }

      await deleteChildProfile(input.childId);
      return { success: true };
    }),

  /**
   * Record task completion for a child
   */
  completeTask: protectedProcedure
    .input(
      z.object({
        childId: z.number(),
        taskIndex: z.number().min(0).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const child = await getChildProfiles(ctx.user.id);
      const found = child.find(c => c.id === input.childId);

      if (!found) {
        throw new Error("Child profile not found");
      }

      // Increment stars
      const newStars = (found.stars || 0) + 1;

      // Check if completed all 6 tasks today
      const today = new Date().getDate();
      const completedDays = found.completedDays ? JSON.parse(found.completedDays) : [];
      let newStreak = found.streak || 0;

      if (!completedDays.includes(today)) {
        completedDays.push(today);
        newStreak = newStreak + 1;
      }

      await updateChildProfile(input.childId, {
        stars: newStars,
        streak: newStreak,
        completedDays: JSON.stringify(completedDays),
        lastCompletedDate: new Date(),
      });

      return {
        stars: newStars,
        streak: newStreak,
        completedToday: completedDays.includes(today),
      };
    }),
});
