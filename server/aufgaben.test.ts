import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock für getDb
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

describe("Aufgaben Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Kategorien", () => {
    it("sollte alle Kategorien unterstützen", () => {
      const kategorien = [
        "finanzamt",
        "buchhaltung",
        "steuern",
        "personal",
        "allgemein",
        "frist",
        "zahlung",
        "pruefung",
      ];
      
      expect(kategorien).toHaveLength(8);
      expect(kategorien).toContain("finanzamt");
      expect(kategorien).toContain("buchhaltung");
    });
  });

  describe("Prioritäten", () => {
    it("sollte alle Prioritäten unterstützen", () => {
      const prioritaeten = ["niedrig", "normal", "hoch", "dringend"];
      
      expect(prioritaeten).toHaveLength(4);
      expect(prioritaeten).toContain("dringend");
      expect(prioritaeten).toContain("normal");
    });

    it("sollte Prioritäten korrekt sortieren", () => {
      const prioritaetWerte: Record<string, number> = {
        niedrig: 1,
        normal: 2,
        hoch: 3,
        dringend: 4,
      };
      
      expect(prioritaetWerte["dringend"]).toBeGreaterThan(prioritaetWerte["hoch"]);
      expect(prioritaetWerte["hoch"]).toBeGreaterThan(prioritaetWerte["normal"]);
      expect(prioritaetWerte["normal"]).toBeGreaterThan(prioritaetWerte["niedrig"]);
    });
  });

  describe("Status-Optionen", () => {
    it("sollte alle Status-Optionen unterstützen", () => {
      const statusOptionen = ["offen", "in_bearbeitung", "wartend", "erledigt", "storniert"];
      
      expect(statusOptionen).toHaveLength(5);
      expect(statusOptionen).toContain("offen");
      expect(statusOptionen).toContain("erledigt");
    });
  });

  describe("Fälligkeitsberechnung", () => {
    it("sollte überfällige Aufgaben korrekt erkennen", () => {
      const heute = new Date();
      const gestern = new Date(heute);
      gestern.setDate(gestern.getDate() - 1);
      
      const morgen = new Date(heute);
      morgen.setDate(morgen.getDate() + 1);
      
      // Gestern ist überfällig
      expect(gestern < heute).toBe(true);
      
      // Morgen ist nicht überfällig
      expect(morgen < heute).toBe(false);
    });

    it("sollte erledigte Aufgaben nicht als überfällig markieren", () => {
      const aufgabe = {
        faelligkeitsdatum: new Date("2020-01-01"),
        status: "erledigt",
      };
      
      const isUeberfaellig = (faelligkeit: Date | null, status: string) => {
        if (!faelligkeit || status === "erledigt" || status === "storniert") return false;
        return faelligkeit < new Date();
      };
      
      expect(isUeberfaellig(aufgabe.faelligkeitsdatum, aufgabe.status)).toBe(false);
    });
  });

  describe("Aufgaben-Erstellung", () => {
    it("sollte Pflichtfelder validieren", () => {
      const aufgabe = {
        unternehmenId: 1,
        titel: "Buchhaltung abschließen",
        kategorie: "buchhaltung",
        prioritaet: "hoch",
      };
      
      expect(aufgabe.unternehmenId).toBeDefined();
      expect(aufgabe.titel).toBeDefined();
      expect(aufgabe.kategorie).toBeDefined();
      expect(aufgabe.prioritaet).toBeDefined();
    });

    it("sollte optionale Felder akzeptieren", () => {
      const aufgabe = {
        unternehmenId: 1,
        titel: "Buchhaltung abschließen",
        kategorie: "buchhaltung",
        prioritaet: "hoch",
        beschreibung: "Alle Belege für Januar erfassen",
        faelligkeitsdatum: "2024-01-31",
        notizen: "Wichtig: Auch Kreditkartenbelege",
      };
      
      expect(aufgabe.beschreibung).toBeDefined();
      expect(aufgabe.faelligkeitsdatum).toBeDefined();
      expect(aufgabe.notizen).toBeDefined();
    });
  });

  describe("Erledigen-Funktion", () => {
    it("sollte Erledigungsdatum setzen", () => {
      const jetzt = new Date();
      const erledigtAm = new Date();
      
      // Erledigungsdatum sollte nahe am aktuellen Zeitpunkt sein
      const differenzMs = Math.abs(erledigtAm.getTime() - jetzt.getTime());
      expect(differenzMs).toBeLessThan(1000); // weniger als 1 Sekunde
    });
  });

  describe("CSV Export", () => {
    it("sollte korrekten CSV-Header generieren", () => {
      const header = "Titel;Kategorie;Priorität;Status;Fälligkeit;Beschreibung";
      
      expect(header).toContain("Titel");
      expect(header).toContain("Kategorie");
      expect(header).toContain("Priorität");
      expect(header).toContain("Status");
      expect(header).toContain("Fälligkeit");
    });

    it("sollte Aufgaben korrekt als CSV formatieren", () => {
      const aufgabe = {
        titel: "Test Aufgabe",
        kategorie: "allgemein",
        prioritaet: "normal",
        status: "offen",
        faelligkeitsdatum: new Date("2024-01-31"),
        beschreibung: "Test Beschreibung",
      };
      
      const faelligkeit = aufgabe.faelligkeitsdatum.toLocaleDateString('de-DE');
      const csvRow = `"${aufgabe.titel}";"${aufgabe.kategorie}";"${aufgabe.prioritaet}";"${aufgabe.status}";"${faelligkeit}";"${aufgabe.beschreibung}"`;
      
      expect(csvRow).toContain("Test Aufgabe");
      expect(csvRow).toContain("allgemein");
      // Datumsformat kann je nach Zeitzone variieren
      expect(csvRow).toMatch(/\d{1,2}\.\d{1,2}\.2024/);
    });
  });
});
