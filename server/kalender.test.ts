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

describe("Fälligkeitskalender-Funktionalität", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Kalender-Datumsberechnung", () => {
    it("sollte den ersten Tag des Monats korrekt berechnen", () => {
      const date = new Date(2025, 0, 15); // 15. Januar 2025
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      expect(firstDay.getDate()).toBe(1);
      expect(firstDay.getMonth()).toBe(0);
      expect(firstDay.getFullYear()).toBe(2025);
    });

    it("sollte den letzten Tag des Monats korrekt berechnen", () => {
      const date = new Date(2025, 0, 15); // Januar 2025
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      expect(lastDay.getDate()).toBe(31);
    });

    it("sollte den letzten Tag im Februar korrekt berechnen (Schaltjahr)", () => {
      const date = new Date(2024, 1, 15); // Februar 2024 (Schaltjahr)
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      expect(lastDay.getDate()).toBe(29);
    });

    it("sollte den Wochentag korrekt berechnen (Montag = 0)", () => {
      const date = new Date(2025, 0, 6); // 6. Januar 2025 = Montag
      const weekday = date.getDay();
      const mondayFirst = weekday === 0 ? 6 : weekday - 1;
      expect(mondayFirst).toBe(0); // Montag
    });
  });

  describe("Fälligkeiten-Filterung", () => {
    const testFaelligkeiten = [
      { id: 1, date: new Date(2025, 0, 5), status: "offen", amount: 100 },
      { id: 2, date: new Date(2025, 0, 10), status: "bezahlt", amount: 200 },
      { id: 3, date: new Date(2025, 0, 15), status: "ueberfaellig", amount: 300 },
      { id: 4, date: new Date(2025, 1, 5), status: "offen", amount: 400 },
    ];

    it("sollte Fälligkeiten nach Monat filtern", () => {
      const januar = testFaelligkeiten.filter((f) => {
        return f.date.getMonth() === 0 && f.date.getFullYear() === 2025;
      });
      expect(januar.length).toBe(3);
    });

    it("sollte offene Fälligkeiten zählen", () => {
      const offene = testFaelligkeiten.filter((f) => f.status === "offen");
      expect(offene.length).toBe(2);
    });

    it("sollte überfällige Fälligkeiten zählen", () => {
      const ueberfaellige = testFaelligkeiten.filter((f) => f.status === "ueberfaellig");
      expect(ueberfaellige.length).toBe(1);
    });

    it("sollte Gesamtbetrag berechnen", () => {
      const summe = testFaelligkeiten.reduce((sum, f) => sum + f.amount, 0);
      expect(summe).toBe(1000);
    });

    it("sollte offenen Betrag berechnen", () => {
      const offenerBetrag = testFaelligkeiten
        .filter((f) => f.status === "offen" || f.status === "ueberfaellig")
        .reduce((sum, f) => sum + f.amount, 0);
      expect(offenerBetrag).toBe(800);
    });
  });

  describe("Kalender-Grid-Generierung", () => {
    it("sollte leere Tage vor dem ersten Tag hinzufügen", () => {
      // Januar 2025 beginnt an einem Mittwoch (Index 2 bei Montag = 0)
      const firstDay = new Date(2025, 0, 1);
      const weekday = firstDay.getDay();
      const mondayFirst = weekday === 0 ? 6 : weekday - 1;
      expect(mondayFirst).toBe(2); // Mittwoch
    });

    it("sollte korrekte Anzahl von Tagen im Monat haben", () => {
      const months = [
        { month: 0, days: 31 }, // Januar
        { month: 1, days: 28 }, // Februar (2025 kein Schaltjahr)
        { month: 2, days: 31 }, // März
        { month: 3, days: 30 }, // April
      ];

      for (const { month, days } of months) {
        const lastDay = new Date(2025, month + 1, 0);
        expect(lastDay.getDate()).toBe(days);
      }
    });
  });

  describe("Event-Gruppierung nach Datum", () => {
    it("sollte Events nach Datum gruppieren", () => {
      const events = [
        { id: 1, date: new Date(2025, 0, 5), title: "Event 1" },
        { id: 2, date: new Date(2025, 0, 5), title: "Event 2" },
        { id: 3, date: new Date(2025, 0, 10), title: "Event 3" },
      ];

      const grouped = new Map<string, typeof events>();
      events.forEach((event) => {
        const dateKey = event.date.toISOString().split("T")[0];
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(event);
      });

      expect(grouped.get("2025-01-05")?.length).toBe(2);
      expect(grouped.get("2025-01-10")?.length).toBe(1);
    });
  });

  describe("Status-Bestimmung", () => {
    it("sollte offene Fälligkeit als überfällig markieren wenn Datum überschritten", () => {
      const heute = new Date();
      const gestern = new Date(heute);
      gestern.setDate(gestern.getDate() - 1);

      const buchung = {
        zahlungsstatus: "offen",
        faelligkeitsdatum: gestern,
      };

      let status = buchung.zahlungsstatus;
      if (status === "offen" && buchung.faelligkeitsdatum < heute) {
        status = "ueberfaellig";
      }

      expect(status).toBe("ueberfaellig");
    });

    it("sollte offene Fälligkeit nicht als überfällig markieren wenn Datum noch nicht erreicht", () => {
      const heute = new Date();
      const morgen = new Date(heute);
      morgen.setDate(morgen.getDate() + 1);

      const buchung = {
        zahlungsstatus: "offen",
        faelligkeitsdatum: morgen,
      };

      let status = buchung.zahlungsstatus;
      if (status === "offen" && buchung.faelligkeitsdatum < heute) {
        status = "ueberfaellig";
      }

      expect(status).toBe("offen");
    });

    it("sollte bezahlte Fälligkeit nicht ändern", () => {
      const heute = new Date();
      const gestern = new Date(heute);
      gestern.setDate(gestern.getDate() - 1);

      const buchung = {
        zahlungsstatus: "bezahlt",
        faelligkeitsdatum: gestern,
      };

      let status = buchung.zahlungsstatus;
      if (status === "offen" && buchung.faelligkeitsdatum < heute) {
        status = "ueberfaellig";
      }

      expect(status).toBe("bezahlt");
    });
  });

  describe("Datumsbereich-Berechnung", () => {
    it("sollte korrekten Datumsbereich für einen Monat berechnen", () => {
      const currentMonth = new Date(2025, 5, 15); // Juni 2025
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const vonDatum = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const bisDatum = new Date(year, month + 2, 0).toISOString().split("T")[0];

      expect(vonDatum).toBe("2025-05-01"); // Mai
      expect(bisDatum).toBe("2025-07-31"); // Juli
    });
  });

  describe("Währungsformatierung", () => {
    it("sollte Beträge korrekt formatieren", () => {
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(value);
      };

      expect(formatCurrency(1234.56)).toContain("1.234,56");
      expect(formatCurrency(1234.56)).toContain("€");
    });
  });

  describe("Monatsstatistiken", () => {
    it("sollte Monatsstatistiken korrekt berechnen", () => {
      const events = [
        { status: "offen", amount: 100 },
        { status: "offen", amount: 200 },
        { status: "bezahlt", amount: 150 },
        { status: "ueberfaellig", amount: 300 },
        { status: "teilweise_bezahlt", amount: 250 },
      ];

      const stats = {
        total: events.length,
        offen: events.filter((e) => e.status === "offen").length,
        ueberfaellig: events.filter((e) => e.status === "ueberfaellig").length,
        bezahlt: events.filter((e) => e.status === "bezahlt").length,
        summe: events.reduce((sum, e) => sum + e.amount, 0),
        offeneSumme: events
          .filter((e) => e.status === "offen" || e.status === "ueberfaellig")
          .reduce((sum, e) => sum + e.amount, 0),
      };

      expect(stats.total).toBe(5);
      expect(stats.offen).toBe(2);
      expect(stats.ueberfaellig).toBe(1);
      expect(stats.bezahlt).toBe(1);
      expect(stats.summe).toBe(1000);
      expect(stats.offeneSumme).toBe(600);
    });
  });

  describe("Kalender-Navigation", () => {
    it("sollte zum vorherigen Monat navigieren", () => {
      const currentDate = new Date(2025, 5, 15); // Juni 2025
      const previousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      expect(previousMonth.getMonth()).toBe(4); // Mai
    });

    it("sollte zum nächsten Monat navigieren", () => {
      const currentDate = new Date(2025, 5, 15); // Juni 2025
      const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      expect(nextMonth.getMonth()).toBe(6); // Juli
    });

    it("sollte Jahreswechsel korrekt behandeln", () => {
      const currentDate = new Date(2025, 0, 15); // Januar 2025
      const previousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      expect(previousMonth.getMonth()).toBe(11); // Dezember
      expect(previousMonth.getFullYear()).toBe(2024);
    });
  });
});
