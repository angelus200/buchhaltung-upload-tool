import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getAuth, clerkClient } from "@clerk/express";
import * as db from "../db";

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
    const auth = getAuth(opts.req);

    if (auth.userId) {
      // Try to get user from database
      user = await db.getUserByClerkId(auth.userId) ?? null;

      // If user not in DB, create from Clerk data
      if (!user) {
        // Fetch full user data from Clerk API
        const clerkUser = await clerkClient.users.getUser(auth.userId);

        await db.upsertUser({
          clerkId: auth.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
          name: clerkUser.fullName ?? clerkUser.firstName ?? null,
          loginMethod: "clerk",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByClerkId(auth.userId) ?? null;
      } else {
        // Update last signed in time
        await db.upsertUser({
          clerkId: user.clerkId,
          lastSignedIn: new Date(),
        });
      }
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
