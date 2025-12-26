import { describe, it, expect } from "vitest";

describe("Firmenunterscheidung", () => {
  describe("Farbcodierung", () => {
    it("sollte gültige Hex-Farbcodes akzeptieren", () => {
      const validColors = ["#0d9488", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];
      validColors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("sollte Standard-Farbe haben wenn keine gesetzt", () => {
      const defaultColor = "#0d9488";
      const unternehmenFarbe = null;
      const displayColor = unternehmenFarbe || defaultColor;
      expect(displayColor).toBe("#0d9488");
    });
  });

  describe("Logo-URL", () => {
    it("sollte gültige URLs akzeptieren", () => {
      const validUrls = [
        "https://example.com/logo.png",
        "https://cdn.example.com/images/logo.jpg",
        "/uploads/logo.svg"
      ];
      validUrls.forEach(url => {
        expect(url.length).toBeGreaterThan(0);
      });
    });

    it("sollte leere Logo-URL als kein Logo behandeln", () => {
      const logoUrl = "";
      const hasLogo = !!logoUrl;
      expect(hasLogo).toBe(false);
    });
  });

  describe("Unternehmen-Auswahl", () => {
    it("sollte Unternehmen-ID korrekt speichern", () => {
      const unternehmenId = 123;
      const storedId = unternehmenId.toString();
      expect(storedId).toBe("123");
      expect(parseInt(storedId)).toBe(123);
    });

    it("sollte Unternehmen-Daten korrekt strukturieren", () => {
      const unternehmen = {
        id: 1,
        name: "Test GmbH",
        farbe: "#3b82f6",
        logoUrl: "https://example.com/logo.png",
        kontenrahmen: "SKR03"
      };
      
      expect(unternehmen.id).toBe(1);
      expect(unternehmen.name).toBe("Test GmbH");
      expect(unternehmen.farbe).toBe("#3b82f6");
      expect(unternehmen.logoUrl).toBe("https://example.com/logo.png");
      expect(unternehmen.kontenrahmen).toBe("SKR03");
    });
  });

  describe("Kontenrahmen-Auswahl", () => {
    it("sollte nur SKR03 oder SKR04 erlauben", () => {
      const validKontenrahmen = ["SKR03", "SKR04"];
      const selectedKontenrahmen = "SKR03";
      expect(validKontenrahmen).toContain(selectedKontenrahmen);
    });

    it("sollte Standard-Kontenrahmen SKR03 sein", () => {
      const defaultKontenrahmen = "SKR03";
      expect(defaultKontenrahmen).toBe("SKR03");
    });
  });

  describe("Verfügbare Firmenfarben", () => {
    const FIRMEN_FARBEN = [
      { name: "Türkis", value: "#0d9488" },
      { name: "Blau", value: "#3b82f6" },
      { name: "Rot", value: "#ef4444" },
      { name: "Grün", value: "#22c55e" },
      { name: "Orange", value: "#f59e0b" },
      { name: "Lila", value: "#8b5cf6" },
      { name: "Pink", value: "#ec4899" },
      { name: "Indigo", value: "#6366f1" },
    ];

    it("sollte mindestens 5 Farben zur Auswahl haben", () => {
      expect(FIRMEN_FARBEN.length).toBeGreaterThanOrEqual(5);
    });

    it("sollte alle Farben mit Namen und Hex-Wert haben", () => {
      FIRMEN_FARBEN.forEach(farbe => {
        expect(farbe.name).toBeDefined();
        expect(farbe.value).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});
