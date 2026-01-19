import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getAuth, clerkClient } from "@clerk/express";
import * as db from "../db";
import { getGHLService } from "../gohighlevelService";

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

        const userData = {
          clerkId: auth.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
          name: clerkUser.fullName ?? clerkUser.firstName ?? null,
          phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
          loginMethod: "clerk",
          lastSignedIn: new Date(),
        };

        await db.upsertUser(userData);
        user = await db.getUserByClerkId(auth.userId) ?? null;

        // Automatischer GHL-Sync für neue Benutzer
        if (user && userData.email) {
          console.log("[Auth] Syncing new user to GoHighLevel:", userData.email);
          (async () => {
            try {
              const ghl = getGHLService();

              // Namen aufteilen für GHL
              const nameParts = (userData.name || '').trim().split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';

              // Contact in GHL erstellen
              const ghlContact = await ghl.createContact({
                email: userData.email!,
                firstName,
                lastName,
                name: userData.name || undefined,
                phone: userData.phone || undefined,
                tags: ['Portal-Registrierung', 'Neukunde'],
              });

              if (ghlContact && ghlContact.id) {
                // ghlContactId im User speichern
                await db.updateUser(user!.id, {
                  ghlContactId: ghlContact.id,
                  source: 'portal',
                });
                console.log("[Auth] ✓ User synced to GHL, contactId:", ghlContact.id);
              }
            } catch (error: any) {
              console.error("[Auth] Failed to sync user to GHL:", error.message);
              // GHL-Fehler soll User-Erstellung nicht blockieren
            }
          })();
        }
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
