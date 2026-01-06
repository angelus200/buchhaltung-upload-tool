import { describe, it, expect } from "vitest";

// Test the state parsing and URL validation logic
describe("Return URL nach Login", () => {
  // Helper function to parse state (same logic as in oauth.ts)
  function parseState(state: string): { redirectUri: string; returnUrl?: string } {
    try {
      const decoded = atob(state);
      try {
        const parsed = JSON.parse(decoded);
        return {
          redirectUri: parsed.redirectUri || decoded,
          returnUrl: parsed.returnUrl
        };
      } catch {
        return { redirectUri: decoded };
      }
    } catch {
      return { redirectUri: state };
    }
  }

  // Helper function to validate return URL
  function isValidReturnUrl(url: string): boolean {
    if (!url.startsWith("/")) return false;
    if (url.startsWith("//")) return false;
    if (url.toLowerCase().includes("javascript:")) return false;
    return true;
  }

  describe("State Parsing", () => {
    it("sollte neues JSON-Format mit returnUrl parsen", () => {
      const stateData = JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
        returnUrl: "/buchungen"
      });
      const state = btoa(stateData);
      
      const result = parseState(state);
      expect(result.redirectUri).toBe("https://example.com/api/oauth/callback");
      expect(result.returnUrl).toBe("/buchungen");
    });

    it("sollte altes Format (nur redirectUri) unterstützen", () => {
      const redirectUri = "https://example.com/api/oauth/callback";
      const state = btoa(redirectUri);
      
      const result = parseState(state);
      expect(result.redirectUri).toBe(redirectUri);
      expect(result.returnUrl).toBeUndefined();
    });

    it("sollte ungültigen State graceful behandeln", () => {
      const result = parseState("invalid-base64!!!");
      expect(result.redirectUri).toBe("invalid-base64!!!");
      expect(result.returnUrl).toBeUndefined();
    });
  });

  describe("Return URL Validierung", () => {
    it("sollte gültige relative URLs akzeptieren", () => {
      expect(isValidReturnUrl("/dashboard")).toBe(true);
      expect(isValidReturnUrl("/buchungen")).toBe(true);
      expect(isValidReturnUrl("/stammdaten/konten")).toBe(true);
      expect(isValidReturnUrl("/kalender?month=2026-01")).toBe(true);
    });

    it("sollte absolute URLs ablehnen", () => {
      expect(isValidReturnUrl("https://evil.com")).toBe(false);
      expect(isValidReturnUrl("http://evil.com")).toBe(false);
    });

    it("sollte protocol-relative URLs ablehnen", () => {
      expect(isValidReturnUrl("//evil.com")).toBe(false);
      expect(isValidReturnUrl("//evil.com/path")).toBe(false);
    });

    it("sollte javascript: URLs ablehnen", () => {
      expect(isValidReturnUrl("javascript:alert(1)")).toBe(false);
      expect(isValidReturnUrl("JAVASCRIPT:alert(1)")).toBe(false);
      expect(isValidReturnUrl("/path?x=javascript:alert(1)")).toBe(false);
    });

    it("sollte URLs ohne führenden Slash ablehnen", () => {
      expect(isValidReturnUrl("dashboard")).toBe(false);
      expect(isValidReturnUrl("evil.com/path")).toBe(false);
    });
  });

  describe("Integration", () => {
    it("sollte returnUrl aus State extrahieren und validieren", () => {
      const stateData = JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
        returnUrl: "/kennzahlen"
      });
      const state = btoa(stateData);
      
      const { returnUrl } = parseState(state);
      const isValid = returnUrl ? isValidReturnUrl(returnUrl) : false;
      
      expect(isValid).toBe(true);
      expect(returnUrl).toBe("/kennzahlen");
    });

    it("sollte auf /dashboard fallback wenn returnUrl ungültig", () => {
      const stateData = JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
        returnUrl: "https://evil.com"
      });
      const state = btoa(stateData);
      
      const { returnUrl } = parseState(state);
      const isValid = returnUrl ? isValidReturnUrl(returnUrl) : false;
      const redirectTo = isValid ? returnUrl : "/dashboard";
      
      expect(redirectTo).toBe("/dashboard");
    });

    it("sollte auf /dashboard fallback wenn keine returnUrl", () => {
      const redirectUri = "https://example.com/api/oauth/callback";
      const state = btoa(redirectUri);
      
      const { returnUrl } = parseState(state);
      const redirectTo = returnUrl && isValidReturnUrl(returnUrl) ? returnUrl : "/dashboard";
      
      expect(redirectTo).toBe("/dashboard");
    });
  });
});
