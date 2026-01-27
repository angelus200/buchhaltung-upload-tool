// Local file storage for belege with Railway Volume support
import fs from 'fs';
import path from 'path';

// Railway Volume path in production, local fallback for development
const BELEGE_BASE_PATH = process.env.NODE_ENV === 'production'
  ? '/data/belege'
  : path.join(process.cwd(), 'uploads', 'belege');

/**
 * Prüft ob Storage verfügbar ist (Ordner existiert oder kann erstellt werden)
 */
export function isStorageAvailable(): boolean {
  try {
    // Versuche Ordner zu erstellen falls nicht vorhanden
    if (!fs.existsSync(BELEGE_BASE_PATH)) {
      fs.mkdirSync(BELEGE_BASE_PATH, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Storage not available:', error);
    return false;
  }
}

/**
 * Upload einer Beleg-Datei zum lokalen Storage (Railway Volume oder lokales Filesystem)
 */
export async function uploadBelegLocal(
  fileBuffer: Buffer,
  filename: string,
  unternehmenId: number
): Promise<{ url: string; path: string }> {
  const jahr = new Date().getFullYear();
  const monat = String(new Date().getMonth() + 1).padStart(2, '0');

  // Ordnerstruktur: /data/belege/{unternehmenId}/{jahr}/{monat}/
  const dirPath = path.join(BELEGE_BASE_PATH, String(unternehmenId), String(jahr), monat);

  // Ordner erstellen falls nicht vorhanden
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Eindeutiger Dateiname mit Timestamp
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFilename = `${Date.now()}_${safeName}`;
  const filePath = path.join(dirPath, uniqueFilename);

  // Datei speichern
  fs.writeFileSync(filePath, fileBuffer);

  // URL für Frontend (wird von Express statisch ausgeliefert)
  const url = `/belege/${unternehmenId}/${jahr}/${monat}/${uniqueFilename}`;

  return { url, path: filePath };
}

/**
 * Download-URL für eine Beleg-Datei generieren
 */
export async function getBelegUrl(relativeUrl: string): Promise<string> {
  // URL ist bereits relativ und kann direkt verwendet werden
  return relativeUrl;
}
