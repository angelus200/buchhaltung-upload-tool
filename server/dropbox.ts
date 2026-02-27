import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { buchungsvorschlaege, kreditoren } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { uploadBelegLocal } from "./storage";
import { analyzeBelegAndCreateVorschlag, findKreditorByName } from "./buchungsvorschlaege";

/**
 * Dropbox Direct Link Download
 *
 * KEINE API, KEIN TOKEN - Einfach nur Links!
 *
 * User teilt Datei in Dropbox → Kopiert Link → Fügt in App ein → Fertig
 */

/**
 * Lädt Datei von Dropbox Shared Link herunter (ohne API)
 */
async function downloadFromDropboxLink(sharedLink: string): Promise<Buffer> {
  try {
    // Dropbox Shared Link zu Direct Download umwandeln
    let downloadUrl = sharedLink;

    // Schritt 1: ?dl=0 → ?dl=1 (funktioniert für alle Link-Typen)
    downloadUrl = downloadUrl.replace('?dl=0', '?dl=1').replace('&dl=0', '&dl=1');

    // Schritt 2: Hostname-Ersetzung NUR für Legacy /s/ Links, NICHT für /scl/ Links
    const isLegacyLink = downloadUrl.includes('/s/') && !downloadUrl.includes('/scl/');

    if (isLegacyLink && !downloadUrl.includes('dl.dropboxusercontent.com')) {
      // Legacy Link: www.dropbox.com/s/... → dl.dropboxusercontent.com/s/...
      downloadUrl = downloadUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    }

    // Schritt 3: ?dl=1 hinzufügen falls noch nicht vorhanden
    if (!downloadUrl.includes('dl=1') && !downloadUrl.includes('dl=0')) {
      if (!downloadUrl.includes('?')) {
        downloadUrl += '?dl=1';
      } else {
        downloadUrl += '&dl=1';
      }
    }

    console.log(`📥 Downloading from Dropbox: ${downloadUrl}`);

    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BuchhaltungApp/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Dropbox Download fehlgeschlagen: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error("Heruntergeladene Datei ist leer");
    }

    console.log(`✅ Download erfolgreich: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("Dropbox Download Error:", error);
    throw new Error(`Dropbox Download fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
  }
}

/**
 * Extrahiert Dateinamen aus Dropbox-Link
 */
function getFilenameFromLink(link: string): string {
  try {
    const url = new URL(link);
    const pathParts = url.pathname.split('/');
    // Letzter Teil des Pfades ist meist der Dateiname
    const filename = pathParts[pathParts.length - 1] || 'beleg.pdf';
    // Dekodiere URL-encoding
    return decodeURIComponent(filename);
  } catch {
    return 'beleg.pdf';
  }
}

/**
 * Prüft ob Link ein gültiger Dropbox-Link ist
 */
function isValidDropboxLink(link: string): boolean {
  try {
    const url = new URL(link);
    return url.hostname.includes('dropbox.com') || url.hostname.includes('dropboxusercontent.com');
  } catch {
    return false;
  }
}

/**
 * Ermittelt MIME-Type aus Dateiname
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Dropbox Router (Ultra-Simple: Nur direkte Links)
 */
export const dropboxRouter = router({
  /**
   * Verarbeite Dropbox-Link: Download → Upload → AI-Analyse → Buchungsvorschlag
   */
  processLink: protectedProcedure
    .input(
      z.object({
        dropboxLink: z.string().url(),
        unternehmenId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Validiere Dropbox-Link
      if (!isValidDropboxLink(input.dropboxLink)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kein gültiger Dropbox-Link",
        });
      }

      try {
        // 1. Download von Dropbox (ohne API/Token)
        const buffer = await downloadFromDropboxLink(input.dropboxLink);
        const filename = getFilenameFromLink(input.dropboxLink);
        const mimeType = getMimeType(filename);

        // 2. Upload zu lokalem Storage
        const { url: belegUrl } = await uploadBelegLocal(
          buffer,
          filename,
          input.unternehmenId
        );

        // 3. AI-Analyse
        const imageBase64 = buffer.toString("base64");
        const vorschlagData = await analyzeBelegAndCreateVorschlag(
          imageBase64,
          mimeType,
          input.unternehmenId,
          belegUrl
        );

        // 4. Kreditor-Matching
        if (vorschlagData.lieferant) {
          const kreditorId = await findKreditorByName(
            vorschlagData.lieferant,
            input.unternehmenId
          );

          if (kreditorId) {
            vorschlagData.kreditorId = kreditorId;

            // Lade Kreditor-Daten
            const [kreditor] = await db
              .select()
              .from(kreditoren)
              .where(eq(kreditoren.id, kreditorId))
              .limit(1);

            if (kreditor) {
              vorschlagData.geschaeftspartnerKonto = kreditor.kontonummer || null;

              if (kreditor.standardSachkonto) {
                vorschlagData.sollKonto = kreditor.standardSachkonto;
                vorschlagData.confidence = "0.95";
                vorschlagData.aiNotizen = (vorschlagData.aiNotizen || "") +
                  ` | Kreditor erkannt: ${kreditor.name}, Standard-Sachkonto verwendet.`;
              }
            }
          }
        }

        // 5. Speichere Buchungsvorschlag
        const [insertResult] = await db.insert(buchungsvorschlaege).values(vorschlagData);
        const vorschlagId = insertResult.insertId;

        return {
          success: true,
          vorschlagId,
          filename,
          belegUrl,
        };
      } catch (error) {
        console.error("Dropbox Link Processing Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Verarbeitung fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        });
      }
    }),
});
