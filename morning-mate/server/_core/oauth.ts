import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { createSessionToken, setSessionCookie } from "./session";
import { sendEmail } from "../utils/email";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Get user from database to get ID and role
      const user = await db.getUserByOpenId(userInfo.openId);
      if (!user) {
        res.status(500).json({ error: "Failed to create user session" });
        return;
      }

      // Send welcome email to user (OAuth users are already verified by Google/Apple)
      if (user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: "🎉 Welcome to Morning Mate!",
            template: "subscription-welcome",
            data: {
              userName: user.name || "Friend",
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            },
          });
          console.log(`[OAuth] Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.warn(`[OAuth] Failed to send welcome email:`, emailError);
          // Don't fail OAuth flow if email fails - user can still login
        }
      }

      // Create JWT session token
      const sessionToken = await createSessionToken({
        id: user.id,
        openId: user.openId,
        email: user.email,
        name: user.name,
        role: user.role as "user" | "admin",
      });

      // Set secure session cookie
      setSessionCookie(res, sessionToken);

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
