import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { unternehmen, dropboxSyncLog, buchungsvorschlaege, kreditoren, InsertDropboxSyncLog } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { uploadBelegLocal } from "./storage";
import { analyzeBelegAndCreateVorschlag, findKreditorByName } from "./buchungsvorschlaege";

/**
 * Dropbox Shared Link API
 *
 * KEIN OAUTH NÖTIG - Nutzt öffentliche Shared Links
 * User teilt einen Dropbox-Ordner und kopiert den Link in die Firmen-Einstellungen
 */

interface DropboxSharedLinkFile {
  ".tag": "file" | "folder";
  name: string;
  path_lower?: string;
  id: string;
  size?: number;
  server_modified?: string;
  client_modified?: string;
}

interface DropboxSharedLinkMetadata {
  url: string;
  name: string;
  link_permissions: {
    can_revoke: boolean;
    resolved_visibility: { ".tag": string };
  };
  ".tag": string;
}

/**
 * Dropbox Shared Link Client (kein OAuth)
 */
class DropboxSharedLinkClient {
  private accessToken: string;

  constructor() {
    // Für Shared Links brauchen wir nur einen App Access Token
    // Dieser muss als ENV Variable gesetzt werden
    this.accessToken = process.env.DROPBOX_APP_TOKEN || "";

    if (!this.accessToken) {
      console.warn("⚠️  DROPBOX_APP_TOKEN nicht gesetzt. Dropbox-Integration deaktiviert.");
    }
  }

  /**
   * Listet Dateien in einem geteilten Ordner
   */
  async listSharedFolderFiles(sharedLink: string): Promise<DropboxSharedLinkFile[]> {
    if (!this.accessToken) {
      throw new Error("Dropbox App Token nicht konfiguriert");
    }

    try {
      const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: this.extractPathFromSharedLink(sharedLink),
          recursive: false,
          include_deleted: false,
        }),
      });

      if (!response.ok) {
        // Fallback: Shared Link Method
        return await this.listSharedLinkFilesAlternative(sharedLink);
      }

      const data = await response.json();
      return data.entries || [];
    } catch (error) {
      console.error("Dropbox listSharedFolderFiles Error:", error);
      // Fallback zur Alternative
      return await this.listSharedLinkFilesAlternative(sharedLink);
    }
  }

  /**
   * Alternative Methode: Nutzt Shared Link API
   */
  private async listSharedLinkFilesAlternative(sharedLink: string): Promise<DropboxSharedLinkFile[]> {
    if (!this.accessToken) {
      throw new Error("Dropbox App Token nicht konfiguriert");
    }

    const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shared_link: {
          url: sharedLink,
        },
        path: "",
        recursive: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Dropbox API Fehler: ${errorData.error_summary || response.statusText}`);
    }

    const data = await response.json();
    return data.entries || [];
  }

  /**
   * Lädt eine Datei von einem Shared Link herunter
   */
  async downloadFileFromSharedLink(sharedLink: string, filePath: string): Promise<Buffer> {
    if (!this.accessToken) {
      throw new Error("Dropbox App Token nicht konfiguriert");
    }

    const response = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          shared_link: {
            url: sharedLink,
          },
          path: filePath,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Dropbox Download Fehler: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Extrahiert Pfad aus Shared Link (Fallback)
   */
  private extractPathFromSharedLink(sharedLink: string): string {
    // Versuche den Pfad aus dem Link zu extrahieren
    // Format: https://www.dropbox.com/sh/FOLDER_ID/KEY
    // oder: https://www.dropbox.com/scl/fo/FOLDER_ID/KEY

    // Standardmäßig root
    return "";
  }
}

/**
 * Prüft ob Datei ein unterstütztes Belegformat ist
 */
function isSupportedFileType(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  return ["pdf", "jpg", "jpeg", "png", "gif"].includes(ext || "");
}

/**
 * Dropbox Router (Shared Links)
 */
export const dropboxRouter = router({
  /**
   * Dropbox Ordner-Link speichern
   */
  setFolderLink: protectedProcedure
    .input(
      z.object({
        unternehmenId: z.number(),
        folderLink: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(unternehmen)
        .set({
          dropboxFolderLink: input.folderLink,
        })
        .where(eq(unternehmen.id, input.unternehmenId));

      return { success: true };
    }),

  /**
   * Dropbox Ordner-Link entfernen
   */
  removeFolderLink: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(unternehmen)
        .set({
          dropboxFolderLink: null,
          dropboxLastSync: null,
        })
        .where(eq(unternehmen.id, input.unternehmenId));

      return { success: true };
    }),

  /**
   * Firmen-Info mit Dropbox-Link abrufen
   */
  getUnternehmenInfo: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [firma] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      return firma || null;
    }),

  /**
   * Manueller Sync: Neue Dateien aus Shared Link laden
   */
  sync: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Lade Firma mit Dropbox-Link
      const [firma] = await db
        .select()
        .from(unternehmen)
        .where(eq(unternehmen.id, input.unternehmenId))
        .limit(1);

      if (!firma || !firma.dropboxFolderLink) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kein Dropbox-Ordner konfiguriert",
        });
      }

      const client = new DropboxSharedLinkClient();
      let neueeDateien = 0;

      try {
        // Liste alle Dateien im geteilten Ordner
        const files = await client.listSharedFolderFiles(firma.dropboxFolderLink);

        for (const file of files) {
          if (file[".tag"] !== "file" || !isSupportedFileType(file.name)) {
            continue;
          }

          // Prüfe ob bereits synchronisiert
          const [existing] = await db
            .select()
            .from(dropboxSyncLog)
            .where(
              and(
                eq(dropboxSyncLog.fileName, file.name),
                eq(dropboxSyncLog.dropboxPath, file.path_lower || `/${file.name}`)
              )
            )
            .limit(1);

          if (existing) continue;

          // Download Datei
          const buffer = await client.downloadFileFromSharedLink(
            firma.dropboxFolderLink,
            file.path_lower || `/${file.name}`
          );

          // Upload zu lokalem Storage
          const { url: belegUrl } = await uploadBelegLocal(
            buffer,
            file.name,
            input.unternehmenId
          );

          // MIME-Type ermitteln
          const ext = file.name.toLowerCase().split(".").pop();
          const mimeTypeMap: Record<string, string> = {
            pdf: "application/pdf",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
          };
          const mimeType = mimeTypeMap[ext || ""] || "application/octet-stream";

          let vorschlagId: number | null = null;
          let syncStatus: "uploaded" | "analyzed" | "fehler" = "uploaded";
          let fehlerMeldung: string | null = null;

          // Erstelle automatisch Buchungsvorschlag
          try {
            // Konvertiere Buffer zu Base64
            const imageBase64 = buffer.toString("base64");

            // AI-Analyse
            const vorschlagData = await analyzeBelegAndCreateVorschlag(
              imageBase64,
              mimeType,
              input.unternehmenId,
              belegUrl
            );

            // Suche passenden Kreditor
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

            // Speichere Vorschlag
            const [insertResult] = await db.insert(buchungsvorschlaege).values(vorschlagData);
            vorschlagId = insertResult.insertId;
            syncStatus = "analyzed";
          } catch (aiError) {
            console.error("AI-Analyse fehlgeschlagen:", aiError);
            fehlerMeldung = aiError instanceof Error ? aiError.message : "AI-Analyse fehlgeschlagen";
            syncStatus = "fehler";
          }

          // Log Sync (connectionId auf 0 setzen, da wir keine Connection-Tabelle mehr haben)
          await db.insert(dropboxSyncLog).values({
            connectionId: 0, // Dummy-Wert für Legacy-Kompatibilität
            dropboxPath: file.path_lower || `/${file.name}`,
            dropboxFileId: file.id,
            fileName: file.name,
            fileSize: file.size,
            belegUrl,
            vorschlagId,
            status: syncStatus,
            fehlerMeldung,
          } as InsertDropboxSyncLog);

          neueeDateien++;
        }

        // Update Last Sync Zeit
        await db
          .update(unternehmen)
          .set({
            dropboxLastSync: new Date(),
          })
          .where(eq(unternehmen.id, input.unternehmenId));

        return { success: true, neueeDateien };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Sync fehlgeschlagen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        });
      }
    }),

  /**
   * Sync-Log abrufen
   */
  getSyncLog: protectedProcedure
    .input(z.object({ unternehmenId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Alle Logs anzeigen (connectionId ignorieren)
      const logs = await db
        .select()
        .from(dropboxSyncLog)
        .orderBy(desc(dropboxSyncLog.syncedAt))
        .limit(input.limit);

      return logs;
    }),
});
