export const ENV = {
  // Required at build time
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Optional at build time - only evaluated at runtime
  get resendApiKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get anthropicApiKey() {
    return process.env.ANTHROPIC_API_KEY ?? "";
  },
};
