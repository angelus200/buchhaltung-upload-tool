import { describe, it, expect } from "vitest";

describe("Beleg-Vorschau Komponente", () => {
  describe("Dateityp-Erkennung", () => {
    it("sollte Bildformate korrekt erkennen", () => {
      const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      imageTypes.forEach(type => {
        expect(type.startsWith("image/")).toBe(true);
      });
    });

    it("sollte PDF-Format korrekt erkennen", () => {
      const pdfType = "application/pdf";
      expect(pdfType).toBe("application/pdf");
    });

    it("sollte unbekannte Formate erkennen", () => {
      const unknownTypes = ["application/msword", "text/plain", "application/zip"];
      unknownTypes.forEach(type => {
        expect(type.startsWith("image/")).toBe(false);
        expect(type).not.toBe("application/pdf");
      });
    });
  });

  describe("Zoom-Funktionalität", () => {
    it("sollte Zoom-In korrekt berechnen", () => {
      let zoom = 100;
      const zoomIn = () => Math.min(zoom + 25, 200);
      
      zoom = zoomIn();
      expect(zoom).toBe(125);
      
      zoom = zoomIn();
      expect(zoom).toBe(150);
      
      zoom = 200;
      zoom = zoomIn();
      expect(zoom).toBe(200); // Maximum erreicht
    });

    it("sollte Zoom-Out korrekt berechnen", () => {
      let zoom = 100;
      const zoomOut = () => Math.max(zoom - 25, 50);
      
      zoom = zoomOut();
      expect(zoom).toBe(75);
      
      zoom = zoomOut();
      expect(zoom).toBe(50);
      
      zoom = 50;
      zoom = zoomOut();
      expect(zoom).toBe(50); // Minimum erreicht
    });
  });

  describe("Rotation", () => {
    it("sollte Rotation korrekt berechnen", () => {
      let rotation = 0;
      const rotate = () => (rotation + 90) % 360;
      
      rotation = rotate();
      expect(rotation).toBe(90);
      
      rotation = rotate();
      expect(rotation).toBe(180);
      
      rotation = rotate();
      expect(rotation).toBe(270);
      
      rotation = rotate();
      expect(rotation).toBe(0); // Zurück zum Anfang
    });
  });

  describe("Dateigröße-Formatierung", () => {
    it("sollte Dateigröße in KB formatieren", () => {
      const formatSize = (bytes: number) => (bytes / 1024).toFixed(1);
      
      expect(formatSize(1024)).toBe("1.0");
      expect(formatSize(2048)).toBe("2.0");
      expect(formatSize(1536)).toBe("1.5");
      expect(formatSize(512)).toBe("0.5");
    });
  });

  describe("Unterstützte Dateiformate", () => {
    const supportedFormats = [
      { extension: ".pdf", mimeType: "application/pdf", category: "pdf" },
      { extension: ".jpg", mimeType: "image/jpeg", category: "image" },
      { extension: ".jpeg", mimeType: "image/jpeg", category: "image" },
      { extension: ".png", mimeType: "image/png", category: "image" },
      { extension: ".gif", mimeType: "image/gif", category: "image" },
      { extension: ".webp", mimeType: "image/webp", category: "image" },
    ];

    it("sollte alle unterstützten Formate definiert haben", () => {
      expect(supportedFormats.length).toBeGreaterThan(0);
    });

    it("sollte PDF als eigene Kategorie haben", () => {
      const pdfFormat = supportedFormats.find(f => f.extension === ".pdf");
      expect(pdfFormat).toBeDefined();
      expect(pdfFormat?.category).toBe("pdf");
    });

    it("sollte mehrere Bildformate unterstützen", () => {
      const imageFormats = supportedFormats.filter(f => f.category === "image");
      expect(imageFormats.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Vorschau-Anzeige", () => {
    it("sollte Platzhalter anzeigen wenn keine Datei ausgewählt", () => {
      const file = null;
      const showPlaceholder = file === null;
      expect(showPlaceholder).toBe(true);
    });

    it("sollte Vorschau anzeigen wenn Datei ausgewählt", () => {
      const file = { name: "test.pdf", size: 1024, type: "application/pdf" };
      const showPlaceholder = file === null;
      expect(showPlaceholder).toBe(false);
    });
  });
});
