export { ONE_YEAR_MS } from "@shared/const";

// Key for storing the return URL in localStorage
export const RETURN_URL_KEY = "auth_return_url";

// Get and clear the stored return URL (used for post-login redirect)
export const getAndClearReturnUrl = (): string => {
  const returnUrl = localStorage.getItem(RETURN_URL_KEY);
  localStorage.removeItem(RETURN_URL_KEY);
  return returnUrl || "/dashboard";
};
