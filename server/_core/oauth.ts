import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Parse state to extract returnUrl for post-login redirect
function parseState(state: string): { redirectUri: string; returnUrl?: string } {
  try {
    const decoded = atob(state);
    // Try to parse as JSON (new format with returnUrl)
    try {
      const parsed = JSON.parse(decoded);
      return {
        redirectUri: parsed.redirectUri || decoded,
        returnUrl: parsed.returnUrl
      };
    } catch {
      // Old format: state is just the redirectUri
      return { redirectUri: decoded };
    }
  } catch {
    return { redirectUri: state };
  }
}

// Validate return URL to prevent open redirect attacks
function isValidReturnUrl(url: string): boolean {
  // Only allow relative URLs starting with /
  if (!url.startsWith("/")) return false;
  // Prevent protocol-relative URLs
  if (url.startsWith("//")) return false;
  // Prevent javascript: URLs
  if (url.toLowerCase().includes("javascript:")) return false;
  return true;
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
      console.log("[OAuth] Starting token exchange...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchange successful");
      
      console.log("[OAuth] Getting user info...");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info received:", userInfo.openId);

      if (!userInfo.openId) {
        console.error("[OAuth] openId missing from user info");
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Try to save user to database, but don't fail if DB is unavailable
      try {
        console.log("[OAuth] Upserting user to database...");
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
        });
        console.log("[OAuth] User upserted successfully");
      } catch (dbError) {
        console.warn("[OAuth] Database upsert failed, continuing without DB:", dbError);
        // Continue anyway - user can still get a session
      }

      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[OAuth] Session token created");

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Extract return URL from state and redirect
      const { returnUrl } = parseState(state);
      const redirectTo = returnUrl && isValidReturnUrl(returnUrl) ? returnUrl : "/dashboard";
      
      console.log("[OAuth] Redirecting to:", redirectTo);
      res.redirect(302, redirectTo);
    } catch (error) {
      console.error("[OAuth] Callback failed with error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "OAuth callback failed", details: errorMessage });
    }
  });
}
