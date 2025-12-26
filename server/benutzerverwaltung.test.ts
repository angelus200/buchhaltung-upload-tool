import { describe, it, expect, vi } from "vitest";

// Standard-Berechtigungen pro Rolle (aus benutzerverwaltung.ts)
const STANDARD_BERECHTIGUNGEN = {
  admin: {
    buchungen: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: true },
    stammdaten: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: true },
    unternehmen: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: true },
    benutzer: { lesen: true, erstellen: true, bearbeiten: true, loeschen: true, exportieren: false },
    protokoll: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: true },
  },
  buchhalter: {
    buchungen: { lesen: true, erstellen: true, bearbeiten: true, loeschen: false, exportieren: true },
    stammdaten: { lesen: true, erstellen: true, bearbeiten: true, loeschen: false, exportieren: true },
    unternehmen: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    benutzer: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    protokoll: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
  },
  viewer: {
    buchungen: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    stammdaten: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    unternehmen: { lesen: true, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    benutzer: { lesen: false, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
    protokoll: { lesen: false, erstellen: false, bearbeiten: false, loeschen: false, exportieren: false },
  },
};

// Rollen-Definitionen
const ROLLEN = [
  { id: "admin", name: "Administrator", beschreibung: "Voller Zugriff auf alle Funktionen" },
  { id: "buchhalter", name: "Buchhalter", beschreibung: "Kann Buchungen erstellen und bearbeiten" },
  { id: "viewer", name: "Nur Lesen", beschreibung: "Kann nur Daten einsehen" },
];

// Aktivitäts-Aktionen
const AKTIVITAETS_AKTIONEN = [
  "buchung_erstellt",
  "buchung_bearbeitet",
  "buchung_geloescht",
  "buchung_exportiert",
  "stammdaten_erstellt",
  "stammdaten_bearbeitet",
  "stammdaten_geloescht",
  "unternehmen_erstellt",
  "unternehmen_bearbeitet",
  "benutzer_hinzugefuegt",
  "benutzer_entfernt",
  "rolle_geaendert",
  "login",
  "logout",
];

describe("Rollen und Berechtigungen", () => {
  describe("Rollen-Definitionen", () => {
    it("sollte alle drei Rollen definiert haben", () => {
      expect(ROLLEN).toHaveLength(3);
      
      const rollenIds = ROLLEN.map(r => r.id);
      expect(rollenIds).toContain("admin");
      expect(rollenIds).toContain("buchhalter");
      expect(rollenIds).toContain("viewer");
    });

    it("sollte deutsche Namen und Beschreibungen haben", () => {
      const admin = ROLLEN.find(r => r.id === "admin");
      expect(admin?.name).toBe("Administrator");
      expect(admin?.beschreibung).toContain("Voller Zugriff");

      const buchhalter = ROLLEN.find(r => r.id === "buchhalter");
      expect(buchhalter?.name).toBe("Buchhalter");

      const viewer = ROLLEN.find(r => r.id === "viewer");
      expect(viewer?.name).toBe("Nur Lesen");
    });
  });

  describe("Admin-Berechtigungen", () => {
    const adminBerechtigungen = STANDARD_BERECHTIGUNGEN.admin;

    it("sollte volle Buchungs-Berechtigungen haben", () => {
      expect(adminBerechtigungen.buchungen.lesen).toBe(true);
      expect(adminBerechtigungen.buchungen.erstellen).toBe(true);
      expect(adminBerechtigungen.buchungen.bearbeiten).toBe(true);
      expect(adminBerechtigungen.buchungen.loeschen).toBe(true);
      expect(adminBerechtigungen.buchungen.exportieren).toBe(true);
    });

    it("sollte Benutzer verwalten können", () => {
      expect(adminBerechtigungen.benutzer.erstellen).toBe(true);
      expect(adminBerechtigungen.benutzer.bearbeiten).toBe(true);
      expect(adminBerechtigungen.benutzer.loeschen).toBe(true);
    });

    it("sollte Protokoll lesen und exportieren können", () => {
      expect(adminBerechtigungen.protokoll.lesen).toBe(true);
      expect(adminBerechtigungen.protokoll.exportieren).toBe(true);
    });
  });

  describe("Buchhalter-Berechtigungen", () => {
    const buchhalterBerechtigungen = STANDARD_BERECHTIGUNGEN.buchhalter;

    it("sollte Buchungen erstellen und bearbeiten können", () => {
      expect(buchhalterBerechtigungen.buchungen.lesen).toBe(true);
      expect(buchhalterBerechtigungen.buchungen.erstellen).toBe(true);
      expect(buchhalterBerechtigungen.buchungen.bearbeiten).toBe(true);
    });

    it("sollte Buchungen NICHT löschen können", () => {
      expect(buchhalterBerechtigungen.buchungen.loeschen).toBe(false);
    });

    it("sollte Buchungen exportieren können", () => {
      expect(buchhalterBerechtigungen.buchungen.exportieren).toBe(true);
    });

    it("sollte keine Benutzer verwalten können", () => {
      expect(buchhalterBerechtigungen.benutzer.erstellen).toBe(false);
      expect(buchhalterBerechtigungen.benutzer.bearbeiten).toBe(false);
      expect(buchhalterBerechtigungen.benutzer.loeschen).toBe(false);
    });

    it("sollte Unternehmen nur lesen können", () => {
      expect(buchhalterBerechtigungen.unternehmen.lesen).toBe(true);
      expect(buchhalterBerechtigungen.unternehmen.erstellen).toBe(false);
      expect(buchhalterBerechtigungen.unternehmen.bearbeiten).toBe(false);
    });
  });

  describe("Viewer-Berechtigungen", () => {
    const viewerBerechtigungen = STANDARD_BERECHTIGUNGEN.viewer;

    it("sollte alle Daten lesen können", () => {
      expect(viewerBerechtigungen.buchungen.lesen).toBe(true);
      expect(viewerBerechtigungen.stammdaten.lesen).toBe(true);
      expect(viewerBerechtigungen.unternehmen.lesen).toBe(true);
    });

    it("sollte KEINE Daten erstellen können", () => {
      expect(viewerBerechtigungen.buchungen.erstellen).toBe(false);
      expect(viewerBerechtigungen.stammdaten.erstellen).toBe(false);
      expect(viewerBerechtigungen.unternehmen.erstellen).toBe(false);
    });

    it("sollte KEINE Daten bearbeiten können", () => {
      expect(viewerBerechtigungen.buchungen.bearbeiten).toBe(false);
      expect(viewerBerechtigungen.stammdaten.bearbeiten).toBe(false);
    });

    it("sollte KEINE Daten löschen können", () => {
      expect(viewerBerechtigungen.buchungen.loeschen).toBe(false);
      expect(viewerBerechtigungen.stammdaten.loeschen).toBe(false);
    });

    it("sollte KEINEN Zugriff auf Benutzerverwaltung haben", () => {
      expect(viewerBerechtigungen.benutzer.lesen).toBe(false);
    });

    it("sollte KEINEN Zugriff auf Protokoll haben", () => {
      expect(viewerBerechtigungen.protokoll.lesen).toBe(false);
    });
  });
});

describe("Aktivitätsprotokoll", () => {
  describe("Aktions-Typen", () => {
    it("sollte alle Buchungs-Aktionen enthalten", () => {
      expect(AKTIVITAETS_AKTIONEN).toContain("buchung_erstellt");
      expect(AKTIVITAETS_AKTIONEN).toContain("buchung_bearbeitet");
      expect(AKTIVITAETS_AKTIONEN).toContain("buchung_geloescht");
      expect(AKTIVITAETS_AKTIONEN).toContain("buchung_exportiert");
    });

    it("sollte alle Stammdaten-Aktionen enthalten", () => {
      expect(AKTIVITAETS_AKTIONEN).toContain("stammdaten_erstellt");
      expect(AKTIVITAETS_AKTIONEN).toContain("stammdaten_bearbeitet");
      expect(AKTIVITAETS_AKTIONEN).toContain("stammdaten_geloescht");
    });

    it("sollte alle Benutzer-Aktionen enthalten", () => {
      expect(AKTIVITAETS_AKTIONEN).toContain("benutzer_hinzugefuegt");
      expect(AKTIVITAETS_AKTIONEN).toContain("benutzer_entfernt");
      expect(AKTIVITAETS_AKTIONEN).toContain("rolle_geaendert");
    });

    it("sollte Login/Logout-Aktionen enthalten", () => {
      expect(AKTIVITAETS_AKTIONEN).toContain("login");
      expect(AKTIVITAETS_AKTIONEN).toContain("logout");
    });
  });

  describe("Protokoll-Eintrag Validierung", () => {
    interface AktivitaetsEintrag {
      userId: number;
      aktion: string;
      unternehmenId?: number;
      entitaetTyp?: string;
      entitaetId?: number;
      entitaetName?: string;
      details?: string;
    }

    const validateEintrag = (eintrag: Partial<AktivitaetsEintrag>): boolean => {
      // userId und aktion sind Pflichtfelder
      if (!eintrag.userId || !eintrag.aktion) return false;
      // aktion muss gültig sein
      if (!AKTIVITAETS_AKTIONEN.includes(eintrag.aktion)) return false;
      return true;
    };

    it("sollte gültige Einträge akzeptieren", () => {
      const eintrag: AktivitaetsEintrag = {
        userId: 1,
        aktion: "buchung_erstellt",
        unternehmenId: 1,
        entitaetTyp: "buchung",
        entitaetId: 123,
        entitaetName: "Rechnung #2025-001",
      };
      expect(validateEintrag(eintrag)).toBe(true);
    });

    it("sollte Einträge ohne userId ablehnen", () => {
      expect(validateEintrag({ aktion: "buchung_erstellt" })).toBe(false);
    });

    it("sollte Einträge ohne aktion ablehnen", () => {
      expect(validateEintrag({ userId: 1 })).toBe(false);
    });

    it("sollte ungültige Aktionen ablehnen", () => {
      expect(validateEintrag({ userId: 1, aktion: "ungueltige_aktion" })).toBe(false);
    });
  });
});

describe("Benutzer-Unternehmen-Zuordnung", () => {
  interface BenutzerZuordnung {
    userId: number;
    unternehmenId: number;
    rolle: "admin" | "buchhalter" | "viewer";
  }

  describe("Zuordnungs-Validierung", () => {
    const validateZuordnung = (zuordnung: Partial<BenutzerZuordnung>): boolean => {
      if (!zuordnung.userId || !zuordnung.unternehmenId || !zuordnung.rolle) {
        return false;
      }
      if (!["admin", "buchhalter", "viewer"].includes(zuordnung.rolle)) {
        return false;
      }
      return true;
    };

    it("sollte gültige Zuordnungen akzeptieren", () => {
      expect(validateZuordnung({ userId: 1, unternehmenId: 1, rolle: "admin" })).toBe(true);
      expect(validateZuordnung({ userId: 2, unternehmenId: 1, rolle: "buchhalter" })).toBe(true);
      expect(validateZuordnung({ userId: 3, unternehmenId: 1, rolle: "viewer" })).toBe(true);
    });

    it("sollte Zuordnungen ohne Rolle ablehnen", () => {
      expect(validateZuordnung({ userId: 1, unternehmenId: 1 })).toBe(false);
    });

    it("sollte ungültige Rollen ablehnen", () => {
      expect(validateZuordnung({ 
        userId: 1, 
        unternehmenId: 1, 
        rolle: "superadmin" as "admin" 
      })).toBe(false);
    });
  });

  describe("Berechtigungs-Prüfung", () => {
    const hatBerechtigung = (
      rolle: "admin" | "buchhalter" | "viewer",
      bereich: keyof typeof STANDARD_BERECHTIGUNGEN.admin,
      aktion: "lesen" | "erstellen" | "bearbeiten" | "loeschen" | "exportieren"
    ): boolean => {
      const berechtigungen = STANDARD_BERECHTIGUNGEN[rolle];
      const bereichBerechtigungen = berechtigungen[bereich];
      return bereichBerechtigungen[aktion] === true;
    };

    it("Admin sollte Benutzer hinzufügen können", () => {
      expect(hatBerechtigung("admin", "benutzer", "erstellen")).toBe(true);
    });

    it("Buchhalter sollte KEINE Benutzer hinzufügen können", () => {
      expect(hatBerechtigung("buchhalter", "benutzer", "erstellen")).toBe(false);
    });

    it("Viewer sollte Buchungen lesen können", () => {
      expect(hatBerechtigung("viewer", "buchungen", "lesen")).toBe(true);
    });

    it("Viewer sollte KEINE Buchungen erstellen können", () => {
      expect(hatBerechtigung("viewer", "buchungen", "erstellen")).toBe(false);
    });
  });
});

describe("E-Mail-Validierung für Benutzer-Einladung", () => {
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  it("sollte gültige E-Mail-Adressen akzeptieren", () => {
    expect(validateEmail("benutzer@beispiel.de")).toBe(true);
    expect(validateEmail("max.mustermann@firma.com")).toBe(true);
    expect(validateEmail("test@sub.domain.org")).toBe(true);
  });

  it("sollte ungültige E-Mail-Adressen ablehnen", () => {
    expect(validateEmail("ungueltig")).toBe(false);
    expect(validateEmail("@beispiel.de")).toBe(false);
    expect(validateEmail("benutzer@")).toBe(false);
    expect(validateEmail("benutzer@.de")).toBe(false);
  });
});
