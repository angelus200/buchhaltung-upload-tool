// Kontenrahmen SKR 03 und SKR 04 für deutsche Buchhaltung

export interface Konto {
  konto: string;
  bezeichnung: string;
}

export interface Kontenrahmen {
  aufwand: Konto[];
  ertrag: Konto[];
  anlage: Konto[];
  finanz: Konto[];
  eigenkapital: Konto[];
  verbindlichkeiten: Konto[];
}

// SKR 03 - Prozessgliederungsprinzip (häufiger bei KMU)
export const SKR03: Kontenrahmen = {
  aufwand: [
    { konto: "4100", bezeichnung: "Löhne" },
    { konto: "4110", bezeichnung: "Gehälter" },
    { konto: "4120", bezeichnung: "Miete" },
    { konto: "4130", bezeichnung: "Pacht" },
    { konto: "4200", bezeichnung: "Telefon" },
    { konto: "4210", bezeichnung: "Internet" },
    { konto: "4220", bezeichnung: "Porto" },
    { konto: "4240", bezeichnung: "Gas, Strom, Wasser" },
    { konto: "4250", bezeichnung: "Reinigung" },
    { konto: "4260", bezeichnung: "Instandhaltung Gebäude" },
    { konto: "4270", bezeichnung: "Instandhaltung Maschinen" },
    { konto: "4280", bezeichnung: "Instandhaltung Fahrzeuge" },
    { konto: "4360", bezeichnung: "Versicherungen" },
    { konto: "4500", bezeichnung: "Fahrzeugkosten" },
    { konto: "4510", bezeichnung: "Kfz-Steuer" },
    { konto: "4520", bezeichnung: "Kfz-Versicherung" },
    { konto: "4530", bezeichnung: "Benzin/Diesel" },
    { konto: "4540", bezeichnung: "Kfz-Reparaturen" },
    { konto: "4600", bezeichnung: "Werbekosten" },
    { konto: "4610", bezeichnung: "Messekosten" },
    { konto: "4650", bezeichnung: "Bewirtungskosten" },
    { konto: "4660", bezeichnung: "Reisekosten Unternehmer" },
    { konto: "4670", bezeichnung: "Reisekosten Arbeitnehmer" },
    { konto: "4700", bezeichnung: "Kosten Warenabgabe" },
    { konto: "4800", bezeichnung: "Reparaturen/Instandhaltung" },
    { konto: "4830", bezeichnung: "Abschreibungen Sachanlagen" },
    { konto: "4840", bezeichnung: "Abschreibungen immat. VG" },
    { konto: "4855", bezeichnung: "Sofortabschreibung GWG" },
    { konto: "4900", bezeichnung: "Sonstige Aufwendungen" },
    { konto: "4910", bezeichnung: "Nebenkosten Geldverkehr" },
    { konto: "4920", bezeichnung: "Rechtsberatung" },
    { konto: "4930", bezeichnung: "Bürobedarf" },
    { konto: "4940", bezeichnung: "Zeitschriften, Bücher" },
    { konto: "4945", bezeichnung: "Fortbildungskosten" },
    { konto: "4950", bezeichnung: "Steuerberatungskosten" },
    { konto: "4955", bezeichnung: "Buchführungskosten" },
    { konto: "4960", bezeichnung: "Miete für Einrichtungen" },
    { konto: "4970", bezeichnung: "Leasing" },
    { konto: "4980", bezeichnung: "Beiträge" },
  ],
  ertrag: [
    { konto: "8100", bezeichnung: "Steuerfreie Umsätze Inland" },
    { konto: "8120", bezeichnung: "Steuerfreie Umsätze EU" },
    { konto: "8125", bezeichnung: "Steuerfreie Umsätze Drittland" },
    { konto: "8200", bezeichnung: "Erlöse Leistungen EU" },
    { konto: "8300", bezeichnung: "Erlöse 7% USt" },
    { konto: "8400", bezeichnung: "Erlöse 19% USt" },
    { konto: "8500", bezeichnung: "Provisionserlöse" },
    { konto: "8600", bezeichnung: "Erlöse Vermietung" },
    { konto: "8700", bezeichnung: "Erlösschmälerungen" },
    { konto: "8800", bezeichnung: "Erlöse aus Anlagenverkauf" },
    { konto: "8900", bezeichnung: "Sonstige Erträge" },
    { konto: "8910", bezeichnung: "Erträge Auflösung Rückstellung" },
    { konto: "2650", bezeichnung: "Zinserträge" },
    { konto: "2700", bezeichnung: "Erträge aus Beteiligungen" },
    { konto: "2710", bezeichnung: "Dividenden" },
  ],
  anlage: [
    { konto: "0010", bezeichnung: "Aufwendungen Gründung" },
    { konto: "0027", bezeichnung: "EDV-Software" },
    { konto: "0100", bezeichnung: "Konzessionen" },
    { konto: "0110", bezeichnung: "Gewerbliche Schutzrechte" },
    { konto: "0135", bezeichnung: "Geschäftswert" },
    { konto: "0200", bezeichnung: "Grundstücke" },
    { konto: "0210", bezeichnung: "Gebäude" },
    { konto: "0240", bezeichnung: "Einbauten fremde Gebäude" },
    { konto: "0300", bezeichnung: "Technische Anlagen" },
    { konto: "0400", bezeichnung: "Maschinen" },
    { konto: "0420", bezeichnung: "Fahrzeuge" },
    { konto: "0440", bezeichnung: "LKW" },
    { konto: "0480", bezeichnung: "Betriebs-/Geschäftsausstattung" },
    { konto: "0490", bezeichnung: "Geringwertige Wirtschaftsgüter" },
    { konto: "0500", bezeichnung: "Anlagen im Bau" },
    { konto: "0510", bezeichnung: "Anzahlungen Anlagen" },
    { konto: "0600", bezeichnung: "Beteiligungen verbundene" },
    { konto: "0630", bezeichnung: "Beteiligungen" },
    { konto: "0650", bezeichnung: "Wertpapiere Anlagevermögen" },
    { konto: "0700", bezeichnung: "Sonstige Ausleihungen" },
  ],
  finanz: [
    { konto: "1000", bezeichnung: "Kasse" },
    { konto: "1200", bezeichnung: "Bank" },
    { konto: "1210", bezeichnung: "Sparkonto" },
    { konto: "1220", bezeichnung: "Festgeld" },
    { konto: "1300", bezeichnung: "Wechsel" },
    { konto: "1400", bezeichnung: "Forderungen aus L+L" },
    { konto: "1410", bezeichnung: "Forderungen verbundene" },
    { konto: "1450", bezeichnung: "Forderungen Gesellschafter" },
    { konto: "1500", bezeichnung: "Sonstige Vermögensgegenstände" },
    { konto: "1510", bezeichnung: "Geleistete Anzahlungen" },
    { konto: "1520", bezeichnung: "Vorsteuer" },
    { konto: "1530", bezeichnung: "Vorsteuer 7%" },
    { konto: "1540", bezeichnung: "Vorsteuer 19%" },
    { konto: "1545", bezeichnung: "Vorsteuer EU" },
    { konto: "1570", bezeichnung: "Abziehbare Vorsteuer" },
    { konto: "1580", bezeichnung: "Vorsteuer Folgejahr" },
    { konto: "1590", bezeichnung: "Durchlaufende Posten" },
  ],
  eigenkapital: [
    { konto: "0800", bezeichnung: "Gezeichnetes Kapital" },
    { konto: "0810", bezeichnung: "Nicht eingef. Kapital" },
    { konto: "0840", bezeichnung: "Kapitalrücklage" },
    { konto: "0860", bezeichnung: "Gewinnrücklagen" },
    { konto: "0868", bezeichnung: "Satzungsmäßige Rücklagen" },
    { konto: "0880", bezeichnung: "Gewinnvortrag" },
    { konto: "0890", bezeichnung: "Verlustvortrag" },
    { konto: "0899", bezeichnung: "Jahresüberschuss/-fehlbetrag" },
    { konto: "2000", bezeichnung: "Privatentnahmen allgemein" },
    { konto: "2100", bezeichnung: "Privateinlagen" },
    { konto: "2150", bezeichnung: "Privatsteuern" },
    { konto: "2200", bezeichnung: "Privatentnahmen Waren" },
  ],
  verbindlichkeiten: [
    { konto: "1600", bezeichnung: "Verbindlichkeiten aus L+L" },
    { konto: "1610", bezeichnung: "Verbindlichkeiten verbundene" },
    { konto: "1700", bezeichnung: "Erhaltene Anzahlungen" },
    { konto: "1710", bezeichnung: "Erhaltene Anzahlungen 7%" },
    { konto: "1718", bezeichnung: "Erhaltene Anzahlungen 19%" },
    { konto: "1740", bezeichnung: "Verbindlichkeiten Gesellschafter" },
    { konto: "1750", bezeichnung: "Verbindlichkeiten Finanzamt" },
    { konto: "1755", bezeichnung: "Umsatzsteuer" },
    { konto: "1760", bezeichnung: "Umsatzsteuer 7%" },
    { konto: "1770", bezeichnung: "Umsatzsteuer 19%" },
    { konto: "1780", bezeichnung: "Umsatzsteuervorauszahlung" },
    { konto: "1790", bezeichnung: "Umsatzsteuer Vorjahr" },
    { konto: "1800", bezeichnung: "Sonstige Verbindlichkeiten" },
    { konto: "1810", bezeichnung: "Verbindlichkeiten Löhne" },
    { konto: "1820", bezeichnung: "Verbindlichkeiten SV" },
    { konto: "1840", bezeichnung: "Verbindlichkeiten Lohnsteuer" },
  ],
};

// SKR 04 - Abschlussgliederungsprinzip (häufiger bei größeren Unternehmen)
export const SKR04: Kontenrahmen = {
  aufwand: [
    { konto: "6000", bezeichnung: "Aufwendungen Roh-/Hilfs-/Betriebsstoffe" },
    { konto: "6010", bezeichnung: "Einkauf Roh-/Hilfs-/Betriebsstoffe" },
    { konto: "6020", bezeichnung: "Einkauf Waren" },
    { konto: "6100", bezeichnung: "Löhne" },
    { konto: "6110", bezeichnung: "Gehälter" },
    { konto: "6120", bezeichnung: "Geschäftsführergehälter" },
    { konto: "6130", bezeichnung: "Gesetzliche Sozialaufwendungen" },
    { konto: "6200", bezeichnung: "Abschreibungen Sachanlagen" },
    { konto: "6210", bezeichnung: "Abschreibungen immat. VG" },
    { konto: "6220", bezeichnung: "Abschreibungen Finanzanlagen" },
    { konto: "6230", bezeichnung: "Abschreibungen Umlaufvermögen" },
    { konto: "6260", bezeichnung: "Sofortabschreibung GWG" },
    { konto: "6300", bezeichnung: "Sonstige betriebliche Aufwendungen" },
    { konto: "6310", bezeichnung: "Miete" },
    { konto: "6315", bezeichnung: "Pacht" },
    { konto: "6320", bezeichnung: "Heizung" },
    { konto: "6325", bezeichnung: "Gas, Strom, Wasser" },
    { konto: "6330", bezeichnung: "Reinigung" },
    { konto: "6335", bezeichnung: "Instandhaltung Gebäude" },
    { konto: "6340", bezeichnung: "Instandhaltung Maschinen" },
    { konto: "6345", bezeichnung: "Instandhaltung Fahrzeuge" },
    { konto: "6400", bezeichnung: "Versicherungen" },
    { konto: "6420", bezeichnung: "Beiträge" },
    { konto: "6500", bezeichnung: "Fahrzeugkosten" },
    { konto: "6520", bezeichnung: "Kfz-Steuer" },
    { konto: "6530", bezeichnung: "Kfz-Versicherung" },
    { konto: "6540", bezeichnung: "Benzin/Diesel" },
    { konto: "6600", bezeichnung: "Werbekosten" },
    { konto: "6610", bezeichnung: "Messekosten" },
    { konto: "6640", bezeichnung: "Bewirtungskosten" },
    { konto: "6650", bezeichnung: "Reisekosten Unternehmer" },
    { konto: "6660", bezeichnung: "Reisekosten Arbeitnehmer" },
    { konto: "6700", bezeichnung: "Kosten Warenabgabe" },
    { konto: "6800", bezeichnung: "Porto" },
    { konto: "6805", bezeichnung: "Telefon" },
    { konto: "6810", bezeichnung: "Internet" },
    { konto: "6815", bezeichnung: "Bürobedarf" },
    { konto: "6820", bezeichnung: "Zeitschriften, Bücher" },
    { konto: "6825", bezeichnung: "Fortbildungskosten" },
    { konto: "6830", bezeichnung: "Rechtsberatung" },
    { konto: "6835", bezeichnung: "Steuerberatung" },
    { konto: "6840", bezeichnung: "Buchführungskosten" },
    { konto: "6850", bezeichnung: "Nebenkosten Geldverkehr" },
    { konto: "6855", bezeichnung: "Leasing" },
    { konto: "6900", bezeichnung: "Sonstige Aufwendungen" },
  ],
  ertrag: [
    { konto: "4000", bezeichnung: "Umsatzerlöse" },
    { konto: "4100", bezeichnung: "Steuerfreie Umsätze Inland" },
    { konto: "4120", bezeichnung: "Steuerfreie Umsätze EU" },
    { konto: "4125", bezeichnung: "Steuerfreie Umsätze Drittland" },
    { konto: "4200", bezeichnung: "Erlöse Leistungen EU" },
    { konto: "4300", bezeichnung: "Erlöse 7% USt" },
    { konto: "4400", bezeichnung: "Erlöse 19% USt" },
    { konto: "4500", bezeichnung: "Provisionserlöse" },
    { konto: "4600", bezeichnung: "Erlöse Vermietung" },
    { konto: "4700", bezeichnung: "Erlösschmälerungen" },
    { konto: "4800", bezeichnung: "Erlöse aus Anlagenverkauf" },
    { konto: "4830", bezeichnung: "Sonstige betriebliche Erträge" },
    { konto: "4840", bezeichnung: "Erträge Auflösung Rückstellung" },
    { konto: "7100", bezeichnung: "Zinserträge" },
    { konto: "7110", bezeichnung: "Erträge aus Beteiligungen" },
    { konto: "7120", bezeichnung: "Dividenden" },
  ],
  anlage: [
    { konto: "0010", bezeichnung: "Aufwendungen Gründung" },
    { konto: "0027", bezeichnung: "EDV-Software" },
    { konto: "0100", bezeichnung: "Konzessionen" },
    { konto: "0110", bezeichnung: "Gewerbliche Schutzrechte" },
    { konto: "0135", bezeichnung: "Geschäftswert" },
    { konto: "0200", bezeichnung: "Grundstücke" },
    { konto: "0210", bezeichnung: "Gebäude" },
    { konto: "0240", bezeichnung: "Einbauten fremde Gebäude" },
    { konto: "0300", bezeichnung: "Technische Anlagen" },
    { konto: "0400", bezeichnung: "Maschinen" },
    { konto: "0500", bezeichnung: "Fahrzeuge" },
    { konto: "0520", bezeichnung: "LKW" },
    { konto: "0600", bezeichnung: "Betriebs-/Geschäftsausstattung" },
    { konto: "0620", bezeichnung: "Geringwertige Wirtschaftsgüter" },
    { konto: "0700", bezeichnung: "Anlagen im Bau" },
    { konto: "0710", bezeichnung: "Anzahlungen Anlagen" },
    { konto: "0800", bezeichnung: "Beteiligungen verbundene" },
    { konto: "0830", bezeichnung: "Beteiligungen" },
    { konto: "0850", bezeichnung: "Wertpapiere Anlagevermögen" },
    { konto: "0900", bezeichnung: "Sonstige Ausleihungen" },
  ],
  finanz: [
    { konto: "1000", bezeichnung: "Kasse" },
    { konto: "1200", bezeichnung: "Bank" },
    { konto: "1210", bezeichnung: "Sparkonto" },
    { konto: "1220", bezeichnung: "Festgeld" },
    { konto: "1300", bezeichnung: "Wechsel" },
    { konto: "1400", bezeichnung: "Forderungen aus L+L" },
    { konto: "1410", bezeichnung: "Forderungen verbundene" },
    { konto: "1450", bezeichnung: "Forderungen Gesellschafter" },
    { konto: "1500", bezeichnung: "Sonstige Vermögensgegenstände" },
    { konto: "1510", bezeichnung: "Geleistete Anzahlungen" },
    { konto: "1400", bezeichnung: "Vorsteuer" },
    { konto: "1401", bezeichnung: "Vorsteuer 7%" },
    { konto: "1406", bezeichnung: "Vorsteuer 19%" },
    { konto: "1407", bezeichnung: "Vorsteuer EU" },
    { konto: "1570", bezeichnung: "Abziehbare Vorsteuer" },
    { konto: "1580", bezeichnung: "Vorsteuer Folgejahr" },
    { konto: "1590", bezeichnung: "Durchlaufende Posten" },
  ],
  eigenkapital: [
    { konto: "2000", bezeichnung: "Gezeichnetes Kapital" },
    { konto: "2010", bezeichnung: "Nicht eingef. Kapital" },
    { konto: "2100", bezeichnung: "Kapitalrücklage" },
    { konto: "2200", bezeichnung: "Gewinnrücklagen" },
    { konto: "2280", bezeichnung: "Satzungsmäßige Rücklagen" },
    { konto: "2800", bezeichnung: "Gewinnvortrag" },
    { konto: "2850", bezeichnung: "Verlustvortrag" },
    { konto: "2860", bezeichnung: "Jahresüberschuss/-fehlbetrag" },
    { konto: "2900", bezeichnung: "Privatentnahmen allgemein" },
    { konto: "2910", bezeichnung: "Privateinlagen" },
    { konto: "2920", bezeichnung: "Privatsteuern" },
    { konto: "2950", bezeichnung: "Privatentnahmen Waren" },
  ],
  verbindlichkeiten: [
    { konto: "3300", bezeichnung: "Verbindlichkeiten aus L+L" },
    { konto: "3310", bezeichnung: "Verbindlichkeiten verbundene" },
    { konto: "3400", bezeichnung: "Erhaltene Anzahlungen" },
    { konto: "3410", bezeichnung: "Erhaltene Anzahlungen 7%" },
    { konto: "3418", bezeichnung: "Erhaltene Anzahlungen 19%" },
    { konto: "3500", bezeichnung: "Verbindlichkeiten Gesellschafter" },
    { konto: "3600", bezeichnung: "Verbindlichkeiten Finanzamt" },
    { konto: "3800", bezeichnung: "Umsatzsteuer" },
    { konto: "3801", bezeichnung: "Umsatzsteuer 7%" },
    { konto: "3806", bezeichnung: "Umsatzsteuer 19%" },
    { konto: "3820", bezeichnung: "Umsatzsteuervorauszahlung" },
    { konto: "3830", bezeichnung: "Umsatzsteuer Vorjahr" },
    { konto: "3700", bezeichnung: "Sonstige Verbindlichkeiten" },
    { konto: "3710", bezeichnung: "Verbindlichkeiten Löhne" },
    { konto: "3720", bezeichnung: "Verbindlichkeiten SV" },
    { konto: "3740", bezeichnung: "Verbindlichkeiten Lohnsteuer" },
  ],
};

// Steuersätze
export const STEUERSAETZE = [
  { satz: "19", bezeichnung: "19% Regelsteuersatz" },
  { satz: "7", bezeichnung: "7% ermäßigter Steuersatz" },
  { satz: "0", bezeichnung: "Steuerfrei" },
];

// Personenkonten-Bereiche
export const PERSONENKONTEN = {
  SKR03: {
    kreditoren: { start: 70000, end: 79999 },
    debitoren: { start: 10000, end: 19999 },
  },
  SKR04: {
    kreditoren: { start: 70000, end: 79999 },
    debitoren: { start: 10000, end: 19999 },
  },
};

// OeKR - Österreichischer Einheitskontenrahmen
// TODO: Vollständigen Kontenrahmen verifizieren - aktuell nur wichtigste Aufwandskonten
export const OeKR: Kontenrahmen = {
  aufwand: [
    { konto: "4000", bezeichnung: "Handelswarenaufwand" },
    { konto: "4200", bezeichnung: "Materialaufwand" },
    { konto: "5000", bezeichnung: "Bezogene Herstellungsleistungen" },
    { konto: "6000", bezeichnung: "Löhne" },
    { konto: "6200", bezeichnung: "Gehälter" },
    { konto: "6300", bezeichnung: "Sozialaufwand" },
    { konto: "7000", bezeichnung: "Raumkosten" },
    { konto: "7100", bezeichnung: "Instandhaltung" },
    { konto: "7200", bezeichnung: "Energie, Entsorgung" },
    { konto: "7300", bezeichnung: "Telekommunikation" }, // Äquivalent zu SKR04 6805
    { konto: "7350", bezeichnung: "Porto" },
    { konto: "7400", bezeichnung: "Bürobedarf" },
    { konto: "7500", bezeichnung: "Fahrzeugkosten" },
    { konto: "7600", bezeichnung: "Werbekosten" },
    { konto: "7650", bezeichnung: "Reisekosten" },
    { konto: "7700", bezeichnung: "Rechts- und Beratungskosten" },
    { konto: "7710", bezeichnung: "Buchführungskosten" },
    { konto: "7750", bezeichnung: "Versicherungen" },
    { konto: "7800", bezeichnung: "Abschreibungen Sachanlagen" },
    { konto: "7900", bezeichnung: "Sonstige Aufwendungen" },
  ],
  ertrag: [
    { konto: "8000", bezeichnung: "Umsatzerlöse Inland" },
    { konto: "8100", bezeichnung: "Umsatzerlöse EU" },
    { konto: "8200", bezeichnung: "Umsatzerlöse Drittland" },
    { konto: "8500", bezeichnung: "Erlösschmälerungen" },
    { konto: "8800", bezeichnung: "Sonstige betriebliche Erträge" },
  ],
  anlage: [
    { konto: "0100", bezeichnung: "Konzessionen" },
    { konto: "0200", bezeichnung: "Grundstücke" },
    { konto: "0210", bezeichnung: "Gebäude" },
    { konto: "0300", bezeichnung: "Maschinen" },
    { konto: "0400", bezeichnung: "Fahrzeuge" },
    { konto: "0500", bezeichnung: "Betriebs- und Geschäftsausstattung" },
    { konto: "0600", bezeichnung: "Beteiligungen" },
  ],
  finanz: [
    { konto: "2000", bezeichnung: "Kasse" },
    { konto: "2800", bezeichnung: "Bank" }, // Österreich nutzt 2800 für Bank
    { konto: "2900", bezeichnung: "Schecks" },
  ],
  eigenkapital: [
    { konto: "9000", bezeichnung: "Eigenkapital" },
    { konto: "9100", bezeichnung: "Kapitalrücklage" },
    { konto: "9200", bezeichnung: "Gewinnrücklagen" },
    { konto: "9800", bezeichnung: "Jahresüberschuss/-fehlbetrag" },
  ],
  verbindlichkeiten: [
    { konto: "3000", bezeichnung: "Verbindlichkeiten aus L+L" },
    { konto: "3500", bezeichnung: "Verbindlichkeiten Finanzamt" },
    { konto: "3520", bezeichnung: "Umsatzsteuer" },
    { konto: "3600", bezeichnung: "Sonstige Verbindlichkeiten" },
  ],
};

// KMU - Schweizer KMU-Kontenrahmen nach OR
// TODO: Vollständigen Kontenrahmen verifizieren - aktuell nur wichtigste Aufwandskonten
export const KMU: Kontenrahmen = {
  aufwand: [
    { konto: "4000", bezeichnung: "Materialaufwand" },
    { konto: "4200", bezeichnung: "Handelswarenaufwand" },
    { konto: "5000", bezeichnung: "Lohnaufwand" },
    { konto: "5700", bezeichnung: "Sozialversicherungsaufwand" },
    { konto: "5800", bezeichnung: "Übriger Personalaufwand" },
    { konto: "6000", bezeichnung: "Raumaufwand" },
    { konto: "6100", bezeichnung: "Unterhalt, Reparaturen" },
    { konto: "6200", bezeichnung: "Fahrzeugaufwand" },
    { konto: "6300", bezeichnung: "Versicherungen" },
    { konto: "6400", bezeichnung: "Energie- und Entsorgungsaufwand" },
    { konto: "6500", bezeichnung: "Verwaltungsaufwand" },
    { konto: "6510", bezeichnung: "Telefon, Internet" }, // Äquivalent zu SKR04 6805
    { konto: "6520", bezeichnung: "Porto" },
    { konto: "6570", bezeichnung: "IT-Kosten" },
    { konto: "6600", bezeichnung: "Werbeaufwand" },
    { konto: "6700", bezeichnung: "Sonstiger Betriebsaufwand" },
    { konto: "6800", bezeichnung: "Abschreibungen Sachanlagen" },
    { konto: "6900", bezeichnung: "Finanzaufwand" },
  ],
  ertrag: [
    { konto: "3000", bezeichnung: "Produktionserlös" },
    { konto: "3200", bezeichnung: "Handelserlös" },
    { konto: "3400", bezeichnung: "Dienstleistungserlös" },
    { konto: "3600", bezeichnung: "Erlösminderungen" },
    { konto: "3800", bezeichnung: "Bestandesänderungen" },
  ],
  anlage: [
    { konto: "1100", bezeichnung: "Forderungen aus L+L" },
    { konto: "1140", bezeichnung: "Vorsteuer" },
    { konto: "1500", bezeichnung: "Mobile Sachanlagen" },
    { konto: "1510", bezeichnung: "Fahrzeuge" },
    { konto: "1520", bezeichnung: "Maschinen" },
    { konto: "1530", bezeichnung: "Mobilien" },
    { konto: "1600", bezeichnung: "Immobile Sachanlagen" },
  ],
  finanz: [
    { konto: "1000", bezeichnung: "Kasse" },
    { konto: "1020", bezeichnung: "Bank" }, // Schweiz nutzt 1020 für Bank
    { konto: "1030", bezeichnung: "Post" },
  ],
  eigenkapital: [
    { konto: "2800", bezeichnung: "Eigenkapital" },
    { konto: "2900", bezeichnung: "Jahresgewinn/-verlust" },
  ],
  verbindlichkeiten: [
    { konto: "2000", bezeichnung: "Verbindlichkeiten aus L+L" },
    { konto: "2200", bezeichnung: "Umsatzsteuer" },
    { konto: "2300", bezeichnung: "Sonstige kurzfristige Verbindlichkeiten" },
  ],
};

// Hilfsfunktion zum Abrufen des Kontenrahmens
export function getKontenrahmen(typ: "SKR03" | "SKR04"): Kontenrahmen {
  return typ === "SKR04" ? SKR04 : SKR03;
}

// Hilfsfunktion zum Abrufen aller Konten eines Typs
export function getKontenByTyp(kontenrahmen: "SKR03" | "SKR04", typ: keyof Kontenrahmen): Konto[] {
  const kr = getKontenrahmen(kontenrahmen);
  return kr[typ] || [];
}

// Hilfsfunktion: Konten-Array zu Map konvertieren
function kontenToMap(konten: Konto[]): Record<string, string> {
  return Object.fromEntries(konten.map(k => [k.konto, k.bezeichnung]));
}

// Aufwandskonten je nach Kontenrahmen (für AI-Prompts)
export function getAufwandskontenByKontenrahmen(typ: string): Record<string, string> {
  switch(typ) {
    case "SKR03": return kontenToMap(SKR03.aufwand);
    case "SKR04": return kontenToMap(SKR04.aufwand);
    case "OeKR": return kontenToMap(OeKR.aufwand);
    case "KMU": return kontenToMap(KMU.aufwand);
    default: return kontenToMap(SKR04.aufwand); // Fallback auf SKR04
  }
}

// Bankkonto je nach Kontenrahmen
export function getBankKontoByKontenrahmen(typ: string): string {
  switch(typ) {
    case "SKR03": return "1200";
    case "SKR04": return "1200";
    case "OeKR": return "2800"; // Österreich: Klasse 2 Finanzumlaufvermögen
    case "KMU": return "1020";  // Schweiz: Bankguthaben
    default: return "1200";      // Fallback auf SKR04
  }
}

// Kontenrahmen-Name für AI-Prompt (mit Sprach-Kontext)
export function getKontenrahmenName(typ: string): string {
  switch(typ) {
    case "SKR03": return "deutsche Buchhaltung nach SKR03";
    case "SKR04": return "deutsche Buchhaltung nach SKR04";
    case "OeKR": return "österreichische Buchhaltung nach dem Einheitskontenrahmen (OeKR)";
    case "KMU": return "Schweizer Buchhaltung nach dem KMU-Kontenrahmen";
    default: return "deutsche Buchhaltung nach SKR04"; // Fallback
  }
}
