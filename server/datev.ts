import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { buchungen, unternehmen } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { parseDatevFile, exportToDatev, isValidDatevFile, type DatevBuchung } from "./lib/datev-parser";

export const datevRouter = router({
  /**
   * Parse DATEV file and return preview
   * Does not save to database
   */
  parse: protectedProcedure
    .input(
      z.object({
        fileContent: z.string().min(1, "Dateiinhalt darf nicht leer sein"),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate file format
      if (!isValidDatevFile(input.fileContent)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ungültiges DATEV-Format. Die Datei muss EXTF oder CSV sein.",
        });
      }

      // Parse file
      const result = parseDatevFile(input.fileContent);

      // Return parsed result for preview
      return {
        success: true,
        header: result.header,
        buchungen: result.buchungen,
        errors: result.errors,
        warnings: result.warnings,
        stats: result.stats,
        fileName: input.fileName,
      };
    }),

  /**
   * Import parsed DATEV data into database
   */
  import: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number().int().positive(),
        buchungen: z.array(
          z.object({
            umsatz: z.number(),
            sollHaben: z.enum(["S", "H"]),
            konto: z.string(),
            gegenkonto: z.string(),
            belegdatum: z.string().or(z.date()).transform(val =>
              typeof val === 'string' ? new Date(val) : val
            ),
            belegnummer: z.string(),
            buchungstext: z.string(),
            buSchluessel: z.string().optional(),
            skonto: z.number().optional(),
            waehrung: z.string().optional(),
          })
        ),
        metadata: z
          .object({
            quelle: z.string().optional(),
            importDatum: z.date().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // Verify user has access to this company
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (companies.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unternehmen nicht gefunden",
        });
      }

      const company = companies[0];

      // Import buchungen
      const imported: number[] = [];
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < input.buchungen.length; i++) {
        const buchung = input.buchungen[i];

        try {
          // Calculate Netto from Brutto (assuming 19% USt for now)
          // In real scenario, you'd derive this from BU-Schlüssel or other fields
          const steuersatz = 19;
          const bruttobetrag = buchung.umsatz;
          const nettobetrag = bruttobetrag / (1 + steuersatz / 100);

          // Determine Buchungsart based on Konto
          let buchungsart: "aufwand" | "ertrag" | "anlage" | "sonstig" = "sonstig";
          const kontoFirstDigit = parseInt(buchung.konto.charAt(0), 10);

          if (kontoFirstDigit >= 4 && kontoFirstDigit <= 4) {
            buchungsart = "ertrag";
          } else if (kontoFirstDigit >= 6 && kontoFirstDigit <= 7) {
            buchungsart = "aufwand";
          } else if (kontoFirstDigit === 0) {
            buchungsart = "anlage";
          }

          // Determine Geschäftspartner-Typ
          let geschaeftspartnerTyp: "kreditor" | "debitor" | "gesellschafter" | "sonstig" = "sonstig";
          const gegenkontoFirstDigit = parseInt(buchung.gegenkonto.charAt(0), 10);

          if (gegenkontoFirstDigit === 7) {
            geschaeftspartnerTyp = "kreditor";
          } else if (gegenkontoFirstDigit === 1) {
            geschaeftspartnerTyp = "debitor";
          }

          // Insert into database
          const [result] = await db.insert(buchungen).values({
            unternehmenId: input.unternehmenId,
            buchungsart,
            belegdatum: buchung.belegdatum,
            belegnummer: buchung.belegnummer,
            geschaeftspartnerTyp,
            geschaeftspartner: `Import ${buchung.gegenkonto}`,
            geschaeftspartnerKonto: buchung.gegenkonto,
            sachkonto: buchung.konto,
            nettobetrag: nettobetrag.toString(),
            steuersatz: steuersatz.toString(),
            bruttobetrag: bruttobetrag.toString(),
            buchungstext: buchung.buchungstext || `DATEV Import ${buchung.belegnummer}`,
            status: "geprueft",
            createdBy: ctx.user.id,
          });

          imported.push(result.insertId);
        } catch (error) {
          console.error(`Error importing row ${i + 1}:`, error);
          errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : "Unbekannter Fehler",
          });
        }
      }

      return {
        success: true,
        imported: imported.length,
        failed: errors.length,
        errors,
        message: `${imported.length} von ${input.buchungen.length} Buchungen erfolgreich importiert`,
      };
    }),

  /**
   * Export buchungen to DATEV format
   */
  export: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number().int().positive(),
        datumVon: z.string().optional(),
        datumBis: z.string().optional(),
        sachkonten: z.array(z.string()).optional(),
        status: z.enum(["entwurf", "geprueft", "exportiert"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Datenbankverbindung nicht verfügbar",
        });
      }

      // Get company metadata
      const companies = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (companies.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Unternehmen nicht gefunden",
        });
      }

      const company = companies[0];

      // Build filters
      const filters = [eq(buchungen.unternehmenId, input.unternehmenId)];

      if (input.datumVon) {
        filters.push(sql`${buchungen.belegdatum} >= ${new Date(input.datumVon)}`);
      }

      if (input.datumBis) {
        filters.push(sql`${buchungen.belegdatum} <= ${new Date(input.datumBis)}`);
      }

      if (input.status) {
        filters.push(eq(buchungen.status, input.status));
      }

      if (input.sachkonten && input.sachkonten.length > 0) {
        // Filter für bestimmte Sachkonten
        const sachkontenFilter = input.sachkonten.map(sk =>
          sql`${buchungen.sachkonto} = ${sk}`
        );
        filters.push(sql`(${sql.join(sachkontenFilter, sql` OR `)})`);
      }

      // Get buchungen
      const buchungenList = await db
        .select()
        .from(buchungen)
        .where(and(...filters))
        .orderBy(desc(buchungen.belegdatum));

      if (buchungenList.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Keine Buchungen zum Exportieren gefunden",
        });
      }

      // Convert to DATEV format
      const datevData = buchungenList.map((b) => ({
        belegdatum: b.belegdatum,
        belegnummer: b.belegnummer,
        bruttobetrag: parseFloat(b.bruttobetrag.toString()),
        sachkonto: b.sachkonto,
        geschaeftspartnerKonto: b.geschaeftspartnerKonto,
        buchungstext: b.buchungstext || "",
        steuersatz: parseFloat(b.steuersatz.toString()),
        nettobetrag: parseFloat(b.nettobetrag.toString()),
      }));

      const datevContent = exportToDatev(datevData, {
        beraternummer: company.beraternummer || undefined,
        mandantennummer: company.mandantennummer || undefined,
        wirtschaftsjahrBeginn: company.wirtschaftsjahrBeginn,
        datumVon: input.datumVon ? new Date(input.datumVon) : undefined,
        datumBis: input.datumBis ? new Date(input.datumBis) : undefined,
      });

      return {
        success: true,
        content: datevContent,
        fileName: `EXTF_${company.mandantennummer || company.id}_${new Date().toISOString().split('T')[0]}.csv`,
        count: buchungenList.length,
      };
    }),

  /**
   * Get import history (recent imports)
   */
  getImportHistory: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number().int().positive(),
        limit: z.number().int().positive().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Get recent imports (buchungen with status 'geprueft' and buchungstext containing 'DATEV Import' or 'Import')
      const recentImports = await db
        .select()
        .from(buchungen)
        .where(
          and(
            eq(buchungen.unternehmenId, input.unternehmenId),
            eq(buchungen.status, "geprueft")
          )
        )
        .orderBy(desc(buchungen.createdAt))
        .limit(input.limit);

      // Group by creation date (day)
      const grouped = recentImports.reduce((acc, buchung) => {
        const dateKey = buchung.createdAt.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: buchung.createdAt,
            count: 0,
            buchungen: [],
          };
        }
        acc[dateKey].count++;
        acc[dateKey].buchungen.push(buchung);
        return acc;
      }, {} as Record<string, { date: Date; count: number; buchungen: any[] }>);

      return Object.values(grouped)
        .map((group) => ({
          date: group.date,
          count: group.count,
          firstBuchung: group.buchungen[0],
        }))
        .slice(0, input.limit);
    }),
});
