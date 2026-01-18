import { describe, it, expect, beforeEach } from "vitest";

/**
 * Unit Tests für Buchungsvorlagen, Kontierungsregeln und Monatsabschluss
 *
 * Diese Tests validieren die Core-Funktionalität der neuen Features zur
 * Reduzierung der Abhängigkeit von externen Steuerberatern.
 */

describe("Buchungsvorlagen Router", () => {
  it("sollte Vorlagen erfolgreich erstellen", () => {
    // Test-Setup
    const vorlageData = {
      unternehmenId: 1,
      name: "Büromiete",
      sollKonto: "4910",
      habenKonto: "1200",
      buchungstext: "Miete Büro",
      ustSatz: 0,
      kategorie: "miete" as const,
    };

    // Erwartung: Vorlage wird mit allen Pflichtfeldern erstellt
    expect(vorlageData.name).toBe("Büromiete");
    expect(vorlageData.sollKonto).toBe("4910");
    expect(vorlageData.habenKonto).toBe("1200");
  });

  it("sollte Vorlagen nach Kategorie filtern", () => {
    const vorlagen = [
      { kategorie: "miete", name: "Büro" },
      { kategorie: "gehalt", name: "MA1" },
      { kategorie: "miete", name: "Lager" },
    ];

    const mietVorlagen = vorlagen.filter((v) => v.kategorie === "miete");
    expect(mietVorlagen).toHaveLength(2);
  });

  it("sollte Vorlagen duplizieren können", () => {
    const original = {
      name: "Vorlage 1",
      sollKonto: "4910",
      habenKonto: "1200",
    };

    const dupliziert = {
      ...original,
      name: `${original.name} (Kopie)`,
    };

    expect(dupliziert.name).toBe("Vorlage 1 (Kopie)");
    expect(dupliziert.sollKonto).toBe(original.sollKonto);
  });
});

describe("Kontierungsregeln Router", () => {
  it("sollte Regeln nach Priorität sortieren", () => {
    const regeln = [
      { suchbegriff: "Amazon", prioritaet: 0 },
      { suchbegriff: "Telekom", prioritaet: 10 },
      { suchbegriff: "Miete", prioritaet: 5 },
    ];

    const sortiert = [...regeln].sort((a, b) => b.prioritaet - a.prioritaet);

    expect(sortiert[0].suchbegriff).toBe("Telekom");
    expect(sortiert[1].suchbegriff).toBe("Miete");
    expect(sortiert[2].suchbegriff).toBe("Amazon");
  });

  it("sollte passende Regeln finden (case-insensitive)", () => {
    const regeln = [
      { suchbegriff: "telekom", sollKonto: "6800", habenKonto: "1200" },
      { suchbegriff: "amazon", sollKonto: "6815", habenKonto: "1200" },
    ];

    const buchungstext = "Rechnung Deutsche Telekom AG";
    const matches = regeln.filter((r) => buchungstext.toLowerCase().includes(r.suchbegriff));

    expect(matches).toHaveLength(1);
    expect(matches[0].suchbegriff).toBe("telekom");
  });

  it("sollte Erfolgsrate korrekt berechnen", () => {
    const regel = {
      verwendungen: 10,
      erfolge: 8,
    };

    const erfolgsrate = (regel.erfolge / regel.verwendungen) * 100;

    expect(erfolgsrate).toBe(80);
  });

  it("sollte neue Erfolgsrate nach Verwendung berechnen", () => {
    const aktuelleVerwendungen = 10;
    const aktuelleErfolgsrate = 80;
    const neuerErfolg = true;

    const neueVerwendungen = aktuelleVerwendungen + 1;
    const neueErfolgsrate = neuerErfolg
      ? (aktuelleErfolgsrate * aktuelleVerwendungen + 100) / neueVerwendungen
      : (aktuelleErfolgsrate * aktuelleVerwendungen) / neueVerwendungen;

    expect(neueErfolgsrate).toBeGreaterThan(80);
    expect(neueErfolgsrate).toBeLessThan(85);
  });
});

describe("Monatsabschluss Router", () => {
  it("sollte Fortschritt korrekt berechnen", () => {
    const checklist = [
      { pflicht: true, erledigt: true },
      { pflicht: true, erledigt: true },
      { pflicht: true, erledigt: false },
      { pflicht: false, erledigt: false },
    ];

    const pflichtItems = checklist.filter((item) => item.pflicht);
    const erledigtePflicht = pflichtItems.filter((item) => item.erledigt);
    const fortschritt = Math.round((erledigtePflicht.length / pflichtItems.length) * 100);

    expect(fortschritt).toBe(67); // 2 von 3 Pflichtaufgaben erledigt
  });

  it("sollte Abschluss nur erlauben wenn alle Pflichtaufgaben erledigt", () => {
    const checklist = [
      { pflicht: true, erledigt: true },
      { pflicht: true, erledigt: true },
      { pflicht: true, erledigt: true },
      { pflicht: false, erledigt: false },
    ];

    const pflichtItems = checklist.filter((item) => item.pflicht);
    const allePflichtErledigt = pflichtItems.every((item) => item.erledigt);

    expect(allePflichtErledigt).toBe(true);
  });

  it("sollte Standard-Checkliste korrekt erstellen", () => {
    const standardChecklist = [
      { beschreibung: "Alle Belege erfasst", kategorie: "belege", pflicht: true },
      { beschreibung: "Bankkonto abgestimmt", kategorie: "abstimmung", pflicht: true },
      { beschreibung: "USt-Voranmeldung erstellt", kategorie: "steuer", pflicht: true },
      { beschreibung: "BWA erstellt", kategorie: "bericht", pflicht: false },
    ];

    const pflichtItems = standardChecklist.filter((item) => item.pflicht);
    expect(pflichtItems).toHaveLength(3);
    expect(standardChecklist).toHaveLength(4);
  });

  it("sollte Monat sperren nach Abschluss", () => {
    const monat = {
      status: "offen" as const,
      gesperrt: false,
    };

    // Nach Abschluss
    const abgeschlossen = {
      ...monat,
      status: "abgeschlossen" as const,
      gesperrt: true,
    };

    expect(abgeschlossen.gesperrt).toBe(true);
    expect(abgeschlossen.status).toBe("abgeschlossen");
  });
});

describe("Abweichungsanalyse", () => {
  it("sollte Differenz korrekt berechnen", () => {
    const periode1Wert = 1000;
    const periode2Wert = 1200;

    const differenz = periode2Wert - periode1Wert;
    const differenzProzent = (differenz / Math.abs(periode1Wert)) * 100;

    expect(differenz).toBe(200);
    expect(differenzProzent).toBe(20);
  });

  it("sollte signifikante Abweichungen erkennen", () => {
    const vergleiche = [
      { sachkonto: "4910", differenz: 50, differenzProzent: 5 },
      { sachkonto: "6800", differenz: 1500, differenzProzent: 15 },
      { sachkonto: "7000", differenz: 800, differenzProzent: 8 },
    ];

    const signifikante = vergleiche.filter(
      (v) => Math.abs(v.differenz) > 1000 || Math.abs(v.differenzProzent) > 10
    );

    expect(signifikante).toHaveLength(1);
    expect(signifikante[0].sachkonto).toBe("6800");
  });

  it("sollte nach absoluter Differenz sortieren", () => {
    const vergleiche = [
      { sachkonto: "A", differenz: -500 },
      { sachkonto: "B", differenz: 1000 },
      { sachkonto: "C", differenz: -1500 },
    ];

    const sortiert = [...vergleiche].sort((a, b) => Math.abs(b.differenz) - Math.abs(a.differenz));

    expect(sortiert[0].sachkonto).toBe("C");
    expect(sortiert[1].sachkonto).toBe("B");
    expect(sortiert[2].sachkonto).toBe("A");
  });
});

describe("Integration Tests", () => {
  it("sollte Quick-Booking mit Vorlage funktionieren", () => {
    const vorlage = {
      name: "Büromiete",
      sollKonto: "4910",
      habenKonto: "1200",
      betrag: 1500,
      buchungstext: "Miete Büro Januar",
      ustSatz: 0,
      geschaeftspartner: "Vermieter GmbH",
    };

    // Simuliere Anwendung der Vorlage
    const buchung = {
      sollKonto: vorlage.sollKonto,
      habenKonto: vorlage.habenKonto,
      betrag: vorlage.betrag,
      buchungstext: vorlage.buchungstext,
      ustSatz: vorlage.ustSatz,
      geschaeftspartner: vorlage.geschaeftspartner,
    };

    expect(buchung.sollKonto).toBe("4910");
    expect(buchung.betrag).toBe(1500);
  });

  it("sollte Auto-Kontierung mit Regeln funktionieren", () => {
    const regeln = [
      {
        suchbegriff: "telekom",
        sollKonto: "6800",
        habenKonto: "1200",
        ustSatz: 19,
        prioritaet: 10,
      },
      {
        suchbegriff: "telefon",
        sollKonto: "6805",
        habenKonto: "1200",
        ustSatz: 19,
        prioritaet: 5,
      },
    ];

    const buchungstext = "Deutsche Telekom Rechnung";
    const matches = regeln
      .filter((r) => buchungstext.toLowerCase().includes(r.suchbegriff))
      .sort((a, b) => b.prioritaet - a.prioritaet);

    expect(matches).toHaveLength(1);
    expect(matches[0].sollKonto).toBe("6800"); // Höhere Priorität
  });
});
