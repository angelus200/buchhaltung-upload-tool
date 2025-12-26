import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { unternehmenRouter, buchungenRouter, stammdatenRouter, notizenRouter } from "./buchhaltung";
import { benutzerRouter, protokollRouter, berechtigungenRouter } from "./benutzerverwaltung";
import { einladungenRouter } from "./einladungen";
import { dashboardRouter } from "./dashboard";
import { ocrRouter } from "./ocr";
import { pdfExportRouter } from "./pdfExport";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Buchhaltungs-Router
  unternehmen: unternehmenRouter,
  buchungen: buchungenRouter,
  stammdaten: stammdatenRouter,
  notizen: notizenRouter,

  // Benutzerverwaltung und Protokoll
  benutzer: benutzerRouter,
  protokoll: protokollRouter,
  berechtigungen: berechtigungenRouter,

  // Einladungen
  einladungen: einladungenRouter,

  // Dashboard Kennzahlen
  dashboard: dashboardRouter,

  // OCR und PDF-Export
  ocr: ocrRouter,
  pdfExport: pdfExportRouter,
});

export type AppRouter = typeof appRouter;
