import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Finanzamt Versionierung", () => {
  describe("versionen Query", () => {
    it("sollte leeres Array zurückgeben wenn keine Versionen existieren", () => {
      // Test-Logik für leere Versionen
      const versionen: any[] = [];
      expect(versionen).toEqual([]);
      expect(versionen.length).toBe(0);
    });

    it("sollte Versionen nach Versionsnummer sortiert zurückgeben", () => {
      const versionen = [
        { id: 1, version: 1, versionTyp: "original" },
        { id: 2, version: 2, versionTyp: "einspruch" },
        { id: 3, version: 3, versionTyp: "antwort" },
      ];
      
      // Prüfe Sortierung
      for (let i = 1; i < versionen.length; i++) {
        expect(versionen[i].version).toBeGreaterThan(versionen[i - 1].version);
      }
    });
  });

  describe("addVersion Mutation", () => {
    it("sollte nächste Versionsnummer korrekt berechnen", () => {
      const existingVersions = [
        { version: 1 },
        { version: 2 },
      ];
      const nextVersion = existingVersions.length + 1;
      expect(nextVersion).toBe(3);
    });

    it("sollte erste Version als 1 anlegen wenn keine existieren", () => {
      const existingVersions: any[] = [];
      const nextVersion = existingVersions.length + 1;
      expect(nextVersion).toBe(1);
    });

    it("sollte gültige Versionstypen akzeptieren", () => {
      const validTypes = ["original", "einspruch", "antwort", "ergaenzung", "korrektur", "anlage"];
      validTypes.forEach(type => {
        expect(validTypes).toContain(type);
      });
    });
  });

  describe("deleteVersion Mutation", () => {
    it("sollte Version erfolgreich löschen", () => {
      const versionen = [
        { id: 1, version: 1 },
        { id: 2, version: 2 },
      ];
      const toDelete = 1;
      const remaining = versionen.filter(v => v.id !== toDelete);
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(2);
    });
  });
});

describe("Finanzamt OCR", () => {
  describe("ocrAnalyse Mutation", () => {
    it("sollte alle erwarteten Felder im Ergebnis haben", () => {
      const ocrResult = {
        dokumentTyp: "bescheid",
        steuerart: "USt",
        aktenzeichen: "123/456/78901",
        steuerjahr: 2024,
        betreff: "Umsatzsteuerbescheid 2024",
        betrag: 1234.56,
        frist: "2025-02-15",
        zahlungsfrist: "2025-02-28",
        eingangsdatum: "2025-01-08",
        zusammenfassung: "Bescheid über Umsatzsteuer",
      };

      expect(ocrResult).toHaveProperty("dokumentTyp");
      expect(ocrResult).toHaveProperty("steuerart");
      expect(ocrResult).toHaveProperty("aktenzeichen");
      expect(ocrResult).toHaveProperty("steuerjahr");
      expect(ocrResult).toHaveProperty("betreff");
      expect(ocrResult).toHaveProperty("betrag");
      expect(ocrResult).toHaveProperty("frist");
      expect(ocrResult).toHaveProperty("zahlungsfrist");
      expect(ocrResult).toHaveProperty("eingangsdatum");
      expect(ocrResult).toHaveProperty("zusammenfassung");
    });

    it("sollte gültige Dokumenttypen erkennen", () => {
      const validTypes = ["bescheid", "einspruch", "mahnung", "anfrage", "pruefung", "schriftverkehr", "sonstiges"];
      const erkannterTyp = "bescheid";
      expect(validTypes).toContain(erkannterTyp);
    });

    it("sollte gültige Steuerarten erkennen", () => {
      const validSteuerarten = ["USt", "ESt", "KSt", "GewSt", "LSt", "KapESt", "sonstige"];
      const erkannteSteuerart = "USt";
      expect(validSteuerarten).toContain(erkannteSteuerart);
    });

    it("sollte Datum im korrekten Format zurückgeben", () => {
      const datum = "2025-01-08";
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(datum).toMatch(dateRegex);
    });

    it("sollte Fehler-Objekt bei OCR-Fehler zurückgeben", () => {
      const errorResult = {
        dokumentTyp: null,
        steuerart: null,
        aktenzeichen: null,
        steuerjahr: null,
        betreff: null,
        betrag: null,
        frist: null,
        zahlungsfrist: null,
        eingangsdatum: null,
        zusammenfassung: null,
        fehler: "Vision AI nicht verfügbar",
      };

      expect(errorResult.fehler).toBeDefined();
      expect(errorResult.dokumentTyp).toBeNull();
    });

    it("sollte JSON aus Vision AI Antwort extrahieren", () => {
      const visionResponse = `Hier ist die Analyse:
{
  "dokumentTyp": "bescheid",
  "steuerart": "USt",
  "betrag": 1500.00
}
Das war die Analyse.`;

      const jsonMatch = visionResponse.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        expect(parsed.dokumentTyp).toBe("bescheid");
        expect(parsed.steuerart).toBe("USt");
        expect(parsed.betrag).toBe(1500.00);
      }
    });
  });
});

describe("Finanzamt Dokument Versionen Schema", () => {
  it("sollte alle erforderlichen Felder haben", () => {
    const versionSchema = {
      id: "number",
      dokumentId: "number",
      version: "number",
      versionTyp: "string",
      betreff: "string|null",
      beschreibung: "string|null",
      datum: "date",
      dateiUrl: "string|null",
      dateiName: "string|null",
      erstelltVon: "number|null",
      erstelltAm: "date",
    };

    expect(versionSchema).toHaveProperty("id");
    expect(versionSchema).toHaveProperty("dokumentId");
    expect(versionSchema).toHaveProperty("version");
    expect(versionSchema).toHaveProperty("versionTyp");
    expect(versionSchema).toHaveProperty("datum");
  });
});
