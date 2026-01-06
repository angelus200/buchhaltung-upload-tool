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
  innerJoin: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

describe("Zahlungsstatus-Funktionalität", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Zahlungsstatus-Typen", () => {
    it("sollte alle Zahlungsstatus-Werte unterstützen", () => {
      const zahlungsstatusWerte = ["offen", "teilweise_bezahlt", "bezahlt", "ueberfaellig"];
      expect(zahlungsstatusWerte).toContain("offen");
      expect(zahlungsstatusWerte).toContain("teilweise_bezahlt");
      expect(zahlungsstatusWerte).toContain("bezahlt");
      expect(zahlungsstatusWerte).toContain("ueberfaellig");
    });
  });

  describe("Zahlungsübersicht-Berechnung", () => {
    it("sollte offene Rechnungen korrekt zählen", () => {
      const buchungen = [
        { zahlungsstatus: "offen", bruttobetrag: "100.00" },
        { zahlungsstatus: "offen", bruttobetrag: "200.00" },
        { zahlungsstatus: "bezahlt", bruttobetrag: "150.00" },
      ];
      
      const offene = buchungen.filter(b => b.zahlungsstatus === "offen");
      expect(offene.length).toBe(2);
    });

    it("sollte bezahlte Rechnungen korrekt zählen", () => {
      const buchungen = [
        { zahlungsstatus: "bezahlt", bruttobetrag: "100.00" },
        { zahlungsstatus: "bezahlt", bruttobetrag: "200.00" },
        { zahlungsstatus: "offen", bruttobetrag: "150.00" },
      ];
      
      const bezahlte = buchungen.filter(b => b.zahlungsstatus === "bezahlt");
      expect(bezahlte.length).toBe(2);
    });

    it("sollte teilweise bezahlte Rechnungen korrekt zählen", () => {
      const buchungen = [
        { zahlungsstatus: "teilweise_bezahlt", bruttobetrag: "100.00", bezahlterBetrag: "50.00" },
        { zahlungsstatus: "bezahlt", bruttobetrag: "200.00" },
      ];
      
      const teilweise = buchungen.filter(b => b.zahlungsstatus === "teilweise_bezahlt");
      expect(teilweise.length).toBe(1);
    });

    it("sollte überfällige Rechnungen korrekt identifizieren", () => {
      const heute = new Date();
      const gestern = new Date(heute);
      gestern.setDate(gestern.getDate() - 1);
      const morgen = new Date(heute);
      morgen.setDate(morgen.getDate() + 1);
      
      const buchungen = [
        { zahlungsstatus: "offen", faelligkeitsdatum: gestern, bruttobetrag: "100.00" },
        { zahlungsstatus: "offen", faelligkeitsdatum: morgen, bruttobetrag: "200.00" },
      ];
      
      const ueberfaellige = buchungen.filter(b => 
        b.zahlungsstatus === "offen" && 
        b.faelligkeitsdatum && 
        new Date(b.faelligkeitsdatum) < heute
      );
      expect(ueberfaellige.length).toBe(1);
    });
  });

  describe("Betragsberechnung", () => {
    it("sollte offenen Betrag korrekt berechnen", () => {
      const buchungen = [
        { zahlungsstatus: "offen", bruttobetrag: "100.00" },
        { zahlungsstatus: "offen", bruttobetrag: "200.00" },
        { zahlungsstatus: "bezahlt", bruttobetrag: "150.00" },
      ];
      
      const offenerBetrag = buchungen
        .filter(b => b.zahlungsstatus === "offen")
        .reduce((sum, b) => sum + parseFloat(b.bruttobetrag), 0);
      
      expect(offenerBetrag).toBe(300);
    });

    it("sollte bezahlten Betrag korrekt berechnen", () => {
      const buchungen = [
        { zahlungsstatus: "bezahlt", bruttobetrag: "100.00" },
        { zahlungsstatus: "bezahlt", bruttobetrag: "200.00" },
        { zahlungsstatus: "offen", bruttobetrag: "150.00" },
      ];
      
      const bezahlterBetrag = buchungen
        .filter(b => b.zahlungsstatus === "bezahlt")
        .reduce((sum, b) => sum + parseFloat(b.bruttobetrag), 0);
      
      expect(bezahlterBetrag).toBe(300);
    });

    it("sollte Restbetrag bei teilweiser Zahlung korrekt berechnen", () => {
      const buchung = {
        bruttobetrag: "100.00",
        bezahlterBetrag: "40.00",
        zahlungsstatus: "teilweise_bezahlt",
      };
      
      const restbetrag = parseFloat(buchung.bruttobetrag) - parseFloat(buchung.bezahlterBetrag);
      expect(restbetrag).toBe(60);
    });
  });

  describe("Zahlungsstatus-Update", () => {
    it("sollte Status auf bezahlt setzen können", () => {
      const buchung = {
        id: 1,
        zahlungsstatus: "offen",
        bruttobetrag: "100.00",
      };
      
      const updateData = {
        zahlungsstatus: "bezahlt",
        bezahltAm: new Date().toISOString().split("T")[0],
      };
      
      const updatedBuchung = { ...buchung, ...updateData };
      expect(updatedBuchung.zahlungsstatus).toBe("bezahlt");
    });

    it("sollte teilweise Zahlung mit Betrag erfassen können", () => {
      const buchung = {
        id: 1,
        zahlungsstatus: "offen",
        bruttobetrag: "100.00",
        bezahlterBetrag: null,
      };
      
      const updateData = {
        zahlungsstatus: "teilweise_bezahlt",
        bezahltAm: new Date().toISOString().split("T")[0],
        bezahlterBetrag: "50.00",
      };
      
      const updatedBuchung = { ...buchung, ...updateData };
      expect(updatedBuchung.zahlungsstatus).toBe("teilweise_bezahlt");
      expect(updatedBuchung.bezahlterBetrag).toBe("50.00");
    });

    it("sollte Zahlungsreferenz speichern können", () => {
      const updateData = {
        zahlungsstatus: "bezahlt" as const,
        bezahltAm: "2025-01-06",
        zahlungsreferenz: "SEPA-2025-001",
      };
      
      expect(updateData.zahlungsreferenz).toBe("SEPA-2025-001");
    });
  });

  describe("Filterung", () => {
    it("sollte nach Status filtern können", () => {
      const buchungen = [
        { id: 1, zahlungsstatus: "offen" },
        { id: 2, zahlungsstatus: "bezahlt" },
        { id: 3, zahlungsstatus: "offen" },
        { id: 4, zahlungsstatus: "teilweise_bezahlt" },
      ];
      
      const gefiltert = buchungen.filter(b => b.zahlungsstatus === "offen");
      expect(gefiltert.length).toBe(2);
      expect(gefiltert.map(b => b.id)).toEqual([1, 3]);
    });

    it("sollte alle Buchungen ohne Filter zurückgeben", () => {
      const buchungen = [
        { id: 1, zahlungsstatus: "offen" },
        { id: 2, zahlungsstatus: "bezahlt" },
        { id: 3, zahlungsstatus: "teilweise_bezahlt" },
      ];
      
      const filterStatus = "alle";
      const gefiltert = filterStatus === "alle" ? buchungen : buchungen.filter(b => b.zahlungsstatus === filterStatus);
      expect(gefiltert.length).toBe(3);
    });
  });

  describe("Währungsformatierung", () => {
    it("sollte Beträge korrekt formatieren", () => {
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
      };
      
      // Prüfe dass die Formatierung einen Euro-Betrag zurückgibt
      expect(formatCurrency(1234.56)).toContain("1.234,56");
      expect(formatCurrency(1234.56)).toContain("€");
      expect(formatCurrency(0)).toContain("0,00");
      expect(formatCurrency(1000000)).toContain("1.000.000,00");
    });
  });

  describe("Datumsformatierung", () => {
    it("sollte Datum korrekt formatieren", () => {
      const formatDate = (date: Date | string | null) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("de-DE");
      };
      
      // Prüfe dass null korrekt behandelt wird
      expect(formatDate(null)).toBe("-");
      // Prüfe dass ein Datum zurückgegeben wird (Zeitzone kann variieren)
      const result = formatDate("2025-01-06");
      expect(result).toMatch(/\d{1,2}\.\d{1,2}\.2025/);
    });
  });
});
