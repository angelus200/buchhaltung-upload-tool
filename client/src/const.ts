export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Key for storing the return URL in localStorage
export const RETURN_URL_KEY = "auth_return_url";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Includes the return URL in the state parameter for post-login redirect.
export const getLoginUrl = (returnUrl?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // Store return URL in localStorage as backup
  const effectiveReturnUrl = returnUrl || window.location.pathname + window.location.search;
  if (effectiveReturnUrl && effectiveReturnUrl !== "/login") {
    localStorage.setItem(RETURN_URL_KEY, effectiveReturnUrl);
  }
  
  // Encode both redirectUri and returnUrl in state
  const stateData = JSON.stringify({
    redirectUri,
    returnUrl: effectiveReturnUrl !== "/login" ? effectiveReturnUrl : "/dashboard"
  });
  const state = btoa(stateData);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Get and clear the stored return URL
export const getAndClearReturnUrl = (): string => {
  const returnUrl = localStorage.getItem(RETURN_URL_KEY);
  localStorage.removeItem(RETURN_URL_KEY);
  return returnUrl || "/dashboard";
};
