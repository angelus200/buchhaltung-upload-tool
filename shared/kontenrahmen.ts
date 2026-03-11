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
export const KMU: Kontenrahmen = {
  aufwand: [
    { konto: "4400", bezeichnung: "Aufwand für bezogene Dienstleistungen" },
    { konto: "5000", bezeichnung: "Lohnaufwand" },
    { konto: "5700", bezeichnung: "AHV, IV, EO, ALV" },
    { konto: "5800", bezeichnung: "Übriger Personalaufwand" },
    { konto: "6000", bezeichnung: "Domizilgebühren" },
    { konto: "6300", bezeichnung: "Sachversicherungen, Abgaben, Gebühren" },
    { konto: "6500", bezeichnung: "Büromaterial" },
    { konto: "6510", bezeichnung: "Telefon / Internet" },
    { konto: "6570", bezeichnung: "Informatikaufwand inkl. Leasing" },
    { konto: "6600", bezeichnung: "Werbeaufwand" },
    { konto: "6700", bezeichnung: "Sonstiger betrieblicher Aufwand" },
    { konto: "6800", bezeichnung: "Abschreibungen und Wertberichtigungen" },
    { konto: "6900", bezeichnung: "Bankkreditzinsaufwand" },
    { konto: "8900", bezeichnung: "Direkte Steuern" },
  ],
  ertrag: [
    { konto: "3400", bezeichnung: "Dienstleistungserlöse" },
    { konto: "3600", bezeichnung: "Übrige Erlöse aus Lieferungen und Leistungen" },
    { konto: "6950", bezeichnung: "Erträge aus Bankguthaben" },
    { konto: "6960", bezeichnung: "Erträge aus Darlehen" },
    { konto: "6999", bezeichnung: "Währungsgewinne" },
  ],
  anlage: [
    { konto: "1500", bezeichnung: "Maschinen und Apparate" },
    { konto: "1510", bezeichnung: "Mobiliar und Einrichtungen" },
    { konto: "1520", bezeichnung: "Büromaschinen, Informatik, Kommunikation" },
    { konto: "1700", bezeichnung: "Patente, Know-how, Lizenzen, Rechte" },
    { konto: "1710", bezeichnung: "Marken" },
  ],
  finanz: [
    { konto: "1020", bezeichnung: "SZKB CHF" },
    { konto: "1021", bezeichnung: "SZKB EUR" },
    { konto: "1090", bezeichnung: "Transferkonto" },
  ],
  eigenkapital: [
    { konto: "2800", bezeichnung: "Stammkapital" },
    { konto: "2970", bezeichnung: "Gewinnvortrag / Verlustvortrag" },
  ],
  verbindlichkeiten: [
    { konto: "2200", bezeichnung: "Abrechnungskonto MWST" },
    { konto: "2300", bezeichnung: "Noch nicht bezahlter Aufwand" },
    { konto: "2450", bezeichnung: "Darlehen langfristig" },
  ],
};

// KMU-Standardkonten für DB-Import (Schweiz OR)
// Extrahiert aus Jahresabschluss 31.12.2024 (Trademark24-7 AG & Marketplace24-7 GmbH) — 82 Konten
export interface KmuStandardKonto {
  kontonummer: string;
  bezeichnung: string;
  kontotyp: 'aktiv' | 'passiv' | 'aufwand' | 'ertrag';
  kategorie: string;
}

export const kmuStandardKonten: KmuStandardKonto[] = [
  // AKTIVEN - Umlaufvermögen
  { kontonummer: '1020', bezeichnung: 'SZKB CHF', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1021', bezeichnung: 'SZKB EUR', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1022', bezeichnung: 'SZKB Gründungskonto', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1090', bezeichnung: 'Transferkonto', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1091', bezeichnung: 'Durchlaufkonto Lohn', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1092', bezeichnung: 'Durchlaufkonto Kreditkarten', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1099', bezeichnung: 'Abklärungskonto', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1109', bezeichnung: 'Delkredere', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1176', bezeichnung: 'Verrechnungssteuer', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1280', bezeichnung: 'Nicht fakturierte Dienstleistungen', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1300', bezeichnung: 'Bezahlter Aufwand des Folgejahres', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  { kontonummer: '1301', bezeichnung: 'Noch nicht erhaltener Ertrag', kontotyp: 'aktiv', kategorie: 'Umlaufvermögen' },
  // AKTIVEN - Anlagevermögen
  { kontonummer: '1440', bezeichnung: 'Darlehen (konzernintern)', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1441', bezeichnung: 'Darlehen Marketplace24-7 GmbH', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1442', bezeichnung: 'Darlehen Gesellschafter', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1500', bezeichnung: 'Maschinen und Apparate', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1510', bezeichnung: 'Mobiliar und Einrichtungen', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1520', bezeichnung: 'Büromaschinen, Informatik, Kommunikation', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1530', bezeichnung: 'Fahrzeuge', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1540', bezeichnung: 'Werkzeuge und Geräte', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  { kontonummer: '1700', bezeichnung: 'Patente, Know-how, Lizenzen, Rechte', kontotyp: 'aktiv', kategorie: 'Immaterielle Anlagen' },
  { kontonummer: '1710', bezeichnung: 'Marken', kontotyp: 'aktiv', kategorie: 'Immaterielle Anlagen' },
  { kontonummer: '1712', bezeichnung: 'Modelle', kontotyp: 'aktiv', kategorie: 'Immaterielle Anlagen' },
  { kontonummer: '1770', bezeichnung: 'Goodwill', kontotyp: 'aktiv', kategorie: 'Immaterielle Anlagen' },
  { kontonummer: '1850', bezeichnung: 'Nicht einbezahltes Stammkapital', kontotyp: 'aktiv', kategorie: 'Anlagevermögen' },
  // PASSIVEN - Fremdkapital
  { kontonummer: '2200', bezeichnung: 'Abrechnungskonto MWST', kontotyp: 'passiv', kategorie: 'Kurzfristiges Fremdkapital' },
  { kontonummer: '2201', bezeichnung: 'Geschuldete MWST (Umsatzsteuer)', kontotyp: 'passiv', kategorie: 'Kurzfristiges Fremdkapital' },
  { kontonummer: '2269', bezeichnung: 'Beschlossene Ausschüttungen', kontotyp: 'passiv', kategorie: 'Kurzfristiges Fremdkapital' },
  { kontonummer: '2300', bezeichnung: 'Noch nicht bezahlter Aufwand', kontotyp: 'passiv', kategorie: 'Kurzfristiges Fremdkapital' },
  { kontonummer: '2301', bezeichnung: 'Erhaltener Ertrag des Folgejahres', kontotyp: 'passiv', kategorie: 'Kurzfristiges Fremdkapital' },
  { kontonummer: '2330', bezeichnung: 'Kurzfristige Rückstellungen', kontotyp: 'passiv', kategorie: 'Kurzfristiges Fremdkapital' },
  { kontonummer: '2450', bezeichnung: 'Darlehen langfristig', kontotyp: 'passiv', kategorie: 'Langfristiges Fremdkapital' },
  { kontonummer: '2600', bezeichnung: 'Rückstellungen langfristig', kontotyp: 'passiv', kategorie: 'Langfristiges Fremdkapital' },
  // PASSIVEN - Eigenkapital
  { kontonummer: '2800', bezeichnung: 'Stammkapital', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  { kontonummer: '2900', bezeichnung: 'Agio', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  { kontonummer: '2903', bezeichnung: 'Gesetzliche Kapitalreserve', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  { kontonummer: '2950', bezeichnung: 'Gesetzliche Gewinnreserve', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  { kontonummer: '2955', bezeichnung: 'Aufwertungsreserve', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  { kontonummer: '2960', bezeichnung: 'Freiwillige Gewinnreserven', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  { kontonummer: '2965', bezeichnung: 'Eigene Kapitalanteile (Minusposten)', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  { kontonummer: '2970', bezeichnung: 'Gewinnvortrag / Verlustvortrag', kontotyp: 'passiv', kategorie: 'Eigenkapital' },
  // ERTRAG
  { kontonummer: '3400', bezeichnung: 'Dienstleistungserlöse', kontotyp: 'ertrag', kategorie: 'Erlöse' },
  { kontonummer: '3600', bezeichnung: 'Übrige Erlöse aus Lieferungen und Leistungen', kontotyp: 'ertrag', kategorie: 'Erlöse' },
  { kontonummer: '3800', bezeichnung: 'Erlösminderungen', kontotyp: 'ertrag', kategorie: 'Erlöse' },
  // AUFWAND - Waren/Dienstleistungen
  { kontonummer: '4400', bezeichnung: 'Aufwand für bezogene Dienstleistungen', kontotyp: 'aufwand', kategorie: 'Warenaufwand' },
  { kontonummer: '4500', bezeichnung: 'Aufwand Drittanbieter', kontotyp: 'aufwand', kategorie: 'Warenaufwand' },
  { kontonummer: '4800', bezeichnung: 'Aufwandminderungen', kontotyp: 'aufwand', kategorie: 'Warenaufwand' },
  // AUFWAND - Personal
  { kontonummer: '5000', bezeichnung: 'Lohnaufwand', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5700', bezeichnung: 'AHV, IV, EO, ALV', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5710', bezeichnung: 'FAK', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5720', bezeichnung: 'Vorsorgeeinrichtungen (BVG)', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5730', bezeichnung: 'Unfallversicherung (UVG)', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5740', bezeichnung: 'Krankentaggeldversicherung', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5800', bezeichnung: 'Übriger Personalaufwand', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5810', bezeichnung: 'Betriebsnotwendige Ausbildung', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  { kontonummer: '5820', bezeichnung: 'Reisespesen', kontotyp: 'aufwand', kategorie: 'Personalaufwand' },
  // AUFWAND - Betrieb
  { kontonummer: '6000', bezeichnung: 'Domizilgebühren', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6300', bezeichnung: 'Sachversicherungen, Abgaben, Gebühren, Bewilligungen', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6500', bezeichnung: 'Büromaterial', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6503', bezeichnung: 'Fachliteratur, Zeitungen, Zeitschriften', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6510', bezeichnung: 'Telefon / Internet', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6513', bezeichnung: 'Porti', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6570', bezeichnung: 'Informatikaufwand inkl. Leasing', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6580', bezeichnung: 'Lizenzaufwendungen / Updates', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6581', bezeichnung: 'Buchhaltung, Administration', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6582', bezeichnung: 'Rechtsberatung', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6583', bezeichnung: 'Notariat, Handelsregister', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6590', bezeichnung: 'Verbrauchsmaterial', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6591', bezeichnung: 'Verwaltungsaufwand', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6600', bezeichnung: 'Werbeaufwand', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6642', bezeichnung: 'Kundengeschenke', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6700', bezeichnung: 'Sonstiger betrieblicher Aufwand', kontotyp: 'aufwand', kategorie: 'Betriebsaufwand' },
  { kontonummer: '6800', bezeichnung: 'Abschreibungen und Wertberichtigungen', kontotyp: 'aufwand', kategorie: 'Abschreibungen' },
  // AUFWAND - Finanziell
  { kontonummer: '6900', bezeichnung: 'Bankkreditzinsaufwand', kontotyp: 'aufwand', kategorie: 'Finanzaufwand' },
  { kontonummer: '6940', bezeichnung: 'Bankspesen', kontotyp: 'aufwand', kategorie: 'Finanzaufwand' },
  { kontonummer: '6949', bezeichnung: 'Währungsverluste', kontotyp: 'aufwand', kategorie: 'Finanzaufwand' },
  // ERTRAG - Finanziell
  { kontonummer: '6950', bezeichnung: 'Erträge aus Bankguthaben', kontotyp: 'ertrag', kategorie: 'Finanzertrag' },
  { kontonummer: '6960', bezeichnung: 'Erträge aus Darlehen', kontotyp: 'ertrag', kategorie: 'Finanzertrag' },
  { kontonummer: '6999', bezeichnung: 'Währungsgewinne', kontotyp: 'ertrag', kategorie: 'Finanzertrag' },
  // AUSSERORDENTLICH / STEUERN
  { kontonummer: '8000', bezeichnung: 'Betriebsfremder Aufwand', kontotyp: 'aufwand', kategorie: 'Ausserordentlich' },
  { kontonummer: '8500', bezeichnung: 'Ausserordentlicher Aufwand', kontotyp: 'aufwand', kategorie: 'Ausserordentlich' },
  { kontonummer: '8900', bezeichnung: 'Direkte Steuern', kontotyp: 'aufwand', kategorie: 'Steuern' },
];

export function getKmuStandardKonten(): KmuStandardKonto[] {
  return kmuStandardKonten;
}

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
