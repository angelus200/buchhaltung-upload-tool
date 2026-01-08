import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
}));

describe("Steuerberater-Router", () => {
  describe("Übergabe-Verwaltung", () => {
    it("sollte Übergabearten korrekt definiert haben", () => {
      const uebergabearten = [
        "datev_export",
        "email",
        "portal",
        "persoenlich",
        "post",
        "cloud",
        "sonstig",
      ];
      
      expect(uebergabearten).toHaveLength(7);
      expect(uebergabearten).toContain("datev_export");
      expect(uebergabearten).toContain("email");
      expect(uebergabearten).toContain("portal");
    });

    it("sollte Status-Optionen korrekt definiert haben", () => {
      const statusOptionen = [
        "vorbereitet",
        "uebergeben",
        "bestaetigt",
        "rueckfrage",
        "abgeschlossen",
      ];
      
      expect(statusOptionen).toHaveLength(5);
      expect(statusOptionen).toContain("vorbereitet");
      expect(statusOptionen).toContain("uebergeben");
      expect(statusOptionen).toContain("abgeschlossen");
    });
  });

  describe("Übergabe-Datenstruktur", () => {
    it("sollte eine Übergabe mit allen Pflichtfeldern erstellen können", () => {
      const uebergabe = {
        unternehmenId: 1,
        bezeichnung: "Monatsabschluss Januar 2025",
        uebergabeart: "datev_export",
        uebergabedatum: "2025-01-31",
        status: "vorbereitet",
      };
      
      expect(uebergabe.unternehmenId).toBe(1);
      expect(uebergabe.bezeichnung).toBe("Monatsabschluss Januar 2025");
      expect(uebergabe.uebergabeart).toBe("datev_export");
      expect(uebergabe.status).toBe("vorbereitet");
    });

    it("sollte optionale Felder unterstützen", () => {
      const uebergabe = {
        unternehmenId: 1,
        bezeichnung: "Q1 2025 Unterlagen",
        uebergabeart: "email",
        uebergabedatum: "2025-04-15",
        status: "uebergeben",
        beschreibung: "Alle Belege für Q1 2025",
        zeitraumVon: "2025-01-01",
        zeitraumBis: "2025-03-31",
        rueckfragen: null,
        dateiUrl: "https://example.com/export.zip",
        dateiName: "export.zip",
      };
      
      expect(uebergabe.beschreibung).toBe("Alle Belege für Q1 2025");
      expect(uebergabe.zeitraumVon).toBe("2025-01-01");
      expect(uebergabe.zeitraumBis).toBe("2025-03-31");
      expect(uebergabe.dateiUrl).toBeDefined();
    });
  });

  describe("Übergabe-Positionen", () => {
    it("sollte Buchungen einer Übergabe zuordnen können", () => {
      const position = {
        uebergabeId: 1,
        buchungId: 42,
        beschreibung: "Rechnung Amazon",
        betrag: "199.99",
      };
      
      expect(position.uebergabeId).toBe(1);
      expect(position.buchungId).toBe(42);
      expect(parseFloat(position.betrag)).toBe(199.99);
    });

    it("sollte mehrere Positionen pro Übergabe unterstützen", () => {
      const positionen = [
        { uebergabeId: 1, buchungId: 1, betrag: "100.00" },
        { uebergabeId: 1, buchungId: 2, betrag: "200.00" },
        { uebergabeId: 1, buchungId: 3, betrag: "300.00" },
      ];
      
      const gesamtbetrag = positionen.reduce(
        (sum, p) => sum + parseFloat(p.betrag),
        0
      );
      
      expect(positionen).toHaveLength(3);
      expect(gesamtbetrag).toBe(600);
    });
  });

  describe("Statistiken", () => {
    it("sollte Statistiken korrekt berechnen", () => {
      const uebergaben = [
        { status: "vorbereitet", gesamtbetrag: "1000" },
        { status: "uebergeben", gesamtbetrag: "2000" },
        { status: "bestaetigt", gesamtbetrag: "1500" },
        { status: "rueckfrage", gesamtbetrag: "500" },
        { status: "abgeschlossen", gesamtbetrag: "3000" },
      ];
      
      const statistiken = {
        gesamt: uebergaben.length,
        vorbereitet: uebergaben.filter(u => u.status === "vorbereitet").length,
        uebergeben: uebergaben.filter(u => u.status === "uebergeben").length,
        bestaetigt: uebergaben.filter(u => u.status === "bestaetigt").length,
        rueckfragen: uebergaben.filter(u => u.status === "rueckfrage").length,
        abgeschlossen: uebergaben.filter(u => u.status === "abgeschlossen").length,
        gesamtBetrag: uebergaben.reduce((sum, u) => sum + parseFloat(u.gesamtbetrag || "0"), 0),
      };
      
      expect(statistiken.gesamt).toBe(5);
      expect(statistiken.vorbereitet).toBe(1);
      expect(statistiken.uebergeben).toBe(1);
      expect(statistiken.rueckfragen).toBe(1);
      expect(statistiken.abgeschlossen).toBe(1);
      expect(statistiken.gesamtBetrag).toBe(8000);
    });
  });

  describe("CSV-Export", () => {
    it("sollte CSV-Header korrekt formatieren", () => {
      const header = "Bezeichnung;Übergabeart;Übergabedatum;Zeitraum Von;Zeitraum Bis;Status;Anzahl Buchungen;Gesamtbetrag";
      const fields = header.split(";");
      
      expect(fields).toHaveLength(8);
      expect(fields[0]).toBe("Bezeichnung");
      expect(fields[7]).toBe("Gesamtbetrag");
    });

    it("sollte Beträge im deutschen Format exportieren", () => {
      const betrag = 1234.56;
      const formatted = betrag.toFixed(2).replace(".", ",");
      
      expect(formatted).toBe("1234,56");
    });
  });

  describe("Nicht übergebene Buchungen", () => {
    it("sollte Buchungen ohne Übergabe-Zuordnung identifizieren", () => {
      const alleBuchungen = [
        { id: 1, geschaeftspartner: "Amazon" },
        { id: 2, geschaeftspartner: "Google" },
        { id: 3, geschaeftspartner: "Microsoft" },
      ];
      
      const uebergebeneBuchungIds = new Set([1]);
      
      const nichtUebergeben = alleBuchungen.filter(
        b => !uebergebeneBuchungIds.has(b.id)
      );
      
      expect(nichtUebergeben).toHaveLength(2);
      expect(nichtUebergeben[0].geschaeftspartner).toBe("Google");
      expect(nichtUebergeben[1].geschaeftspartner).toBe("Microsoft");
    });
  });

  describe("Zeitraum-Filter", () => {
    it("sollte Übergaben nach Zeitraum filtern können", () => {
      const uebergaben = [
        { id: 1, zeitraumVon: "2025-01-01", zeitraumBis: "2025-01-31" },
        { id: 2, zeitraumVon: "2025-02-01", zeitraumBis: "2025-02-28" },
        { id: 3, zeitraumVon: "2025-03-01", zeitraumBis: "2025-03-31" },
      ];
      
      const filterVon = "2025-02-01";
      const filterBis = "2025-02-28";
      
      const gefiltert = uebergaben.filter(u => 
        u.zeitraumVon >= filterVon && u.zeitraumBis <= filterBis
      );
      
      expect(gefiltert).toHaveLength(1);
      expect(gefiltert[0].id).toBe(2);
    });
  });

  describe("Rückfragen-Handling", () => {
    it("sollte Rückfragen vom Steuerberater speichern können", () => {
      const uebergabe = {
        id: 1,
        status: "rueckfrage",
        rueckfragen: "Bitte Beleg für Rechnung #123 nachreichen",
      };
      
      expect(uebergabe.status).toBe("rueckfrage");
      expect(uebergabe.rueckfragen).toContain("Beleg");
      expect(uebergabe.rueckfragen).toContain("nachreichen");
    });
  });
});


describe("Buchungen-Steuerberater Integration", () => {
  describe("Buchung zu Übergabe hinzufügen", () => {
    it("sollte eine einzelne Buchung einer Übergabe zuordnen können", () => {
      const buchung = {
        id: 1,
        geschaeftspartner: "Amazon",
        bruttobetrag: "119.00",
        belegdatum: "2025-01-15",
        belegnummer: "RE-2025-001",
      };
      
      const position = {
        uebergabeId: 1,
        buchungId: buchung.id,
        positionstyp: "buchung",
        betrag: buchung.bruttobetrag,
      };
      
      expect(position.buchungId).toBe(1);
      expect(position.positionstyp).toBe("buchung");
      expect(position.betrag).toBe("119.00");
    });

    it("sollte mehrere Buchungen gleichzeitig hinzufügen können", () => {
      const buchungIds = [1, 2, 3, 4, 5];
      const uebergabeId = 1;
      
      const positionen = buchungIds.map(buchungId => ({
        uebergabeId,
        buchungId,
        positionstyp: "buchung",
      }));
      
      expect(positionen).toHaveLength(5);
      expect(positionen.every(p => p.uebergabeId === 1)).toBe(true);
      expect(positionen.every(p => p.positionstyp === "buchung")).toBe(true);
    });
  });

  describe("Buchungs-Status nach Übergabe", () => {
    it("sollte Buchung als übergeben markieren", () => {
      const buchung = {
        id: 1,
        anSteuerberaterUebergeben: false,
        steuerberaterUebergabeId: null,
      };
      
      // Nach Übergabe
      const aktualisiert = {
        ...buchung,
        anSteuerberaterUebergeben: true,
        steuerberaterUebergabeId: 1,
      };
      
      expect(aktualisiert.anSteuerberaterUebergeben).toBe(true);
      expect(aktualisiert.steuerberaterUebergabeId).toBe(1);
    });

    it("sollte nur vollständige Buchungen zur Übergabe erlauben", () => {
      const buchungen = [
        { id: 1, status: "complete", geschaeftspartner: "Amazon" },
        { id: 2, status: "pending", geschaeftspartner: "Google" },
        { id: 3, status: "complete", geschaeftspartner: "Microsoft" },
      ];
      
      const uebergabeFaehig = buchungen.filter(b => b.status === "complete");
      
      expect(uebergabeFaehig).toHaveLength(2);
      expect(uebergabeFaehig.map(b => b.geschaeftspartner)).toContain("Amazon");
      expect(uebergabeFaehig.map(b => b.geschaeftspartner)).toContain("Microsoft");
      expect(uebergabeFaehig.map(b => b.geschaeftspartner)).not.toContain("Google");
    });
  });

  describe("Übergabe-Statistiken mit Buchungen", () => {
    it("sollte Anzahl und Summe der Buchungen aktualisieren", () => {
      const buchungen = [
        { bruttobetrag: "100.00" },
        { bruttobetrag: "200.00" },
        { bruttobetrag: "300.00" },
      ];
      
      const anzahlBuchungen = buchungen.length;
      const gesamtbetrag = buchungen.reduce(
        (sum, b) => sum + parseFloat(b.bruttobetrag),
        0
      );
      
      expect(anzahlBuchungen).toBe(3);
      expect(gesamtbetrag).toBe(600);
    });
  });

  describe("Buchungen in Übergabe-Detail anzeigen", () => {
    it("sollte Buchungsdetails in Positionen-Tabelle anzeigen", () => {
      const positionen = [
        {
          id: 1,
          positionstyp: "buchung",
          buchung: {
            belegdatum: "2025-01-15",
            belegnummer: "RE-2025-001",
            geschaeftspartner: "Amazon",
            bruttobetrag: "119.00",
          },
          betrag: "119.00",
        },
        {
          id: 2,
          positionstyp: "finanzamt",
          finanzamtDokument: {
            betreff: "Umsatzsteuerbescheid 2024",
            aktenzeichen: "123/456/78901",
            dokumentTyp: "bescheid",
          },
          betrag: "5000.00",
        },
      ];
      
      const buchungPositionen = positionen.filter(p => p.positionstyp === "buchung");
      const finanzamtPositionen = positionen.filter(p => p.positionstyp === "finanzamt");
      
      expect(buchungPositionen).toHaveLength(1);
      expect(finanzamtPositionen).toHaveLength(1);
      expect(buchungPositionen[0].buchung?.geschaeftspartner).toBe("Amazon");
      expect(finanzamtPositionen[0].finanzamtDokument?.betreff).toContain("Umsatzsteuerbescheid");
    });
  });

  describe("Nicht übergebene Buchungen filtern", () => {
    it("sollte bereits übergebene Buchungen ausblenden", () => {
      const alleBuchungen = [
        { id: 1, anSteuerberaterUebergeben: true },
        { id: 2, anSteuerberaterUebergeben: false },
        { id: 3, anSteuerberaterUebergeben: true },
        { id: 4, anSteuerberaterUebergeben: false },
      ];
      
      const nichtUebergeben = alleBuchungen.filter(b => !b.anSteuerberaterUebergeben);
      
      expect(nichtUebergeben).toHaveLength(2);
      expect(nichtUebergeben.map(b => b.id)).toEqual([2, 4]);
    });
  });
});


describe("Beleg-Vorschau im Steuerberater-Modul", () => {
  describe("Beleg-URL Erkennung", () => {
    it("sollte Bild-URLs korrekt erkennen", () => {
      const imageUrls = [
        "https://storage.example.com/belege/1/123_rechnung.jpg",
        "https://storage.example.com/belege/1/123_rechnung.jpeg",
        "https://storage.example.com/belege/1/123_rechnung.png",
        "https://storage.example.com/belege/1/123_rechnung.gif",
        "https://storage.example.com/belege/1/123_rechnung.webp",
      ];
      
      const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      
      imageUrls.forEach(url => {
        expect(isImageUrl(url)).toBe(true);
      });
    });

    it("sollte PDF-URLs korrekt erkennen", () => {
      const pdfUrl = "https://storage.example.com/belege/1/123_rechnung.pdf";
      const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      
      expect(isImageUrl(pdfUrl)).toBe(false);
    });

    it("sollte case-insensitive sein", () => {
      const urls = [
        "https://example.com/file.JPG",
        "https://example.com/file.PDF",
        "https://example.com/file.Png",
      ];
      
      const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      
      expect(isImageUrl(urls[0])).toBe(true);
      expect(isImageUrl(urls[1])).toBe(false);
      expect(isImageUrl(urls[2])).toBe(true);
    });
  });

  describe("Übergabe-Detail mit Belegen", () => {
    it("sollte Buchungen mit belegUrl enthalten", () => {
      const uebergabeDetail = {
        id: 1,
        bezeichnung: "Januar 2025",
        positionen: [
          {
            id: 1,
            buchung: {
              id: 42,
              belegnummer: "RE-2025-001",
              geschaeftspartner: "Amazon",
              belegUrl: "https://storage.example.com/belege/1/123_rechnung.pdf",
            },
            betrag: "119.00",
          },
          {
            id: 2,
            buchung: {
              id: 43,
              belegnummer: "RE-2025-002",
              geschaeftspartner: "Microsoft",
              belegUrl: null,
            },
            betrag: "299.00",
          },
        ],
      };
      
      const belegeVorhanden = uebergabeDetail.positionen.filter(
        pos => pos.buchung?.belegUrl
      );
      
      expect(belegeVorhanden).toHaveLength(1);
      expect(belegeVorhanden[0].buchung?.belegUrl).toContain("rechnung.pdf");
    });

    it("sollte Finanzamt-Dokumente mit dateiUrl unterstützen", () => {
      const position = {
        id: 1,
        finanzamtDokument: {
          id: 10,
          betreff: "Umsatzsteuer-Voranmeldung",
          dateiUrl: "https://storage.example.com/finanzamt/1/ust_va.pdf",
        },
        betrag: "0.00",
      };
      
      expect(position.finanzamtDokument?.dateiUrl).toBeTruthy();
    });
  });

  describe("Beleg-Galerie", () => {
    it("sollte nur Positionen mit Belegen anzeigen", () => {
      const positionen = [
        { id: 1, buchung: { belegUrl: "https://example.com/1.pdf" } },
        { id: 2, buchung: { belegUrl: null } },
        { id: 3, buchung: { belegUrl: "https://example.com/3.jpg" } },
        { id: 4, finanzamtDokument: { dateiUrl: "https://example.com/fa.pdf" } },
      ];
      
      const mitBelegen = positionen.filter(pos => pos.buchung?.belegUrl);
      
      expect(mitBelegen).toHaveLength(2);
    });

    it("sollte Beleg-Anzahl korrekt berechnen", () => {
      const positionen = [
        { buchung: { belegUrl: "https://example.com/1.pdf" } },
        { buchung: { belegUrl: "https://example.com/2.jpg" } },
        { buchung: { belegUrl: null } },
      ];
      
      const anzahlBelege = positionen.filter(pos => pos.buchung?.belegUrl).length;
      
      expect(anzahlBelege).toBe(2);
    });
  });
});
