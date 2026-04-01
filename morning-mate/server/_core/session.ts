import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";

/**
 * JWT-based session management
 * Works alongside Manus OAuth for stateless session handling
 */

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface SessionUser {
  id: number;
  openId: string;
  email: string | null;
  name: string | null;
  role: "user" | "admin";
}

/**
 * Create a JWT session token
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = Math.floor(SESSION_DURATION / 1000);

  const token = await new SignJWT({
    userId: user.id,
    openId: user.openId,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.userId as number,
      openId: payload.openId as string,
      email: (payload.email as string) || null,
      name: (payload.name as string) || null,
      role: (payload.role as "user" | "admin") || "user",
    };
  } catch (error) {
    console.warn("[Session] Token verification failed:", String(error));
    return null;
  }
}

/**
 * Set secure session cookie
 */
export function setSessionCookie(res: Response, token: string, req: import("express").Request): void {
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: SESSION_DURATION,
  });
}

/**
 * Clear session cookie on logout
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

/**
 * Extract session from request cookies
 */
export async function getSessionFromRequest(req: Request): Promise<SessionUser | null> {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
