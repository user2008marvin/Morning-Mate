import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../utils/email";

export const emailRouter = router({
  sendVerification: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        childName: z.string(),
        verificationCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const verificationLink = `${process.env.APP_URL || "https://myglowjo.fit"}/verify?code=${input.verificationCode}`;

        await sendEmail({
          to: input.email,
          subject: "🎉 Verify Your Email - Morning Mate",
          template: "signup-verification",
          data: {
            childName: input.childName,
            verificationLink,
          },
        });

        console.log(`✅ Verification email sent to ${input.email}`);
        return { success: true };
      } catch (error) {
        console.error(`❌ Failed to send verification email:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email",
        });
      }
    }),

  sendWelcome: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        userName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendEmail({
          to: input.email,
          subject: "🎉 Welcome to Morning Mate!",
          template: "subscription-welcome",
          data: {
            userName: input.userName,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          },
        });

        console.log(`✅ Welcome email sent to ${input.email}`);
        return { success: true };
      } catch (error) {
        console.error(`❌ Failed to send welcome email:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send welcome email",
        });
      }
    }),
});
