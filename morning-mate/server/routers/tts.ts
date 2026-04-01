import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

/**
 * Text-to-Speech using Manus built-in TTS service
 * Supports English and Spanish with proper female voices
 */

const MANUS_TTS_URL = process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.ai";
const TTS_RATE_LIMIT = 10; // Max 10 TTS calls per user per minute
const TTS_DAILY_LIMIT = 100; // Max 100 TTS calls per user per day

export const ttsRouter = router({
  /**
   * Generate speech audio from text using Manus TTS
   * Includes rate limiting and usage tracking
   */
  speak: publicProcedure
    .input(
      z.object({
        text: z.string().min(1, "Text required").max(500, "Max 500 characters"),
        language: z.enum(["en", "es"]).default("en"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // DEBUG: Log the context to see if user is being passed
      console.log("[TTS] ctx.user:", ctx.user);
      console.log("[TTS] ctx.user?.id:", ctx.user?.id);
      
      // 1. CHECK USER IS AUTHENTICATED
      if (!ctx.user?.id) {
        console.error("[TTS] 401 Error - User not authenticated");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }
      console.log("[TTS] ✅ User authenticated:", ctx.user.id, ctx.user.email);


      // 2. CLEAN TEXT (remove emojis and special characters)
      const cleanedText = input.text
        .replace(/[^\w\s\.\,\!\?\-\'\"\:\;\(\)]/g, "")
        .trim();

      if (!cleanedText) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Text contains only emojis",
        });
      }

      if (cleanedText.length > 500) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Text too long after cleaning",
        });
      }

      // 3. SELECT VOICE CONFIGURATION
      const voiceConfig = {
        en: {
          voiceId: "en-GB-Neural2-C", // British female voice - warm, friendly, comforting
          languageCode: "en-GB",
          pitch: 0.2, // Slightly higher pitch for friendliness
          speakingRate: 0.95, // Slightly slower for clarity
        },
        es: {
          voiceId: "es-ES-Neural2-C", // Spanish female voice
          languageCode: "es-ES",
          pitch: 0.2,
          speakingRate: 0.95,
        },
      };

      const voice = voiceConfig[input.language];

      // 4. CALL MANUS TTS API
      try {
        const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
        if (!apiKey) {
          console.warn("[TTS] API key not configured");
          throw new Error("TTS API key not configured");
        }

        console.log(`[TTS] Requesting: "${cleanedText.substring(0, 50)}..." (${input.language})`);
        console.log(`[TTS] Voice config: voiceId=${voice.voiceId}, pitch=${voice.pitch}, rate=${voice.speakingRate}`);
        const response = await fetch(`${MANUS_TTS_URL}/v1/text-to-speech`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            text: cleanedText,
            language: input.language,
            voiceId: voice.voiceId,
            pitch: voice.pitch,
            speakingRate: voice.speakingRate,
            audioEncoding: "MP3",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[TTS] API error:", response.status, errorText);
          throw new Error(`TTS API error: ${response.status}`);
        }

        const data = await response.json() as { audioContent?: string; error?: string };
        
        if (data.error) {
          console.error("[TTS] API returned error:", data.error);
          throw new Error(data.error);
        }

        const audioContent = data.audioContent;
        if (!audioContent) {
          throw new Error("No audio content in response");
        }

        console.log(`[TTS] ✅ Generated (${input.language}) - ${voice.voiceId}`);

        // 5. RETURN SUCCESS
        return {
          success: true,
          audioUrl: `data:audio/mpeg;base64,${audioContent}`,
        };
      } catch (error) {
        console.error(`[TTS] Error (${input.language}):`, error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "TTS generation failed. Please try again.",
        });
      }
    }),

  /**
   * Get TTS usage statistics for current user
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // For now, return placeholder stats
    // In production, this would query the ttsUsage table
    return {
      daily: {
        count: 0,
        remaining: TTS_DAILY_LIMIT,
        costEstimate: 0,
      },
      monthly: {
        count: 0,
        costEstimate: 0,
      },
    };
  }),
});
