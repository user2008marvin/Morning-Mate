import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSessionFromRequest } from "./session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // First try JWT session from cookie
    const sessionUser = await getSessionFromRequest(opts.req);
    if (sessionUser) {
      // Convert session user to User type
      user = {
        id: sessionUser.id,
        openId: sessionUser.openId,
        name: sessionUser.name,
        email: sessionUser.email,
        loginMethod: null,
        role: sessionUser.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as User;
    } else {
      // Fallback to SDK authentication (for backward compatibility)
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
