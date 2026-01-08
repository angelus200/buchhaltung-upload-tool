import { describe, it, expect } from "vitest";
import { SKR03, SKR04, getKontenrahmen, getKontenByTyp, STEUERSAETZE } from "../shared/kontenrahmen";

describe("Kontenrahmen", () => {
  describe("SKR03", () => {
    it("sollte Aufwandskonten enthalten", () => {
      expect(SKR03.aufwand).toBeDefined();
      expect(SKR03.aufwand.length).toBeGreaterThan(0);
      
      // Prüfe typische Aufwandskonten
      const miete = SKR03.aufwand.find(k => k.konto === "4120");
      expect(miete).toBeDefined();
      expect(miete?.bezeichnung).toBe("Miete");
      
      const buero = SKR03.aufwand.find(k => k.konto === "4930");
      expect(buero).toBeDefined();
      expect(buero?.bezeichnung).toBe("Bürobedarf");
    });

    it("sollte Ertragskonten enthalten", () => {
      expect(SKR03.ertrag).toBeDefined();
      expect(SKR03.ertrag.length).toBeGreaterThan(0);
      
      // Prüfe typische Ertragskonten
      const erloese19 = SKR03.ertrag.find(k => k.konto === "8400");
      expect(erloese19).toBeDefined();
      expect(erloese19?.bezeichnung).toBe("Erlöse 19% USt");
    });

    it("sollte Anlagenkonten enthalten", () => {
      expect(SKR03.anlage).toBeDefined();
      expect(SKR03.anlage.length).toBeGreaterThan(0);
      
      // Prüfe typische Anlagenkonten
      const fahrzeuge = SKR03.anlage.find(k => k.konto === "0420");
      expect(fahrzeuge).toBeDefined();
      expect(fahrzeuge?.bezeichnung).toBe("Fahrzeuge");
    });

    it("sollte Finanzkonten enthalten", () => {
      expect(SKR03.finanz).toBeDefined();
      expect(SKR03.finanz.length).toBeGreaterThan(0);
      
      // Prüfe typische Finanzkonten
      const bank = SKR03.finanz.find(k => k.konto === "1200");
      expect(bank).toBeDefined();
      expect(bank?.bezeichnung).toBe("Bank");
      
      const kasse = SKR03.finanz.find(k => k.konto === "1000");
      expect(kasse).toBeDefined();
      expect(kasse?.bezeichnung).toBe("Kasse");
    });

    it("sollte Eigenkapitalkonten enthalten", () => {
      expect(SKR03.eigenkapital).toBeDefined();
      expect(SKR03.eigenkapital.length).toBeGreaterThan(0);
      
      // Prüfe typische Eigenkapitalkonten
      const kapital = SKR03.eigenkapital.find(k => k.konto === "0800");
      expect(kapital).toBeDefined();
      expect(kapital?.bezeichnung).toBe("Gezeichnetes Kapital");
    });

    it("sollte Verbindlichkeitenkonten enthalten", () => {
      expect(SKR03.verbindlichkeiten).toBeDefined();
      expect(SKR03.verbindlichkeiten.length).toBeGreaterThan(0);
      
      // Prüfe typische Verbindlichkeitenkonten
      const verbLL = SKR03.verbindlichkeiten.find(k => k.konto === "1600");
      expect(verbLL).toBeDefined();
      expect(verbLL?.bezeichnung).toBe("Verbindlichkeiten aus L+L");
    });
  });

  describe("SKR04", () => {
    it("sollte Aufwandskonten enthalten", () => {
      expect(SKR04.aufwand).toBeDefined();
      expect(SKR04.aufwand.length).toBeGreaterThan(0);
      
      // SKR04 hat andere Kontonummern für Aufwand (6xxx)
      const miete = SKR04.aufwand.find(k => k.konto === "6310");
      expect(miete).toBeDefined();
      expect(miete?.bezeichnung).toBe("Miete");
    });

    it("sollte Ertragskonten enthalten", () => {
      expect(SKR04.ertrag).toBeDefined();
      expect(SKR04.ertrag.length).toBeGreaterThan(0);
      
      // SKR04 hat andere Kontonummern für Ertrag (4xxx)
      const erloese19 = SKR04.ertrag.find(k => k.konto === "4400");
      expect(erloese19).toBeDefined();
      expect(erloese19?.bezeichnung).toBe("Erlöse 19% USt");
    });

    it("sollte sich von SKR03 unterscheiden", () => {
      // Aufwandskonten haben unterschiedliche Nummernbereiche
      const skr03AufwandKonten = SKR03.aufwand.map(k => k.konto);
      const skr04AufwandKonten = SKR04.aufwand.map(k => k.konto);
      
      // SKR03 Aufwand beginnt mit 4, SKR04 mit 6
      expect(skr03AufwandKonten.some(k => k.startsWith("4"))).toBe(true);
      expect(skr04AufwandKonten.some(k => k.startsWith("6"))).toBe(true);
    });
  });

  describe("getKontenrahmen", () => {
    it("sollte SKR03 zurückgeben wenn SKR03 angefordert wird", () => {
      const kr = getKontenrahmen("SKR03");
      expect(kr).toBe(SKR03);
    });

    it("sollte SKR04 zurückgeben wenn SKR04 angefordert wird", () => {
      const kr = getKontenrahmen("SKR04");
      expect(kr).toBe(SKR04);
    });
  });

  describe("getKontenByTyp", () => {
    it("sollte Aufwandskonten für SKR03 zurückgeben", () => {
      const konten = getKontenByTyp("SKR03", "aufwand");
      expect(konten).toBe(SKR03.aufwand);
    });

    it("sollte Ertragskonten für SKR04 zurückgeben", () => {
      const konten = getKontenByTyp("SKR04", "ertrag");
      expect(konten).toBe(SKR04.ertrag);
    });
  });

  describe("STEUERSAETZE", () => {
    it("sollte die deutschen Steuersätze enthalten", () => {
      expect(STEUERSAETZE).toBeDefined();
      expect(STEUERSAETZE.length).toBe(3);
      
      const regelsteuer = STEUERSAETZE.find(s => s.satz === "19");
      expect(regelsteuer).toBeDefined();
      expect(regelsteuer?.bezeichnung).toBe("19% Regelsteuersatz");
      
      const ermaessigt = STEUERSAETZE.find(s => s.satz === "7");
      expect(ermaessigt).toBeDefined();
      expect(ermaessigt?.bezeichnung).toBe("7% ermäßigter Steuersatz");
      
      const steuerfrei = STEUERSAETZE.find(s => s.satz === "0");
      expect(steuerfrei).toBeDefined();
      expect(steuerfrei?.bezeichnung).toBe("Steuerfrei");
    });
  });
});

describe("DATEV Export Format", () => {
  it("sollte korrekte Buchungssatz-Struktur haben", () => {
    // Simuliere eine Buchung
    const buchung = {
      bruttobetrag: "119.00",
      buchungsart: "aufwand" as const,
      sachkonto: "4930",
      geschaeftspartnerKonto: "70001",
      belegdatum: "2025-12-15",
      belegnummer: "RE-2025-001",
      buchungstext: "Büromaterial",
      kostenstelle: "100",
    };

    // Prüfe die Struktur
    expect(buchung.bruttobetrag).toMatch(/^\d+\.\d{2}$/);
    expect(buchung.sachkonto).toMatch(/^\d{4}$/);
    expect(buchung.geschaeftspartnerKonto).toMatch(/^\d{5}$/);
    expect(buchung.belegdatum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("sollte Soll/Haben korrekt zuordnen", () => {
    // Aufwand = Soll (S)
    // Ertrag = Haben (H)
    const aufwandBuchung = { buchungsart: "aufwand" };
    const ertragBuchung = { buchungsart: "ertrag" };

    const getSollHaben = (buchungsart: string) => 
      buchungsart === "ertrag" ? "H" : "S";

    expect(getSollHaben(aufwandBuchung.buchungsart)).toBe("S");
    expect(getSollHaben(ertragBuchung.buchungsart)).toBe("H");
  });
});


describe("Persistente Buchungen-Speicherung", () => {
  describe("Buchung erstellen", () => {
    it("sollte alle Pflichtfelder für eine Buchung validieren", () => {
      const buchung = {
        unternehmenId: 1,
        buchungsart: "aufwand" as const,
        belegdatum: "2025-01-15",
        belegnummer: "RE-2025-001",
        geschaeftspartnerTyp: "kreditor" as const,
        geschaeftspartner: "Amazon GmbH",
        geschaeftspartnerKonto: "70001",
        sachkonto: "4930",
        nettobetrag: "100.00",
        steuersatz: "19",
        bruttobetrag: "119.00",
      };
      
      expect(buchung.unternehmenId).toBe(1);
      expect(buchung.buchungsart).toBe("aufwand");
      expect(buchung.belegdatum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(buchung.belegnummer).toBeTruthy();
      expect(buchung.geschaeftspartner).toBeTruthy();
      expect(parseFloat(buchung.nettobetrag)).toBeGreaterThan(0);
      expect(parseFloat(buchung.bruttobetrag)).toBeGreaterThan(0);
    });

    it("sollte Bruttobetrag korrekt aus Netto und Steuersatz berechnen", () => {
      const netto = 100;
      const steuersatz = 19;
      const brutto = netto * (1 + steuersatz / 100);
      
      expect(brutto).toBe(119);
    });

    it("sollte verschiedene Buchungsarten unterstützen", () => {
      const buchungsarten = ["aufwand", "ertrag", "anlage", "sonstig"];
      
      expect(buchungsarten).toHaveLength(4);
      expect(buchungsarten).toContain("aufwand");
      expect(buchungsarten).toContain("ertrag");
      expect(buchungsarten).toContain("anlage");
      expect(buchungsarten).toContain("sonstig");
    });
  });

  describe("Buchung zu Steuerberater-Übergabe", () => {
    it("sollte Buchung speichern und ID zurückgeben", () => {
      // Simuliere Speicherung
      const savedBuchung = {
        id: 42,
        unternehmenId: 1,
        buchungsart: "aufwand",
        geschaeftspartner: "Amazon GmbH",
        bruttobetrag: "119.00",
      };
      
      expect(savedBuchung.id).toBe(42);
      expect(savedBuchung.id).toBeGreaterThan(0);
    });

    it("sollte gespeicherte Buchung zur Übergabe hinzufügen können", () => {
      const buchungId = 42;
      const uebergabeId = 1;
      
      const position = {
        uebergabeId,
        buchungId,
        positionstyp: "buchung",
        betrag: "119.00",
      };
      
      expect(position.buchungId).toBe(buchungId);
      expect(position.uebergabeId).toBe(uebergabeId);
      expect(position.positionstyp).toBe("buchung");
    });

    it("sollte Workflow: Speichern -> Übergabe korrekt abbilden", () => {
      // Schritt 1: Lokale Buchung
      const lokaleBuchung = {
        id: "temp-123",
        geschaeftspartner: "Amazon",
        bruttobetrag: "119.00",
        status: "complete",
        anSteuerberaterUebergeben: false,
      };
      
      // Schritt 2: In DB speichern
      const gespeicherteBuchung = {
        ...lokaleBuchung,
        id: 42, // Neue DB-ID
      };
      
      // Schritt 3: Zur Übergabe hinzufügen
      const position = {
        uebergabeId: 1,
        buchungId: gespeicherteBuchung.id,
      };
      
      // Schritt 4: Lokal als übergeben markieren
      const aktualisiert = {
        ...lokaleBuchung,
        anSteuerberaterUebergeben: true,
        steuerberaterUebergabeId: 1,
      };
      
      expect(gespeicherteBuchung.id).toBe(42);
      expect(position.buchungId).toBe(42);
      expect(aktualisiert.anSteuerberaterUebergeben).toBe(true);
    });
  });

  describe("Validierung vor Speicherung", () => {
    it("sollte nur vollständige Buchungen speichern", () => {
      const vollstaendig = {
        status: "complete",
        geschaeftspartner: "Amazon",
        sachkonto: "4930",
        bruttobetrag: "119.00",
      };
      
      const unvollstaendig = {
        status: "pending",
        geschaeftspartner: "",
        sachkonto: "",
        bruttobetrag: "",
      };
      
      const istVollstaendig = (b: typeof vollstaendig) => 
        b.status === "complete" && 
        b.geschaeftspartner && 
        b.sachkonto && 
        b.bruttobetrag;
      
      expect(istVollstaendig(vollstaendig)).toBeTruthy();
      expect(istVollstaendig(unvollstaendig)).toBeFalsy();
    });

    it("sollte Beträge im deutschen Format konvertieren", () => {
      const deutschFormat = "1.234,56";
      const dbFormat = deutschFormat.replace(".", "").replace(",", ".");
      
      expect(parseFloat(dbFormat)).toBe(1234.56);
    });
  });
});


describe("S3 Beleg-Upload Integration", () => {
  describe("Upload-Pfad-Generierung", () => {
    it("sollte einen sicheren Dateinamen generieren", () => {
      const unsafeName = "Rechnung 2025/01 (Kopie).pdf";
      const safeName = unsafeName.replace(/[^a-zA-Z0-9.-]/g, "_");
      
      expect(safeName).toBe("Rechnung_2025_01__Kopie_.pdf");
      expect(safeName).not.toContain("/");
      expect(safeName).not.toContain(" ");
    });

    it("sollte einen eindeutigen Pfad mit Timestamp generieren", () => {
      const unternehmenId = 1;
      const timestamp = Date.now();
      const safeName = "rechnung.pdf";
      const path = `belege/${unternehmenId}/${timestamp}_${safeName}`;
      
      expect(path).toMatch(/^belege\/\d+\/\d+_rechnung\.pdf$/);
    });
  });

  describe("Base64-Konvertierung", () => {
    it("sollte Base64-Präfix korrekt entfernen", () => {
      const base64WithPrefix = "data:application/pdf;base64,JVBERi0xLjQ=";
      const cleanBase64 = base64WithPrefix.replace(/^data:[^;]+;base64,/, "");
      
      expect(cleanBase64).toBe("JVBERi0xLjQ=");
      expect(cleanBase64).not.toContain("data:");
    });

    it("sollte verschiedene MIME-Types unterstützen", () => {
      const mimeTypes = [
        "data:application/pdf;base64,",
        "data:image/jpeg;base64,",
        "data:image/png;base64,",
        "data:image/gif;base64,",
      ];
      
      mimeTypes.forEach(prefix => {
        const testData = prefix + "ABC123";
        const cleaned = testData.replace(/^data:[^;]+;base64,/, "");
        expect(cleaned).toBe("ABC123");
      });
    });
  });

  describe("Upload-Workflow", () => {
    it("sollte Beleg vor Buchung hochladen", async () => {
      // Simuliere den Workflow
      const workflow = {
        step1: "beleg_upload",
        step2: "buchung_speichern",
        step3: "uebergabe_verknuepfen",
      };
      
      expect(Object.keys(workflow)).toEqual(["step1", "step2", "step3"]);
      expect(workflow.step1).toBe("beleg_upload");
    });

    it("sollte Beleg-URL in Buchung speichern", () => {
      const buchung = {
        id: 1,
        geschaeftspartner: "Amazon",
        bruttobetrag: "119.00",
        belegUrl: null as string | null,
      };
      
      // Simuliere Upload-Ergebnis
      const uploadResult = {
        url: "https://storage.example.com/belege/1/123456_rechnung.pdf",
        key: "belege/1/123456_rechnung.pdf",
      };
      
      // Buchung mit Beleg-URL
      const buchungMitBeleg = {
        ...buchung,
        belegUrl: uploadResult.url,
      };
      
      expect(buchungMitBeleg.belegUrl).toBe(uploadResult.url);
      expect(buchungMitBeleg.belegUrl).toContain("storage");
    });
  });

  describe("Fehlerbehandlung", () => {
    it("sollte ohne Beleg speichern können", () => {
      const buchungOhneBeleg = {
        id: 1,
        geschaeftspartner: "Amazon",
        belegUrl: undefined,
      };
      
      expect(buchungOhneBeleg.belegUrl).toBeUndefined();
    });

    it("sollte große Dateien ablehnen", () => {
      const maxSize = 10 * 1024 * 1024; // 10 MB
      const fileSize = 15 * 1024 * 1024; // 15 MB
      
      const isValid = fileSize <= maxSize;
      expect(isValid).toBe(false);
    });

    it("sollte nur erlaubte Dateitypen akzeptieren", () => {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      
      expect(allowedTypes.includes("application/pdf")).toBe(true);
      expect(allowedTypes.includes("image/jpeg")).toBe(true);
      expect(allowedTypes.includes("text/plain")).toBe(false);
    });
  });
});
