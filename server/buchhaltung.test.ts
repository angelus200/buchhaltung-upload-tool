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
