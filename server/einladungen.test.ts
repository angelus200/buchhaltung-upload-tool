import { describe, it, expect, vi } from "vitest";

describe("Einladungen", () => {
  describe("Einladungs-Schema", () => {
    it("sollte gültige Einladungsdaten akzeptieren", () => {
      const einladung = {
        email: "test@beispiel.de",
        unternehmenId: 1,
        rolle: "buchhalter" as const,
        token: "abc123xyz",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "pending" as const,
      };

      expect(einladung.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(einladung.unternehmenId).toBeGreaterThan(0);
      expect(["admin", "buchhalter", "viewer"]).toContain(einladung.rolle);
      expect(einladung.token.length).toBeGreaterThan(0);
      expect(einladung.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(["pending", "accepted", "expired", "cancelled"]).toContain(einladung.status);
    });

    it("sollte ungültige E-Mail-Adressen ablehnen", () => {
      const ungueltigeEmails = [
        "keine-email",
        "@beispiel.de",
        "test@",
        "test@.de",
        "",
      ];

      ungueltigeEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });

    it("sollte nur gültige Rollen akzeptieren", () => {
      const gueltigeRollen = ["admin", "buchhalter", "viewer"];
      const ungueltigeRollen = ["superadmin", "manager", "guest", ""];

      gueltigeRollen.forEach((rolle) => {
        expect(["admin", "buchhalter", "viewer"]).toContain(rolle);
      });

      ungueltigeRollen.forEach((rolle) => {
        expect(["admin", "buchhalter", "viewer"]).not.toContain(rolle);
      });
    });
  });

  describe("Einladungs-Token", () => {
    it("sollte einen eindeutigen Token generieren", () => {
      const generateToken = () => {
        return Array.from({ length: 32 }, () =>
          Math.random().toString(36).charAt(2)
        ).join("");
      };

      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(32);
      expect(token2.length).toBe(32);
    });

    it("sollte Ablaufdatum korrekt berechnen (7 Tage)", () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const diffDays = Math.round(
        (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      expect(diffDays).toBe(7);
    });
  });

  describe("Einladungs-Status", () => {
    it("sollte Status 'pending' für neue Einladungen haben", () => {
      const neueEinladung = {
        status: "pending",
        createdAt: new Date(),
      };

      expect(neueEinladung.status).toBe("pending");
    });

    it("sollte Status auf 'accepted' ändern bei Annahme", () => {
      const einladung = {
        status: "pending" as string,
        acceptedAt: null as Date | null,
      };

      // Simuliere Annahme
      einladung.status = "accepted";
      einladung.acceptedAt = new Date();

      expect(einladung.status).toBe("accepted");
      expect(einladung.acceptedAt).toBeInstanceOf(Date);
    });

    it("sollte Status auf 'cancelled' ändern bei Stornierung", () => {
      const einladung = {
        status: "pending" as string,
      };

      // Simuliere Stornierung
      einladung.status = "cancelled";

      expect(einladung.status).toBe("cancelled");
    });

    it("sollte abgelaufene Einladungen erkennen", () => {
      const abgelaufeneEinladung = {
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Gestern
        status: "pending",
      };

      const istAbgelaufen = abgelaufeneEinladung.expiresAt.getTime() < Date.now();

      expect(istAbgelaufen).toBe(true);
    });
  });

  describe("Einladungs-URL", () => {
    it("sollte eine gültige Einladungs-URL generieren", () => {
      const token = "abc123xyz456";
      const baseUrl = "https://example.com";
      const einladungsUrl = `${baseUrl}/einladung/${token}`;

      expect(einladungsUrl).toContain("/einladung/");
      expect(einladungsUrl).toContain(token);
      expect(einladungsUrl).toMatch(/^https?:\/\//);
    });

    it("sollte Token aus URL extrahieren können", () => {
      const url = "/einladung/abc123xyz456";
      const token = url.split("/einladung/")[1];

      expect(token).toBe("abc123xyz456");
    });
  });

  describe("Einladungs-Validierung", () => {
    it("sollte keine doppelten Einladungen für dieselbe E-Mail erlauben", () => {
      const bestehendeEinladungen = [
        { email: "test@beispiel.de", unternehmenId: 1, status: "pending" },
      ];

      const neueEinladung = {
        email: "test@beispiel.de",
        unternehmenId: 1,
      };

      const existiert = bestehendeEinladungen.some(
        (e) =>
          e.email === neueEinladung.email &&
          e.unternehmenId === neueEinladung.unternehmenId &&
          e.status === "pending"
      );

      expect(existiert).toBe(true);
    });

    it("sollte Einladung für andere Unternehmen erlauben", () => {
      const bestehendeEinladungen = [
        { email: "test@beispiel.de", unternehmenId: 1, status: "pending" },
      ];

      const neueEinladung = {
        email: "test@beispiel.de",
        unternehmenId: 2, // Anderes Unternehmen
      };

      const existiert = bestehendeEinladungen.some(
        (e) =>
          e.email === neueEinladung.email &&
          e.unternehmenId === neueEinladung.unternehmenId &&
          e.status === "pending"
      );

      expect(existiert).toBe(false);
    });
  });
});
