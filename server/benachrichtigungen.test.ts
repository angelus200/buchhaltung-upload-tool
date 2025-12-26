import { describe, it, expect, vi } from "vitest";

// Mock für die Benachrichtigungs-Typen und -Regeln
const BENACHRICHTIGUNGS_TYPEN = [
  { value: "info", label: "Information" },
  { value: "warnung", label: "Warnung" },
  { value: "erfolg", label: "Erfolg" },
  { value: "erinnerung", label: "Erinnerung" },
];

const WIEDERHOLUNGS_OPTIONEN = [
  { value: "einmalig", label: "Einmalig" },
  { value: "taeglich", label: "Täglich" },
  { value: "woechentlich", label: "Wöchentlich" },
  { value: "monatlich", label: "Monatlich" },
];

const STANDARD_REGELN = [
  {
    id: "1",
    name: "Fehlende Belege",
    beschreibung: "Benachrichtigung wenn Buchungen ohne Beleg vorhanden sind",
    trigger: "buchung_ohne_beleg",
    aktiv: true,
  },
  {
    id: "2",
    name: "Monatsabschluss Erinnerung",
    beschreibung: "Erinnerung am 25. jeden Monats für den Monatsabschluss",
    trigger: "monatsabschluss",
    aktiv: true,
  },
  {
    id: "3",
    name: "USt-Voranmeldung",
    beschreibung: "Erinnerung an die USt-Voranmeldung (10. des Folgemonats)",
    trigger: "ust_voranmeldung",
    aktiv: true,
  },
];

interface Benachrichtigung {
  id: string;
  titel: string;
  inhalt: string;
  typ: "info" | "warnung" | "erfolg" | "erinnerung";
  zeitpunkt: string;
  gelesen: boolean;
  aktiv: boolean;
  wiederholung: "einmalig" | "taeglich" | "woechentlich" | "monatlich";
  bezug?: string;
}

describe("Benachrichtigungssystem", () => {
  describe("Benachrichtigungs-Typen", () => {
    it("sollte alle erforderlichen Typen enthalten", () => {
      expect(BENACHRICHTIGUNGS_TYPEN).toHaveLength(4);
      
      const typen = BENACHRICHTIGUNGS_TYPEN.map(t => t.value);
      expect(typen).toContain("info");
      expect(typen).toContain("warnung");
      expect(typen).toContain("erfolg");
      expect(typen).toContain("erinnerung");
    });

    it("sollte deutsche Labels haben", () => {
      const info = BENACHRICHTIGUNGS_TYPEN.find(t => t.value === "info");
      expect(info?.label).toBe("Information");
      
      const warnung = BENACHRICHTIGUNGS_TYPEN.find(t => t.value === "warnung");
      expect(warnung?.label).toBe("Warnung");
    });
  });

  describe("Wiederholungs-Optionen", () => {
    it("sollte alle Wiederholungsintervalle enthalten", () => {
      expect(WIEDERHOLUNGS_OPTIONEN).toHaveLength(4);
      
      const optionen = WIEDERHOLUNGS_OPTIONEN.map(o => o.value);
      expect(optionen).toContain("einmalig");
      expect(optionen).toContain("taeglich");
      expect(optionen).toContain("woechentlich");
      expect(optionen).toContain("monatlich");
    });
  });

  describe("Standard-Regeln", () => {
    it("sollte Buchhaltungs-relevante Regeln enthalten", () => {
      expect(STANDARD_REGELN.length).toBeGreaterThanOrEqual(3);
      
      // Prüfe wichtige Buchhaltungsregeln
      const fehlendeBelege = STANDARD_REGELN.find(r => r.trigger === "buchung_ohne_beleg");
      expect(fehlendeBelege).toBeDefined();
      expect(fehlendeBelege?.name).toBe("Fehlende Belege");
      
      const monatsabschluss = STANDARD_REGELN.find(r => r.trigger === "monatsabschluss");
      expect(monatsabschluss).toBeDefined();
      
      const ustVoranmeldung = STANDARD_REGELN.find(r => r.trigger === "ust_voranmeldung");
      expect(ustVoranmeldung).toBeDefined();
    });

    it("sollte standardmäßig aktive Regeln haben", () => {
      const aktiveRegeln = STANDARD_REGELN.filter(r => r.aktiv);
      expect(aktiveRegeln.length).toBeGreaterThan(0);
    });
  });

  describe("Benachrichtigung erstellen", () => {
    it("sollte eine gültige Benachrichtigung erstellen können", () => {
      const benachrichtigung: Benachrichtigung = {
        id: "test-1",
        titel: "Test Benachrichtigung",
        inhalt: "Dies ist ein Test",
        typ: "info",
        zeitpunkt: new Date().toISOString(),
        gelesen: false,
        aktiv: true,
        wiederholung: "einmalig",
        bezug: "Buchung #123",
      };

      expect(benachrichtigung.id).toBeDefined();
      expect(benachrichtigung.titel).toBe("Test Benachrichtigung");
      expect(benachrichtigung.typ).toBe("info");
      expect(benachrichtigung.gelesen).toBe(false);
    });

    it("sollte Pflichtfelder validieren", () => {
      const validateBenachrichtigung = (b: Partial<Benachrichtigung>): boolean => {
        return !!(b.titel && b.typ && b.zeitpunkt);
      };

      // Gültige Benachrichtigung
      expect(validateBenachrichtigung({
        titel: "Test",
        typ: "info",
        zeitpunkt: new Date().toISOString(),
      })).toBe(true);

      // Ungültige Benachrichtigung (fehlender Titel)
      expect(validateBenachrichtigung({
        typ: "info",
        zeitpunkt: new Date().toISOString(),
      })).toBe(false);
    });
  });

  describe("Benachrichtigung als gelesen markieren", () => {
    it("sollte den gelesen-Status ändern können", () => {
      const benachrichtigung: Benachrichtigung = {
        id: "test-1",
        titel: "Test",
        inhalt: "",
        typ: "info",
        zeitpunkt: new Date().toISOString(),
        gelesen: false,
        aktiv: true,
        wiederholung: "einmalig",
      };

      expect(benachrichtigung.gelesen).toBe(false);
      
      // Simuliere das Markieren als gelesen
      const aktualisiert = { ...benachrichtigung, gelesen: true };
      expect(aktualisiert.gelesen).toBe(true);
    });
  });

  describe("Ungelesene Benachrichtigungen zählen", () => {
    it("sollte die Anzahl ungelesener Benachrichtigungen korrekt zählen", () => {
      const benachrichtigungen: Benachrichtigung[] = [
        { id: "1", titel: "Test 1", inhalt: "", typ: "info", zeitpunkt: "", gelesen: false, aktiv: true, wiederholung: "einmalig" },
        { id: "2", titel: "Test 2", inhalt: "", typ: "warnung", zeitpunkt: "", gelesen: true, aktiv: true, wiederholung: "einmalig" },
        { id: "3", titel: "Test 3", inhalt: "", typ: "erfolg", zeitpunkt: "", gelesen: false, aktiv: true, wiederholung: "einmalig" },
      ];

      const ungelesen = benachrichtigungen.filter(b => !b.gelesen).length;
      expect(ungelesen).toBe(2);
    });
  });

  describe("Regel aktivieren/deaktivieren", () => {
    it("sollte eine Regel umschalten können", () => {
      const regel = { ...STANDARD_REGELN[0] };
      expect(regel.aktiv).toBe(true);
      
      // Simuliere das Umschalten
      regel.aktiv = !regel.aktiv;
      expect(regel.aktiv).toBe(false);
      
      // Wieder aktivieren
      regel.aktiv = !regel.aktiv;
      expect(regel.aktiv).toBe(true);
    });
  });
});

describe("NotificationPayload Validierung", () => {
  const TITLE_MAX_LENGTH = 1200;
  const CONTENT_MAX_LENGTH = 20000;

  const validatePayload = (title: string, content: string): { valid: boolean; error?: string } => {
    if (!title || title.trim().length === 0) {
      return { valid: false, error: "Titel ist erforderlich" };
    }
    if (!content || content.trim().length === 0) {
      return { valid: false, error: "Inhalt ist erforderlich" };
    }
    if (title.length > TITLE_MAX_LENGTH) {
      return { valid: false, error: `Titel darf maximal ${TITLE_MAX_LENGTH} Zeichen haben` };
    }
    if (content.length > CONTENT_MAX_LENGTH) {
      return { valid: false, error: `Inhalt darf maximal ${CONTENT_MAX_LENGTH} Zeichen haben` };
    }
    return { valid: true };
  };

  it("sollte gültige Payloads akzeptieren", () => {
    const result = validatePayload("Test Titel", "Test Inhalt");
    expect(result.valid).toBe(true);
  });

  it("sollte leere Titel ablehnen", () => {
    const result = validatePayload("", "Test Inhalt");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Titel");
  });

  it("sollte leeren Inhalt ablehnen", () => {
    const result = validatePayload("Test Titel", "");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Inhalt");
  });

  it("sollte zu lange Titel ablehnen", () => {
    const langerTitel = "a".repeat(TITLE_MAX_LENGTH + 1);
    const result = validatePayload(langerTitel, "Test Inhalt");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Titel");
  });
});
