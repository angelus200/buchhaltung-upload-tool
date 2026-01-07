// Unterstützte Länder
export const LAENDER = ["DE", "AT", "CH", "UK", "CY"] as const;
export type Land = typeof LAENDER[number];

// Währungen
export const WAEHRUNGEN = ["EUR", "CHF", "GBP"] as const;
export type Waehrung = typeof WAEHRUNGEN[number];

// Länder-Konfiguration
export const LAENDER_CONFIG: Record<Land, {
  name: string;
  flagge: string;
  waehrung: Waehrung;
  waehrungSymbol: string;
  kontenrahmen: { value: string; label: string; beschreibung: string }[];
  defaultKontenrahmen: string;
  ustSaetze: { wert: number; label: string }[];
  steuernummerLabel: string;
  steuernummerPlaceholder: string;
  ustIdLabel: string;
  ustIdPlaceholder: string;
  handelsregisterLabel: string;
  rechtsformen: string[];
}> = {
  DE: {
    name: "Deutschland",
    flagge: "🇩🇪",
    waehrung: "EUR",
    waehrungSymbol: "€",
    kontenrahmen: [
      { value: "SKR03", label: "SKR 03", beschreibung: "Prozessgliederung" },
      { value: "SKR04", label: "SKR 04", beschreibung: "Abschlussgliederung" },
    ],
    defaultKontenrahmen: "SKR03",
    ustSaetze: [
      { wert: 0, label: "0% (steuerfrei)" },
      { wert: 7, label: "7% (ermäßigt)" },
      { wert: 19, label: "19% (Regelsteuersatz)" },
    ],
    steuernummerLabel: "Steuernummer",
    steuernummerPlaceholder: "123/456/78901",
    ustIdLabel: "USt-IdNr.",
    ustIdPlaceholder: "DE123456789",
    handelsregisterLabel: "Handelsregister",
    rechtsformen: ["GmbH", "UG (haftungsbeschränkt)", "AG", "KG", "OHG", "GbR", "Einzelunternehmen", "e.K.", "GmbH & Co. KG"],
  },
  AT: {
    name: "Österreich",
    flagge: "🇦🇹",
    waehrung: "EUR",
    waehrungSymbol: "€",
    kontenrahmen: [
      { value: "OeKR", label: "ÖKR", beschreibung: "Österreichischer Kontenrahmen" },
      { value: "RLG", label: "RLG", beschreibung: "Rechnungslegungsgesetz" },
    ],
    defaultKontenrahmen: "OeKR",
    ustSaetze: [
      { wert: 0, label: "0% (steuerfrei)" },
      { wert: 10, label: "10% (ermäßigt)" },
      { wert: 13, label: "13% (ermäßigt)" },
      { wert: 20, label: "20% (Regelsteuersatz)" },
    ],
    steuernummerLabel: "Steuernummer",
    steuernummerPlaceholder: "12-345/6789",
    ustIdLabel: "UID-Nummer",
    ustIdPlaceholder: "ATU12345678",
    handelsregisterLabel: "Firmenbuch",
    rechtsformen: ["GmbH", "AG", "KG", "OG", "GesbR", "Einzelunternehmen", "e.U.", "GmbH & Co KG"],
  },
  CH: {
    name: "Schweiz",
    flagge: "🇨🇭",
    waehrung: "CHF",
    waehrungSymbol: "CHF",
    kontenrahmen: [
      { value: "KMU", label: "KMU", beschreibung: "Kontenrahmen für KMU" },
      { value: "OR", label: "OR", beschreibung: "Obligationenrecht" },
    ],
    defaultKontenrahmen: "KMU",
    ustSaetze: [
      { wert: 0, label: "0% (steuerfrei)" },
      { wert: 2.6, label: "2.6% (Sondersatz)" },
      { wert: 3.8, label: "3.8% (Beherbergung)" },
      { wert: 8.1, label: "8.1% (Normalsatz)" },
    ],
    steuernummerLabel: "Unternehmens-ID",
    steuernummerPlaceholder: "CHE-123.456.789",
    ustIdLabel: "MWST-Nummer",
    ustIdPlaceholder: "CHE-123.456.789 MWST",
    handelsregisterLabel: "Handelsregister",
    rechtsformen: ["AG", "GmbH", "Kollektivgesellschaft", "Kommanditgesellschaft", "Einzelunternehmen", "Genossenschaft"],
  },
  UK: {
    name: "United Kingdom",
    flagge: "🇬🇧",
    waehrung: "GBP",
    waehrungSymbol: "£",
    kontenrahmen: [
      { value: "UK_GAAP", label: "UK GAAP", beschreibung: "UK Generally Accepted Accounting Principles" },
      { value: "IFRS", label: "IFRS", beschreibung: "International Financial Reporting Standards" },
    ],
    defaultKontenrahmen: "UK_GAAP",
    ustSaetze: [
      { wert: 0, label: "0% (Zero-rated)" },
      { wert: 5, label: "5% (Reduced rate)" },
      { wert: 20, label: "20% (Standard rate)" },
    ],
    steuernummerLabel: "UTR (Unique Taxpayer Reference)",
    steuernummerPlaceholder: "1234567890",
    ustIdLabel: "VAT Number",
    ustIdPlaceholder: "GB123456789",
    handelsregisterLabel: "Companies House Number",
    rechtsformen: ["Ltd", "PLC", "LLP", "Partnership", "Sole Trader", "CIC"],
  },
  CY: {
    name: "Zypern",
    flagge: "🇨🇾",
    waehrung: "EUR",
    waehrungSymbol: "€",
    kontenrahmen: [
      { value: "CY_GAAP", label: "CY GAAP", beschreibung: "Cyprus Generally Accepted Accounting Principles" },
      { value: "IFRS", label: "IFRS", beschreibung: "International Financial Reporting Standards" },
    ],
    defaultKontenrahmen: "CY_GAAP",
    ustSaetze: [
      { wert: 0, label: "0% (Zero-rated)" },
      { wert: 5, label: "5% (Reduced rate)" },
      { wert: 9, label: "9% (Reduced rate)" },
      { wert: 19, label: "19% (Standard rate)" },
    ],
    steuernummerLabel: "TIC (Tax Identification Code)",
    steuernummerPlaceholder: "12345678X",
    ustIdLabel: "VAT Number",
    ustIdPlaceholder: "CY12345678X",
    handelsregisterLabel: "Company Registration Number",
    rechtsformen: ["Ltd", "PLC", "Partnership", "Sole Proprietorship", "Branch"],
  },
};

// Hilfsfunktionen
export function getLandConfig(landCode: Land) {
  return LAENDER_CONFIG[landCode];
}

export function getWaehrungSymbol(waehrung: Waehrung): string {
  switch (waehrung) {
    case "EUR": return "€";
    case "CHF": return "CHF";
    case "GBP": return "£";
    default: return waehrung;
  }
}

export function formatBetrag(betrag: number, waehrung: Waehrung): string {
  const symbol = getWaehrungSymbol(waehrung);
  const formatted = betrag.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (waehrung === "GBP") {
    return `${symbol}${formatted}`;
  }
  return `${formatted} ${symbol}`;
}
