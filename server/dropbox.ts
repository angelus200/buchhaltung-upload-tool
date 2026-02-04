import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { dropboxConnections, dropboxSyncLog, buchungsvorschlaege, kreditoren, InsertDropboxConnection, InsertDropboxSyncLog } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { uploadBelegLocal } from "./storage";
import { analyzeBelegAndCreateVorschlag, findKreditorByName } from "./buchungsvorschlaege";

/**
 * Dropbox API Helper
 *
 * Hinweis: Für Production benötigt man:
 * - Dropbox App im Dropbox Developer Portal erstellen
 * - OAuth Client ID und Secret als ENV Variables
 * - Redirect URI konfigurieren
 */

interface DropboxOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  account_id: string;
}

interface DropboxFileMetadata {
  ".tag": "file" | "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  size?: number;
  server_modified?: string;
}

interface DropboxDeltaResponse {
  entries: Array<{
    ".tag": "file" | "folder" | "deleted";
    name?: string;
    path_lower?: string;
    path_display?: string;
    id?: string;
    size?: number;
  }>;
  cursor: string;
  has_more: boolean;
}

/**
 * Dropbox API Client
 */
class DropboxClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async listFolder(path: string): Promise<DropboxFileMetadata[]> {
    const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: path === "/" ? "" : path,
        recursive: false,
        include_deleted: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Dropbox API Fehler: ${response.statusText}`);
    }

    const data = await response.json();
    return data.entries || [];
  }

  async downloadFile(path: string): Promise<{ buffer: Buffer; metadata: any }> {
    const response = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path }),
      },
    });

    if (!response.ok) {
      throw new Error(`Dropbox Download Fehler: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const metadata = JSON.parse(response.headers.get("dropbox-api-result") || "{}");

    return { buffer, metadata };
  }

  async listFolderContinue(cursor: string): Promise<DropboxDeltaResponse> {
    const response = await fetch("https://api.dropboxapi.com/2/files/list_folder/continue", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cursor }),
    });

    if (!response.ok) {
      throw new Error(`Dropbox API Fehler: ${response.statusText}`);
    }

    return await response.json();
  }

  async getLatestCursor(path: string): Promise<string> {
    const response = await fetch("https://api.dropboxapi.com/2/files/list_folder/get_latest_cursor", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: path === "/" ? "" : path,
        recursive: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Dropbox API Fehler: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cursor;
  }

  async getAccountInfo(): Promise<{ account_id: string; email: string }> {
    const response = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Dropbox API Fehler: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      account_id: data.account_id,
      email: data.email,
    };
  }
}

/**
 * Verschlüsselt Access Token (einfache XOR-Verschlüsselung für Demo)
 * Für Production: Verwenden Sie eine richtige Verschlüsselung (z.B. crypto.encrypt)
 */
function encryptToken(token: string): string {
  // TODO: Implementieren Sie richtige Verschlüsselung
  return Buffer.from(token).toString("base64");
}

function decryptToken(encrypted: string): string {
  // TODO: Implementieren Sie richtige Entschlüsselung
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

/**
 * Prüft ob Datei ein unterstütztes Belegformat ist
 */
function isSupportedFileType(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  return ["pdf", "jpg", "jpeg", "png", "gif"].includes(ext || "");
}

/**
 * Dropbox-Router
 */
export const dropboxRouter = router({
  /**
   * OAuth: Generiere Authorization URL
   */
  getAuthUrl: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      // TODO: Ersetzen durch echte Dropbox App Credentials
      const clientId = process.env.DROPBOX_CLIENT_ID || "YOUR_CLIENT_ID";
      const redirectUri = process.env.DROPBOX_REDIRECT_URI || "http://localhost:5000/api/dropbox/callback";

      const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${input.unternehmenId}`;

      return { authUrl };
    }),

  /**
   * OAuth Callback: Exchange Code for Token
   */
  handleCallback: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        unternehmenId: z.number(),
        watchFolder: z.string().default("/Belege"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // TODO: Ersetzen durch echte Dropbox App Credentials
      const clientId = process.env.DROPBOX_CLIENT_ID || "YOUR_CLIENT_ID";
      const clientSecret = process.env.DROPBOX_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
      const redirectUri = process.env.DROPBOX_REDIRECT_URI || "http://localhost:5000/api/dropbox/callback";

      // Exchange code for access token
      const tokenResponse = await fetch("https://api.dropboxapi.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: input.code,
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dropbox OAuth fehlgeschlagen",
        });
      }

      const tokenData: DropboxOAuthTokenResponse = await tokenResponse.json();

      // Hole Account-Info
      const client = new DropboxClient(tokenData.access_token);
      const accountInfo = await client.getAccountInfo();

      // Initiale Cursor holen
      const cursor = await client.getLatestCursor(input.watchFolder);

      // Speichere Verbindung
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      await db.insert(dropboxConnections).values({
        unternehmenId: input.unternehmenId,
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
        expiresAt,
        accountId: accountInfo.account_id,
        accountEmail: accountInfo.email,
        watchFolder: input.watchFolder,
        autoCreateVorschlaege: true,
        lastCursor: cursor,
        syncStatus: "aktiv",
        aktiv: true,
        createdBy: ctx.user.id,
      } as InsertDropboxConnection);

      return { success: true };
    }),

  /**
   * Liste alle Verbindungen
   */
  listConnections: protectedProcedure
    .input(z.object({ unternehmenId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const connections = await db
        .select()
        .from(dropboxConnections)
        .where(eq(dropboxConnections.unternehmenId, input.unternehmenId))
        .orderBy(desc(dropboxConnections.createdAt));

      // Verstecke Tokens im Response
      return connections.map((conn) => ({
        ...conn,
        accessToken: "***",
        refreshToken: "***",
      }));
    }),

  /**
   * Verbindung löschen
   */
  deleteConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db.delete(dropboxConnections).where(eq(dropboxConnections.id, input.id));

      return { success: true };
    }),

  /**
   * Manueller Sync
   */
  sync: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Lade Verbindung
      const [connection] = await db
        .select()
        .from(dropboxConnections)
        .where(eq(dropboxConnections.id, input.connectionId))
        .limit(1);

      if (!connection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Verbindung nicht gefunden" });
      }

      const accessToken = decryptToken(connection.accessToken);
      const client = new DropboxClient(accessToken);

      let neueeDateien = 0;
      let cursor = connection.lastCursor;

      try {
        // Hole neue/geänderte Dateien seit letztem Sync
        const delta: DropboxDeltaResponse = cursor
          ? await client.listFolderContinue(cursor)
          : { entries: await client.listFolder(connection.watchFolder), cursor: "", has_more: false };

        for (const entry of delta.entries) {
          if (entry[".tag"] !== "file" || !entry.name || !isSupportedFileType(entry.name)) {
            continue;
          }

          // Prüfe ob bereits syncronisiert
          const [existing] = await db
            .select()
            .from(dropboxSyncLog)
            .where(
              and(
                eq(dropboxSyncLog.connectionId, input.connectionId),
                eq(dropboxSyncLog.dropboxFileId, entry.id!)
              )
            )
            .limit(1);

          if (existing) continue;

          // Download Datei
          const { buffer } = await client.downloadFile(entry.path_lower!);

          // Upload zu lokalem Storage
          const { url: belegUrl } = await uploadBelegLocal(
            buffer,
            entry.name,
            connection.unternehmenId
          );

          // MIME-Type ermitteln
          const ext = entry.name.toLowerCase().split(".").pop();
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

          // Erstelle Buchungsvorschlag (wenn aktiviert)
          if (connection.autoCreateVorschlaege) {
            try {
              // Konvertiere Buffer zu Base64
              const imageBase64 = buffer.toString("base64");

              // AI-Analyse
              const vorschlagData = await analyzeBelegAndCreateVorschlag(
                imageBase64,
                mimeType,
                connection.unternehmenId,
                belegUrl
              );

              // Suche passenden Kreditor
              if (vorschlagData.lieferant) {
                const kreditorId = await findKreditorByName(
                  vorschlagData.lieferant,
                  connection.unternehmenId
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
                    // Verwende Kreditor-Personenkonto
                    vorschlagData.geschaeftspartnerKonto = kreditor.kontonummer || null;

                    // Verwende Standard-Sachkonto wenn vorhanden
                    if (kreditor.standardSachkonto) {
                      vorschlagData.sollKonto = kreditor.standardSachkonto;
                      vorschlagData.confidence = "0.95"; // Höhere Confidence bei bekanntem Kreditor
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
          }

          // Log Sync
          await db.insert(dropboxSyncLog).values({
            connectionId: input.connectionId,
            dropboxPath: entry.path_display!,
            dropboxFileId: entry.id!,
            fileName: entry.name,
            fileSize: entry.size,
            belegUrl,
            vorschlagId,
            status: syncStatus,
            fehlerMeldung,
          } as InsertDropboxSyncLog);

          neueeDateien++;
        }

        // Update Connection
        await db
          .update(dropboxConnections)
          .set({
            lastSync: new Date(),
            lastCursor: delta.cursor,
            dateienNeu: neueeDateien,
            syncStatus: "aktiv",
          })
          .where(eq(dropboxConnections.id, input.connectionId));

        return { success: true, neueeDateien };
      } catch (error) {
        // Fehler loggen
        await db
          .update(dropboxConnections)
          .set({
            syncStatus: "fehler",
            syncFehler: error instanceof Error ? error.message : "Unbekannter Fehler",
            letzterFehler: new Date(),
          })
          .where(eq(dropboxConnections.id, input.connectionId));

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
    .input(z.object({ connectionId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const logs = await db
        .select()
        .from(dropboxSyncLog)
        .where(eq(dropboxSyncLog.connectionId, input.connectionId))
        .orderBy(desc(dropboxSyncLog.syncedAt))
        .limit(input.limit);

      return logs;
    }),
});
