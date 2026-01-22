import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = document.getElementById("root")!;

// KEIN throw! Stattdessen Fallback-UI wenn Key fehlt
if (!clerkPubKey) {
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui;padding:2rem;text-align:center;background:#f5f5f5;">
      <div style="background:white;padding:2rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:500px;">
        <h1 style="color:#dc2626;margin-bottom:1rem;font-size:24px;">⚠️ Konfigurationsfehler</h1>
        <p style="color:#666;line-height:1.6;margin-bottom:1rem;">
          Die Clerk-Authentifizierung ist nicht korrekt konfiguriert.
        </p>
        <details style="text-align:left;margin-top:1.5rem;padding:1rem;background:#f9f9f9;border-radius:4px;">
          <summary style="cursor:pointer;font-weight:500;color:#333;">Für Entwickler</summary>
          <p style="margin-top:0.5rem;font-size:14px;color:#666;">
            <strong>Fehlende Variable:</strong> VITE_CLERK_PUBLISHABLE_KEY<br><br>
            <strong>Lösung:</strong><br>
            1. In Railway Environment Variables setzen<br>
            2. "Redeploy" mit "Clear build cache" durchführen<br>
            3. Warten bis Build fertig ist (2-3 Min)
          </p>
        </details>
      </div>
    </div>
  `;
} else {
  createRoot(root).render(
    <ClerkProvider publishableKey={clerkPubKey}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </ClerkProvider>
  );
}
