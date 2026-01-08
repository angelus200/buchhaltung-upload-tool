import { describe, it, expect } from "vitest";

describe("Finanzamt Dokumente Sortierung", () => {
  const testDokumente = [
    { id: 1, betreff: "USt 2023", eingangsdatum: "2024-01-15", aktenzeichen: "123/456/78901", steuerjahr: 2023, betrag: "1500.00", steuerart: "USt" },
    { id: 2, betreff: "ESt 2022", eingangsdatum: "2024-03-20", aktenzeichen: "987/654/32109", steuerjahr: 2022, betrag: "3500.00", steuerart: "ESt" },
    { id: 3, betreff: "KSt 2024", eingangsdatum: "2024-02-10", aktenzeichen: "456/789/01234", steuerjahr: 2024, betrag: "2000.00", steuerart: "KSt" },
    { id: 4, betreff: "USt 2024", eingangsdatum: "2024-04-05", aktenzeichen: "111/222/33344", steuerjahr: 2024, betrag: "500.00", steuerart: "USt" },
  ];

  describe("Sortierung nach Datum", () => {
    it("sollte nach Datum absteigend sortieren (neueste zuerst)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        new Date(b.eingangsdatum).getTime() - new Date(a.eingangsdatum).getTime()
      );
      
      expect(sorted[0].id).toBe(4); // 2024-04-05
      expect(sorted[1].id).toBe(2); // 2024-03-20
      expect(sorted[2].id).toBe(3); // 2024-02-10
      expect(sorted[3].id).toBe(1); // 2024-01-15
    });

    it("sollte nach Datum aufsteigend sortieren (älteste zuerst)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        new Date(a.eingangsdatum).getTime() - new Date(b.eingangsdatum).getTime()
      );
      
      expect(sorted[0].id).toBe(1); // 2024-01-15
      expect(sorted[3].id).toBe(4); // 2024-04-05
    });
  });

  describe("Sortierung nach Aktenzeichen", () => {
    it("sollte nach Aktenzeichen aufsteigend sortieren (A-Z)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        (a.aktenzeichen || "").localeCompare(b.aktenzeichen || "")
      );
      
      expect(sorted[0].aktenzeichen).toBe("111/222/33344");
      expect(sorted[1].aktenzeichen).toBe("123/456/78901");
      expect(sorted[2].aktenzeichen).toBe("456/789/01234");
      expect(sorted[3].aktenzeichen).toBe("987/654/32109");
    });

    it("sollte nach Aktenzeichen absteigend sortieren (Z-A)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        (b.aktenzeichen || "").localeCompare(a.aktenzeichen || "")
      );
      
      expect(sorted[0].aktenzeichen).toBe("987/654/32109");
      expect(sorted[3].aktenzeichen).toBe("111/222/33344");
    });

    it("sollte leere Aktenzeichen korrekt behandeln", () => {
      const docsWithEmpty = [
        ...testDokumente,
        { id: 5, betreff: "Test", eingangsdatum: "2024-01-01", aktenzeichen: null, steuerjahr: 2024, betrag: "100.00", steuerart: "USt" },
      ];
      
      const sorted = [...docsWithEmpty].sort((a, b) => 
        (a.aktenzeichen || "").localeCompare(b.aktenzeichen || "")
      );
      
      // Leeres Aktenzeichen sollte am Anfang stehen
      expect(sorted[0].aktenzeichen).toBeNull();
    });
  });

  describe("Sortierung nach Steuerjahr", () => {
    it("sollte nach Steuerjahr absteigend sortieren (neuestes zuerst)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        (b.steuerjahr || 0) - (a.steuerjahr || 0)
      );
      
      expect(sorted[0].steuerjahr).toBe(2024);
      expect(sorted[1].steuerjahr).toBe(2024);
      expect(sorted[2].steuerjahr).toBe(2023);
      expect(sorted[3].steuerjahr).toBe(2022);
    });

    it("sollte nach Steuerjahr aufsteigend sortieren (ältestes zuerst)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        (a.steuerjahr || 0) - (b.steuerjahr || 0)
      );
      
      expect(sorted[0].steuerjahr).toBe(2022);
      expect(sorted[3].steuerjahr).toBe(2024);
    });
  });

  describe("Sortierung nach Betrag", () => {
    it("sollte nach Betrag absteigend sortieren (höchster zuerst)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        parseFloat(b.betrag || "0") - parseFloat(a.betrag || "0")
      );
      
      expect(parseFloat(sorted[0].betrag)).toBe(3500);
      expect(parseFloat(sorted[1].betrag)).toBe(2000);
      expect(parseFloat(sorted[2].betrag)).toBe(1500);
      expect(parseFloat(sorted[3].betrag)).toBe(500);
    });

    it("sollte nach Betrag aufsteigend sortieren (niedrigster zuerst)", () => {
      const sorted = [...testDokumente].sort((a, b) => 
        parseFloat(a.betrag || "0") - parseFloat(b.betrag || "0")
      );
      
      expect(parseFloat(sorted[0].betrag)).toBe(500);
      expect(parseFloat(sorted[3].betrag)).toBe(3500);
    });
  });
});

describe("Finanzamt Dokumente Gruppierung", () => {
  const testDokumente = [
    { id: 1, betreff: "USt Q1", steuerart: "USt" },
    { id: 2, betreff: "USt Q2", steuerart: "USt" },
    { id: 3, betreff: "ESt 2023", steuerart: "ESt" },
    { id: 4, betreff: "KSt 2023", steuerart: "KSt" },
    { id: 5, betreff: "USt Q3", steuerart: "USt" },
  ];

  const STEUERARTEN = [
    { value: "USt", label: "Umsatzsteuer" },
    { value: "ESt", label: "Einkommensteuer" },
    { value: "KSt", label: "Körperschaftsteuer" },
    { value: "GewSt", label: "Gewerbesteuer" },
  ];

  describe("Gruppierung nach Steuerart", () => {
    it("sollte Dokumente nach Steuerart gruppieren", () => {
      const gruppiert = STEUERARTEN.map(s => ({
        steuerart: s.value,
        label: s.label,
        dokumente: testDokumente.filter(d => d.steuerart === s.value)
      })).filter(g => g.dokumente.length > 0);

      expect(gruppiert.length).toBe(3); // USt, ESt, KSt
      
      const ustGruppe = gruppiert.find(g => g.steuerart === "USt");
      expect(ustGruppe?.dokumente.length).toBe(3);
      
      const estGruppe = gruppiert.find(g => g.steuerart === "ESt");
      expect(estGruppe?.dokumente.length).toBe(1);
      
      const kstGruppe = gruppiert.find(g => g.steuerart === "KSt");
      expect(kstGruppe?.dokumente.length).toBe(1);
    });

    it("sollte leere Gruppen ausfiltern", () => {
      const gruppiert = STEUERARTEN.map(s => ({
        steuerart: s.value,
        label: s.label,
        dokumente: testDokumente.filter(d => d.steuerart === s.value)
      })).filter(g => g.dokumente.length > 0);

      // GewSt hat keine Dokumente, sollte nicht in der Liste sein
      const gewstGruppe = gruppiert.find(g => g.steuerart === "GewSt");
      expect(gewstGruppe).toBeUndefined();
    });

    it("sollte korrekte Labels für Gruppen haben", () => {
      const gruppiert = STEUERARTEN.map(s => ({
        steuerart: s.value,
        label: s.label,
        dokumente: testDokumente.filter(d => d.steuerart === s.value)
      })).filter(g => g.dokumente.length > 0);

      const ustGruppe = gruppiert.find(g => g.steuerart === "USt");
      expect(ustGruppe?.label).toBe("Umsatzsteuer");
    });
  });
});

describe("Sortier-Optionen", () => {
  const sortierOptionen = [
    { value: "datum_desc", label: "Datum (neueste zuerst)" },
    { value: "datum_asc", label: "Datum (älteste zuerst)" },
    { value: "aktenzeichen_asc", label: "Aktenzeichen (A-Z)" },
    { value: "aktenzeichen_desc", label: "Aktenzeichen (Z-A)" },
    { value: "steuerjahr_desc", label: "Steuerjahr (neuestes)" },
    { value: "steuerjahr_asc", label: "Steuerjahr (ältestes)" },
    { value: "betrag_desc", label: "Betrag (höchster)" },
    { value: "betrag_asc", label: "Betrag (niedrigster)" },
  ];

  it("sollte alle Sortier-Optionen haben", () => {
    expect(sortierOptionen.length).toBe(8);
  });

  it("sollte gültige Werte für alle Optionen haben", () => {
    sortierOptionen.forEach(option => {
      expect(option.value).toBeDefined();
      expect(option.label).toBeDefined();
      expect(option.value.length).toBeGreaterThan(0);
      expect(option.label.length).toBeGreaterThan(0);
    });
  });

  it("sollte Standard-Sortierung datum_desc haben", () => {
    const defaultSort = "datum_desc";
    expect(sortierOptionen.find(o => o.value === defaultSort)).toBeDefined();
  });
});
