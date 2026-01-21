import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { unternehmenRouter, buchungenRouter, stammdatenRouter, notizenRouter } from "./buchhaltung";
import { benutzerRouter, protokollRouter, berechtigungenRouter } from "./benutzerverwaltung";
import { einladungenRouter } from "./einladungen";
import { dashboardRouter } from "./dashboard";
import { ocrRouter } from "./ocr";
import { pdfExportRouter } from "./pdfExport";
import { finanzamtRouter } from "./finanzamt";
import { aufgabenRouter } from "./aufgaben";
import { steuerberaterRouter } from "./steuerberater";
import { datevRouter } from "./datev";
import { buchungsvorlagenRouter } from "./buchungsvorlagen";
import { kontierungsregelnRouter } from "./kontierungsregeln";
import { monatsabschlussRouter } from "./monatsabschluss";
import { chatAssistantRouter } from "./chat-assistant";
import { inventurMainRouter } from "./inventur";
import { jahresabschlussRouter } from "./jahresabschluss";
import { finanzkontenRouter } from "./finanzkonten";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      // Clerk handles logout on the frontend via signOut()
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

  // Finanzamt und Aufgaben
  finanzamt: finanzamtRouter,
  aufgaben: aufgabenRouter,

  // Steuerberater-Übergaben
  steuerberater: steuerberaterRouter,

  // DATEV Import/Export
  datev: datevRouter,

  // Vorlagen und Regeln
  buchungsvorlagen: buchungsvorlagenRouter,
  kontierungsregeln: kontierungsregelnRouter,

  // Monatsabschluss
  monatsabschluss: monatsabschlussRouter,

  // AI Chat Assistant
  chatAssistant: chatAssistantRouter,

  // Lager- und Inventurverwaltung
  inventur: inventurMainRouter,

  // Jahresabschluss-Module
  jahresabschluss: jahresabschlussRouter,

  // Finanzkonten (Bankkonten, Kreditkarten, Broker, etc.)
  finanzkonten: finanzkontenRouter,
});

export type AppRouter = typeof appRouter;
