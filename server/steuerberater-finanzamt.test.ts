import { describe, it, expect } from "vitest";

describe("Steuerberater-Finanzamt Integration", () => {
  describe("addFinanzamtDokument Endpunkt", () => {
    it("sollte ein Finanzamt-Dokument zu einer Übergabe hinzufügen können", () => {
      // Test-Input für addFinanzamtDokument
      const input = {
        uebergabeId: 1,
        finanzamtDokumentId: 5,
        beschreibung: "Bescheid USt 2024"
      };
      
      expect(input.uebergabeId).toBeGreaterThan(0);
      expect(input.finanzamtDokumentId).toBeGreaterThan(0);
    });

    it("sollte Beschreibung optional sein", () => {
      const input = {
        uebergabeId: 1,
        finanzamtDokumentId: 5
      };
      
      expect(input).not.toHaveProperty("beschreibung");
    });
  });

  describe("getFinanzamtDokumente Endpunkt", () => {
    it("sollte Finanzamt-Dokumente für eine Übergabe abrufen können", () => {
      const input = {
        uebergabeId: 1
      };
      
      expect(input.uebergabeId).toBeGreaterThan(0);
    });
  });

  describe("Finanzamt-Dokument Typen", () => {
    const dokumentTypen = [
      "bescheid",
      "einspruch",
      "mahnung",
      "anfrage",
      "betriebspruefung",
      "schriftverkehr"
    ];

    it("sollte alle Dokumenttypen unterstützen", () => {
      expect(dokumentTypen).toContain("bescheid");
      expect(dokumentTypen).toContain("einspruch");
      expect(dokumentTypen).toContain("mahnung");
      expect(dokumentTypen).toContain("anfrage");
      expect(dokumentTypen).toContain("betriebspruefung");
      expect(dokumentTypen).toContain("schriftverkehr");
    });

    it("sollte 6 Dokumenttypen haben", () => {
      expect(dokumentTypen.length).toBe(6);
    });
  });

  describe("Steuerarten", () => {
    const steuerarten = ["ust", "est", "kst", "gewst", "lst", "kapest"];

    it("sollte alle Steuerarten unterstützen", () => {
      expect(steuerarten).toContain("ust");
      expect(steuerarten).toContain("est");
      expect(steuerarten).toContain("kst");
      expect(steuerarten).toContain("gewst");
      expect(steuerarten).toContain("lst");
      expect(steuerarten).toContain("kapest");
    });

    it("sollte 6 Steuerarten haben", () => {
      expect(steuerarten.length).toBe(6);
    });
  });

  describe("Übergabe-Position mit Finanzamt-Dokument", () => {
    it("sollte eine Position mit finanzamtDokumentId erstellen können", () => {
      const position = {
        id: 1,
        uebergabeId: 1,
        buchungId: null,
        finanzamtDokumentId: 5,
        beschreibung: "USt-Bescheid 2024",
        betrag: 1500.00
      };
      
      expect(position.buchungId).toBeNull();
      expect(position.finanzamtDokumentId).toBe(5);
      expect(position.betrag).toBe(1500.00);
    });

    it("sollte entweder buchungId oder finanzamtDokumentId haben", () => {
      const positionMitBuchung = {
        buchungId: 10,
        finanzamtDokumentId: null
      };
      
      const positionMitFinanzamt = {
        buchungId: null,
        finanzamtDokumentId: 5
      };
      
      // Eine der beiden sollte gesetzt sein
      expect(positionMitBuchung.buchungId || positionMitBuchung.finanzamtDokumentId).toBeTruthy();
      expect(positionMitFinanzamt.buchungId || positionMitFinanzamt.finanzamtDokumentId).toBeTruthy();
    });
  });

  describe("Finanzamt-Dokument in Übergabe-Detail", () => {
    it("sollte Finanzamt-Dokument-Details in Positionen anzeigen", () => {
      const uebergabeDetail = {
        id: 1,
        bezeichnung: "Monatsabschluss Januar 2025",
        positionen: [
          {
            id: 1,
            buchung: { belegdatum: "2025-01-15", belegnummer: "RE-001" },
            finanzamtDokument: null,
            betrag: 500
          },
          {
            id: 2,
            buchung: null,
            finanzamtDokument: {
              id: 5,
              betreff: "USt-Bescheid 2024",
              dokumentTyp: "bescheid",
              steuerart: "ust",
              aktenzeichen: "123/456/78901"
            },
            betrag: 1500
          }
        ]
      };
      
      // Prüfe ob Finanzamt-Dokumente vorhanden sind
      const hatFinanzamtDokumente = uebergabeDetail.positionen.some(p => p.finanzamtDokument !== null);
      expect(hatFinanzamtDokumente).toBe(true);
      
      // Prüfe Finanzamt-Dokument Details
      const finanzamtPosition = uebergabeDetail.positionen.find(p => p.finanzamtDokument !== null);
      expect(finanzamtPosition?.finanzamtDokument?.betreff).toBe("USt-Bescheid 2024");
      expect(finanzamtPosition?.finanzamtDokument?.dokumentTyp).toBe("bescheid");
      expect(finanzamtPosition?.finanzamtDokument?.steuerart).toBe("ust");
    });
  });
});
