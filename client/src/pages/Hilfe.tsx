import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Search,
  Home,
  Building2,
  Database,
  FileText,
  Upload,
  Download,
  BarChart3,
  Calendar,
  CreditCard,
  Package,
  StickyNote,
  Landmark,
  Send,
  ListTodo,
  Users,
  Settings,
  CheckCircle2,
  Info,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  FileSpreadsheet,
  TrendingUp,
  Briefcase,
  PiggyBank,
  ShieldCheck,
  Globe,
  Lock,
  Calculator,
  Receipt,
  Banknote,
  Cloud,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface Kapitel {
  id: string;
  titel: string;
  icon: any;
  unterkapitel?: Array<{
    id: string;
    titel: string;
  }>;
}

const KAPITEL: Kapitel[] = [
  {
    id: "uebersicht",
    titel: "Übersicht",
    icon: Home,
    unterkapitel: [
      { id: "was-ist", titel: "Was ist buchhaltung-ki.app?" },
      { id: "zielgruppe", titel: "Für wen ist die App gedacht?" },
      { id: "laender", titel: "Unterstützte Länder" },
    ],
  },
  {
    id: "erste-schritte",
    titel: "Erste Schritte",
    icon: CheckCircle2,
    unterkapitel: [
      { id: "login", titel: "Login & Registrierung" },
      { id: "firma-auswaehlen", titel: "Firma auswählen" },
      { id: "navigation", titel: "Navigation" },
    ],
  },
  {
    id: "stammdaten",
    titel: "Stammdaten",
    icon: Database,
    unterkapitel: [
      { id: "sachkonten", titel: "Sachkonten (SKR04)" },
      { id: "kreditoren-debitoren", titel: "Kreditoren & Debitoren" },
      { id: "finanzkonten", titel: "Finanzkonten" },
      { id: "anlagevermoegen", titel: "Anlagevermögen" },
      { id: "beteiligungen", titel: "Beteiligungen" },
      { id: "gesellschafter", titel: "Gesellschafter" },
      { id: "kostenstellen", titel: "Kostenstellen" },
      { id: "vertraege", titel: "Verträge" },
    ],
  },
  {
    id: "buchungen",
    titel: "Buchungen",
    icon: FileText,
    unterkapitel: [
      { id: "buchungen-anzeigen", titel: "Buchungen anzeigen & filtern" },
      { id: "erweiterte-suche", titel: "Erweiterte Suche" },
      { id: "doppelbuchungen", titel: "Doppelbuchungen prüfen" },
      { id: "buchung-erstellen", titel: "Buchung erstellen/bearbeiten" },
    ],
  },
  {
    id: "kontoauszuege",
    titel: "Kontoauszüge",
    icon: Receipt,
    unterkapitel: [
      { id: "auszuege-uebersicht", titel: "Übersicht & Navigation" },
      { id: "auszuege-importieren", titel: "Auszüge importieren" },
      { id: "auszuege-abgleichen", titel: "Mit Buchungen abgleichen" },
    ],
  },
  {
    id: "kredite-leasing",
    titel: "Kredite & Leasing",
    icon: Banknote,
    unterkapitel: [
      { id: "finanzierungen-uebersicht", titel: "Übersicht" },
      { id: "vertrag-anlegen", titel: "Vertrag anlegen" },
      { id: "ai-vertragsanalyse", titel: "AI-Vertragsanalyse" },
      { id: "zahlungsplan", titel: "Zahlungsplan" },
      { id: "buchungsintegration", titel: "Buchungsintegration" },
    ],
  },
  {
    id: "buchungsvorschlaege",
    titel: "Buchungsvorschläge",
    icon: Sparkles,
    unterkapitel: [
      { id: "vorschlaege-uebersicht", titel: "Übersicht" },
      { id: "vorschlaege-workflow", titel: "Workflow" },
      { id: "kreditor-matching", titel: "Kreditor-Matching" },
    ],
  },
  {
    id: "dropbox",
    titel: "Dropbox-Integration",
    icon: Cloud,
    unterkapitel: [
      { id: "dropbox-einrichten", titel: "Einrichten" },
      { id: "dropbox-verarbeitung", titel: "Automatische Verarbeitung" },
    ],
  },
  {
    id: "elster",
    titel: "ELSTER USt-Voranmeldung",
    icon: Calculator,
    unterkapitel: [
      { id: "elster-uebersicht", titel: "Übersicht" },
      { id: "elster-berechnung", titel: "Kennzahlen berechnen" },
      { id: "elster-xml", titel: "XML-Export" },
    ],
  },
  {
    id: "datev",
    titel: "DATEV Integration",
    icon: FileSpreadsheet,
    unterkapitel: [
      { id: "datev-import", titel: "DATEV Import" },
      { id: "datev-export", titel: "DATEV Export" },
      { id: "dateiformate", titel: "Unterstützte Dateiformate" },
    ],
  },
  {
    id: "berichte",
    titel: "Berichte & Auswertungen",
    icon: BarChart3,
    unterkapitel: [
      { id: "bwa", titel: "BWA (Betriebswirtschaftliche Auswertung)" },
      { id: "kennzahlen", titel: "Kennzahlen" },
      { id: "uebersicht-berichte", titel: "Übersicht" },
    ],
  },
  {
    id: "weitere-module",
    titel: "Weitere Module",
    icon: Settings,
    unterkapitel: [
      { id: "kalender", titel: "Kalender" },
      { id: "zahlungen", titel: "Zahlungen" },
      { id: "kontoauszuege-modul", titel: "Kontoauszüge" },
      { id: "kredite-leasing-modul", titel: "Kredite & Leasing" },
      { id: "lager", titel: "Lager" },
      { id: "notizen", titel: "Notizen" },
      { id: "finanzamt", titel: "Finanzamt" },
      { id: "steuerberater", titel: "Steuerberater" },
      { id: "aufgaben", titel: "Aufgaben" },
    ],
  },
];

export default function Hilfe() {
  const [activeKapitel, setActiveKapitel] = useState<string>("uebersicht");
  const [activeUnterkapitel, setActiveUnterkapitel] = useState<string>("was-ist");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const scrollToSection = (unterkapitelId: string) => {
    setActiveUnterkapitel(unterkapitelId);
    const element = document.getElementById(unterkapitelId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Benutzerhandbuch" subtitle="Hilfe & Dokumentation" />

      <div className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <CardTitle className="text-base">Inhaltsverzeichnis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {KAPITEL.map((kapitel) => {
                  const Icon = kapitel.icon;
                  const isActive = activeKapitel === kapitel.id;

                  return (
                    <div key={kapitel.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-2 font-medium",
                          isActive && "bg-teal-50 text-teal-700"
                        )}
                        onClick={() => {
                          setActiveKapitel(kapitel.id);
                          if (kapitel.unterkapitel && kapitel.unterkapitel.length > 0) {
                            scrollToSection(kapitel.unterkapitel[0].id);
                          }
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {kapitel.titel}
                      </Button>

                      {isActive && kapitel.unterkapitel && (
                        <div className="ml-6 mt-1 space-y-0.5">
                          {kapitel.unterkapitel.map((uk) => (
                            <Button
                              key={uk.id}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "w-full justify-start text-xs font-normal",
                                activeUnterkapitel === uk.id && "text-teal-600"
                              )}
                              onClick={() => scrollToSection(uk.id)}
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              {uk.titel}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Hauptinhalt */}
          <div className="col-span-9 space-y-6">
            {/* Übersicht */}
            <Card id="was-ist">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-600" />
                  <CardTitle>Was ist buchhaltung-ki.app?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  <strong>buchhaltung-ki.app</strong> ist eine moderne, KI-gestützte Buchhaltungssoftware für kleine und mittlere Unternehmen.
                  Die App ermöglicht die digitale Erfassung, Verwaltung und Analyse von Buchhaltungsdaten mit nahtloser DATEV-Integration.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Hauptfunktionen:</h4>
                <ul className="space-y-1">
                  <li>✅ Digitale Belegerfassung mit automatischer Texterkennung (OCR)</li>
                  <li>✅ DATEV Import & Export (GDPdU-kompatibel)</li>
                  <li>✅ Automatische Kontenzuordnung mit KI-Unterstützung</li>
                  <li>✅ Echtzeit-Übersichten und Kennzahlen (BWA, Liquidität, Rentabilität)</li>
                  <li>✅ Duplikatserkennung und intelligente Buchungssuche</li>
                  <li>✅ Stammdatenverwaltung (Kreditoren, Debitoren, Finanzkonten)</li>
                  <li>✅ Kollaboration mit Steuerberater</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="zielgruppe">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <CardTitle>Für wen ist die App gedacht?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>Die App richtet sich an:</p>
                <ul className="space-y-2">
                  <li>
                    <strong>Selbstständige & Freiberufler:</strong> Einfache Belegerfassung und Übersicht über Einnahmen/Ausgaben
                  </li>
                  <li>
                    <strong>Kleine & mittlere Unternehmen (KMU):</strong> Vollständige Buchhaltung mit DATEV-Export für Steuerberater
                  </li>
                  <li>
                    <strong>Steuerberater & Kanzleien:</strong> Digitale Zusammenarbeit mit Mandanten, Import von Belegen
                  </li>
                  <li>
                    <strong>Geschäftsführer & Controller:</strong> Echtzeit-Kennzahlen und betriebswirtschaftliche Auswertungen
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card id="laender">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <CardTitle>Unterstützte Länder</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>Die App unterstützt Buchhaltung nach den Standards folgender Länder:</p>
                <div className="grid grid-cols-3 gap-4 not-prose mt-4">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <span className="text-2xl">🇩🇪</span>
                    <div>
                      <div className="font-semibold">Deutschland</div>
                      <div className="text-xs text-slate-500">SKR03, SKR04</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <span className="text-2xl">🇦🇹</span>
                    <div>
                      <div className="font-semibold">Österreich</div>
                      <div className="text-xs text-slate-500">Österr. Kontenrahmen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <span className="text-2xl">🇨🇭</span>
                    <div>
                      <div className="font-semibold">Schweiz</div>
                      <div className="text-xs text-slate-500">KMU-Kontenrahmen</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Erste Schritte */}
            <Card id="login">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <CardTitle>Login & Registrierung</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die Authentifizierung erfolgt über <strong>Clerk</strong>, einem modernen und sicheren Identity-Provider.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Registrierung:</h4>
                <ol className="space-y-2">
                  <li>Öffnen Sie <code>https://buchhaltung-ki.app</code></li>
                  <li>Klicken Sie auf "Registrieren"</li>
                  <li>Geben Sie Ihre E-Mail-Adresse und ein sicheres Passwort ein</li>
                  <li>Bestätigen Sie Ihre E-Mail-Adresse über den Bestätigungslink</li>
                  <li>Erstellen Sie Ihr erstes Unternehmen</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">Login:</h4>
                <ol className="space-y-2">
                  <li>Öffnen Sie <code>https://buchhaltung-ki.app/login</code></li>
                  <li>Geben Sie Ihre E-Mail-Adresse und Passwort ein</li>
                  <li>Sie werden automatisch zur Hauptseite weitergeleitet</li>
                </ol>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Sicherheit:</strong> Ihre Zugangsdaten werden verschlüsselt und nach höchsten Sicherheitsstandards (SOC 2, GDPR) verwaltet.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="firma-auswaehlen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  <CardTitle>Firma auswählen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Nach dem Login können Sie zwischen verschiedenen Unternehmen wechseln, falls Sie mehrere Firmen verwalten.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Firma wechseln:</h4>
                <ol className="space-y-2">
                  <li>Klicken Sie im Header auf das <strong>Firmen-Dropdown</strong> (neben dem Firmenlogo)</li>
                  <li>Wählen Sie die gewünschte Firma aus der Liste</li>
                  <li>Die Seite wird automatisch aktualisiert und zeigt die Daten der ausgewählten Firma</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">Neue Firma erstellen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Unternehmen</strong> im Header</li>
                  <li>Klicken Sie auf "Neues Unternehmen erstellen"</li>
                  <li>Füllen Sie die erforderlichen Felder aus (Name, Rechtsform, Kontenrahmen, etc.)</li>
                  <li>Speichern Sie die Firma</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="navigation">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-teal-600" />
                  <CardTitle>Navigation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>Die Hauptnavigation befindet sich im oberen Header und bietet schnellen Zugriff auf alle Module:</p>
                <div className="grid grid-cols-2 gap-3 not-prose mt-4">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Upload className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Buchungen</div>
                      <div className="text-xs text-slate-500">Belege erfassen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Übersicht</div>
                      <div className="text-xs text-slate-500">Buchungsliste</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Kennzahlen</div>
                      <div className="text-xs text-slate-500">BWA & Auswertungen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Zahlungen</div>
                      <div className="text-xs text-slate-500">Offene Posten</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Kalender</div>
                      <div className="text-xs text-slate-500">Termine & Fristen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Briefcase className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Stammdaten</div>
                      <div className="text-xs text-slate-500">Konten & Partner</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Package className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Lager</div>
                      <div className="text-xs text-slate-500">Artikel & Inventur</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <StickyNote className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Notizen</div>
                      <div className="text-xs text-slate-500">Interne Notizen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Landmark className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Finanzamt</div>
                      <div className="text-xs text-slate-500">UStVA & Meldungen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <ListTodo className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Aufgaben</div>
                      <div className="text-xs text-slate-500">To-Do-Listen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <Send className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">Steuerberater</div>
                      <div className="text-xs text-slate-500">Übergaben & Chat</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-sm">DATEV Import</div>
                      <div className="text-xs text-slate-500">Daten importieren</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Stammdaten */}
            <Card id="sachkonten">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-600" />
                  <CardTitle>Sachkonten (SKR04)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Sachkonten bilden die Basis Ihrer Buchhaltung. Die App unterstützt den deutschen Kontenrahmen <strong>SKR04</strong> (Standard-Kontenrahmen für Industrie, Handel, Handwerk).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Sachkonto anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten</strong></li>
                  <li>Wählen Sie den Tab "Sachkonten"</li>
                  <li>Klicken Sie auf "Neues Sachkonto"</li>
                  <li>Füllen Sie die Felder aus:
                    <ul>
                      <li><strong>Kontonummer:</strong> 4-6 stellige Nummer (z.B. 4120 für Miete)</li>
                      <li><strong>Bezeichnung:</strong> Name des Kontos (z.B. "Miete")</li>
                      <li><strong>Kontotyp:</strong> Aufwand, Ertrag, Aktiva, Passiva</li>
                      <li><strong>Steuersatz:</strong> 19%, 7%, 0% (steuerfrei), nicht steuerbar</li>
                    </ul>
                  </li>
                  <li>Speichern Sie das Sachkonto</li>
                </ol>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Hinweis:</strong> Die meisten Standard-Sachkonten (SKR04) sind bereits vorinstalliert. Sie müssen nur spezielle, individuelle Konten anlegen.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="kreditoren-debitoren">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <CardTitle>Kreditoren & Debitoren</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  <strong>Kreditoren</strong> sind Ihre Lieferanten (Verbindlichkeiten). <strong>Debitoren</strong> sind Ihre Kunden (Forderungen).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Kreditor/Debitor anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten</strong></li>
                  <li>Wählen Sie den Tab "Kreditoren" oder "Debitoren"</li>
                  <li>Klicken Sie auf "Neuer Kreditor/Debitor"</li>
                  <li>Füllen Sie die Felder aus:
                    <ul>
                      <li><strong>Kontonummer:</strong> Eindeutige Nummer (z.B. 10001 für Debitor 1)</li>
                      <li><strong>Name:</strong> Firmenname oder Personenname</li>
                      <li><strong>Adresse:</strong> Straße, PLZ, Ort, Land</li>
                      <li><strong>USt-IdNr.:</strong> Umsatzsteuer-Identifikationsnummer (optional)</li>
                      <li><strong>IBAN:</strong> Bankverbindung (optional)</li>
                      <li><strong>E-Mail:</strong> Kontakt-E-Mail (optional)</li>
                    </ul>
                  </li>
                  <li>Speichern Sie den Kreditor/Debitor</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">DATEV-Import:</h4>
                <p>
                  Sie können Kreditoren/Debitoren auch per DATEV-Export importieren (CSV-Datei "DebitorenKreditorenstammdaten.csv").
                </p>
              </CardContent>
            </Card>

            <Card id="finanzkonten">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  <CardTitle>Finanzkonten</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Finanzkonten umfassen Bankkonten, Kreditkarten, Zahlungsdienstleister und Brokerkonten.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Verfügbare Kategorien:</h4>
                <div className="grid grid-cols-2 gap-3 not-prose mt-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Bankkonten
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Geschäftskonten, Girokonten, Sparkonten
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Kreditkarten
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Soldo Master, Payhawk, American Express
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Zahlungsdienstleister
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Sparkasse, Sumup, Stripe, PayPal
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold flex items-center gap-2">
                      <PiggyBank className="w-4 h-4" />
                      Brokerkonten
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Wertpapierdepots, Broker
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold mt-4 mb-2">Finanzkonto anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten</strong></li>
                  <li>Wählen Sie die gewünschte Kategorie (Bankkonten, Kreditkarten, etc.)</li>
                  <li>Klicken Sie auf "Neues Konto"</li>
                  <li>Füllen Sie die Felder aus (Name, Anbieter, Kontonummer, IBAN, etc.)</li>
                  <li>Speichern Sie das Konto</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="anlagevermoegen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  <CardTitle>Anlagevermögen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Anlagevermögen umfasst langfristige Vermögenswerte wie Maschinen, Fahrzeuge, Gebäude, Computer, etc.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Anlage anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten → Anlagevermögen</strong></li>
                  <li>Klicken Sie auf "Neue Anlage"</li>
                  <li>Füllen Sie die Felder aus:
                    <ul>
                      <li><strong>Bezeichnung:</strong> Name der Anlage (z.B. "Laptop Dell XPS 15")</li>
                      <li><strong>Anschaffungsdatum:</strong> Kaufdatum</li>
                      <li><strong>Anschaffungskosten:</strong> Nettobetrag</li>
                      <li><strong>Nutzungsdauer:</strong> Jahre (z.B. 3 Jahre für Computer)</li>
                      <li><strong>Abschreibungsmethode:</strong> Linear, degressiv</li>
                      <li><strong>Sachkonto:</strong> Anlagenkonto (z.B. 0027 "Betriebs- und Geschäftsausstattung")</li>
                    </ul>
                  </li>
                  <li>Speichern Sie die Anlage</li>
                </ol>
                <p className="text-sm text-slate-600 mt-4">
                  Die App berechnet automatisch die jährliche Abschreibung und erstellt entsprechende Buchungssätze.
                </p>
              </CardContent>
            </Card>

            <Card id="beteiligungen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-teal-600" />
                  <CardTitle>Beteiligungen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Beteiligungen sind Unternehmensanteile an anderen Gesellschaften (z.B. GmbH-Anteile, Aktien).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Beteiligung anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten → Beteiligungen</strong></li>
                  <li>Klicken Sie auf "Neue Beteiligung"</li>
                  <li>Füllen Sie die Felder aus (Name der Gesellschaft, Anzahl Anteile, Buchwert, etc.)</li>
                  <li>Speichern Sie die Beteiligung</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="gesellschafter">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <CardTitle>Gesellschafter</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Gesellschafter sind die Inhaber/Eigentümer Ihres Unternehmens. Verwenden Sie dieses Modul für Gesellschafterkonten, Entnahmen, Einlagen.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Gesellschafter anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten → Gesellschafter</strong></li>
                  <li>Klicken Sie auf "Neuer Gesellschafter"</li>
                  <li>Füllen Sie die Felder aus (Name, Anteil %, Kapitalkonto-Nummer, etc.)</li>
                  <li>Speichern Sie den Gesellschafter</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="kostenstellen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <CardTitle>Kostenstellen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Kostenstellen ermöglichen die Zuordnung von Aufwendungen und Erträgen zu verschiedenen Bereichen (z.B. Produktion, Vertrieb, Verwaltung).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Kostenstelle anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten → Kostenstellen</strong></li>
                  <li>Klicken Sie auf "Neue Kostenstelle"</li>
                  <li>Füllen Sie die Felder aus (Nummer, Bezeichnung, Budget, etc.)</li>
                  <li>Speichern Sie die Kostenstelle</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="vertraege">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <CardTitle>Verträge</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Verwalten Sie laufende Verträge (Mietverträge, Leasingverträge, Wartungsverträge) mit automatischen Erinnerungen für Kündigungsfristen.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Vertrag anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Stammdaten → Verträge</strong></li>
                  <li>Klicken Sie auf "Neuer Vertrag"</li>
                  <li>Füllen Sie die Felder aus (Vertragspartner, Beginn, Laufzeit, Kündigungsfrist, monatliche Kosten, etc.)</li>
                  <li>Speichern Sie den Vertrag</li>
                </ol>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Buchungen */}
            <Card id="buchungen-anzeigen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <CardTitle>Buchungen anzeigen & filtern</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die Übersicht-Seite zeigt alle erfassten Buchungen in einer Tabelle. Sie können nach Datum, Status, Betrag und mehr filtern.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Verfügbare Filter:</h4>
                <ul className="space-y-1">
                  <li>Zeitraum (Monat/Jahr)</li>
                  <li>Status (Pending, Complete, Error)</li>
                  <li>Zahlungsstatus (Offen, Bezahlt, Teilbezahlt, Storniert)</li>
                  <li>Buchungsart (Aufwand, Ertrag, Anlage, Sonstig)</li>
                  <li>Sachkonto</li>
                  <li>Geschäftspartner</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Sortierung:</h4>
                <p>
                  Klicken Sie auf eine Spaltenüberschrift, um die Tabelle zu sortieren (aufsteigend/absteigend).
                </p>
              </CardContent>
            </Card>

            <Card id="erweiterte-suche">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-teal-600" />
                  <CardTitle>Erweiterte Suche</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die erweiterte Suche ermöglicht gezielte Suche nach Buchungen mit mehreren Kriterien gleichzeitig.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Erweiterte Suche verwenden:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Übersicht</strong></li>
                  <li>Klicken Sie auf den Button "Erweiterte Suche"</li>
                  <li>Geben Sie Suchkriterien ein:
                    <ul>
                      <li><strong>Suchtext:</strong> Suche in Buchungstext, Belegnummer, Geschäftspartner</li>
                      <li><strong>Datum von/bis:</strong> Zeitraum einschränken</li>
                      <li><strong>Betrag min/max:</strong> Betragsbereich</li>
                      <li><strong>Soll-Konto:</strong> Bestimmtes Soll-Konto</li>
                      <li><strong>Haben-Konto:</strong> Bestimmtes Haben-Konto</li>
                    </ul>
                  </li>
                  <li>Klicken Sie auf "Suchen"</li>
                </ol>
                <p>
                  Die Suchergebnisse ersetzen die normale Buchungsliste. Klicken Sie auf "Zurück zur normalen Ansicht", um die Filter zu löschen.
                </p>
              </CardContent>
            </Card>

            <Card id="doppelbuchungen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-teal-600" />
                  <CardTitle>Doppelbuchungen prüfen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die Duplikatserkennung findet automatisch mögliche Doppelbuchungen anhand intelligenter Kriterien.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Erkennungskriterien:</h4>
                <ul className="space-y-2">
                  <li>
                    <strong>100% Übereinstimmung:</strong> Gleicher Betrag + gleiches Datum + gleiches Konto
                  </li>
                  <li>
                    <strong>95% Übereinstimmung:</strong> Gleiche Belegnummer (aber unterschiedliche Buchungs-ID)
                  </li>
                  <li>
                    <strong>85% Übereinstimmung:</strong> Gleicher Text + Betrag + Datum innerhalb ±3 Tage
                  </li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Doppelbuchungen prüfen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Übersicht</strong></li>
                  <li>Klicken Sie auf "Doppelbuchungen prüfen"</li>
                  <li>Die App zeigt mögliche Duplikate in einer Liste</li>
                  <li>Prüfen Sie jedes Paar:
                    <ul>
                      <li><strong>"Ist keine Doppelbuchung":</strong> Markiert das Paar als geprüft (wird nicht mehr angezeigt)</li>
                      <li><strong>"Löschen":</strong> Löscht eine der beiden Buchungen (mit Bestätigung)</li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card id="buchung-erstellen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <CardTitle>Buchung erstellen/bearbeiten</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Buchungen können manuell erfasst oder über OCR-Texterkennung aus Belegen extrahiert werden.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Manuelle Buchung erstellen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Buchungen</strong> (Hauptseite)</li>
                  <li>Klicken Sie auf "Neue Buchung"</li>
                  <li>Füllen Sie alle erforderlichen Felder aus:
                    <ul>
                      <li><strong>Belegdatum:</strong> Datum des Belegs</li>
                      <li><strong>Belegnummer:</strong> Rechnungsnummer oder interne Nummer</li>
                      <li><strong>Geschäftspartner:</strong> Kreditor/Debitor (optional)</li>
                      <li><strong>Sachkonto:</strong> Aufwands-/Ertragskonto</li>
                      <li><strong>Nettobetrag:</strong> Betrag ohne MwSt.</li>
                      <li><strong>Steuersatz:</strong> 19%, 7%, 0%</li>
                      <li><strong>Bruttobetrag:</strong> Wird automatisch berechnet</li>
                      <li><strong>Buchungstext:</strong> Beschreibung</li>
                    </ul>
                  </li>
                  <li>Optional: Beleg-PDF hochladen</li>
                  <li>Klicken Sie auf "Speichern"</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">OCR-gestützte Erfassung:</h4>
                <ol className="space-y-2">
                  <li>Laden Sie ein Beleg-Bild (PDF, JPG, PNG) hoch</li>
                  <li>Die KI extrahiert automatisch:
                    <ul>
                      <li>Rechnungsdatum</li>
                      <li>Rechnungsnummer</li>
                      <li>Betrag (Netto, Brutto, Steuersatz)</li>
                      <li>Lieferantenname</li>
                      <li>IBAN, USt-IdNr.</li>
                    </ul>
                  </li>
                  <li>Prüfen und korrigieren Sie die erkannten Werte</li>
                  <li>Wählen Sie das passende Sachkonto</li>
                  <li>Speichern Sie die Buchung</li>
                </ol>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* ========== KONTOAUSZÜGE ========== */}
            <section id="auszuege-uebersicht" className="scroll-mt-20">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-teal-600" />
                    <CardTitle>Kontoauszüge - Übersicht</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Das Modul <strong>Kontoauszüge</strong> ermöglicht die zentrale Verwaltung und den Abgleich
                    von Bank-, Kreditkarten- und Zahlungsdienstleister-Auszügen mit Ihren Buchungen.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Import:</strong> PDF- oder CSV-Auszüge hochladen</li>
                    <li><strong>Automatische Erkennung:</strong> KI-gestützte Extraktion von Transaktionen</li>
                    <li><strong>Abgleich:</strong> Automatisches Matching mit bestehenden Buchungen</li>
                    <li><strong>Lücken-Erkennung:</strong> Fehlende Buchungen identifizieren</li>
                  </ul>

                  <h4 className="font-semibold mt-4 mb-2">Navigation:</h4>
                  <p>
                    Klicken Sie in der Hauptnavigation auf <strong>„Kontoauszüge"</strong> (zwischen Zahlungen und Kredite & Leasing).
                  </p>
                </CardContent>
              </Card>
            </section>

            <section id="auszuege-importieren" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auszüge importieren</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <h4 className="font-semibold mb-2">Schritt-für-Schritt:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Wählen Sie das <strong>Finanzkonto</strong> (Bank, Kreditkarte, etc.)</li>
                    <li>Klicken Sie auf <strong>„Auszug hochladen"</strong></li>
                    <li>Wählen Sie die Datei (PDF oder CSV)</li>
                    <li>Die KI extrahiert automatisch alle Transaktionen</li>
                    <li>Prüfen Sie die erkannten Buchungen</li>
                    <li>Bestätigen Sie den Import</li>
                  </ol>

                  <h4 className="font-semibold mt-4 mb-2">Unterstützte Formate:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>PDF:</strong> Kontoauszüge von allen gängigen Banken</li>
                    <li><strong>CSV:</strong> Export aus Online-Banking</li>
                    <li><strong>MT940:</strong> SWIFT-Format für Geschäftskonten</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section id="auszuege-abgleichen" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mit Buchungen abgleichen</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Nach dem Import werden die Auszugspositionen automatisch mit bestehenden Buchungen abgeglichen.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Abgleich-Status:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="text-green-600">✓ Abgeglichen:</span> Buchung gefunden und verknüpft</li>
                    <li><span className="text-yellow-600">⚠ Vorschlag:</span> Mögliche Buchung gefunden (zur Prüfung)</li>
                    <li><span className="text-red-600">✗ Offen:</span> Keine passende Buchung - neue Buchung erforderlich</li>
                  </ul>

                  <h4 className="font-semibold mt-4 mb-2">Neue Buchung aus Auszug erstellen:</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Klicken Sie auf eine offene Position</li>
                    <li>Wählen Sie „Buchung erstellen"</li>
                    <li>Das Formular wird mit den Auszugsdaten vorausgefüllt</li>
                    <li>Ergänzen Sie Gegenkonto und Steuersatz</li>
                    <li>Speichern Sie die Buchung</li>
                  </ol>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* ========== KREDITE & LEASING ========== */}
            <section id="finanzierungen-uebersicht" className="scroll-mt-20">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-teal-600" />
                    <CardTitle>Kredite & Leasing - Übersicht</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Verwalten Sie alle <strong>Finanzierungsverträge</strong> zentral: Kredite, Leasingverträge,
                    Mietkauf und Factoring. Die App berechnet automatisch Zahlungspläne und erstellt
                    Buchungsvorlagen für Ihre monatlichen Raten.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Unterstützte Vertragstypen:</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <strong className="text-blue-700">🏦 Kredit</strong>
                      <p className="text-sm text-slate-600 mt-1">Bankdarlehen, Betriebsmittelkredite, Investitionskredite</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <strong className="text-green-700">🚗 Leasing</strong>
                      <p className="text-sm text-slate-600 mt-1">Fahrzeuge, Maschinen, IT-Equipment</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <strong className="text-orange-700">🔑 Mietkauf</strong>
                      <p className="text-sm text-slate-600 mt-1">Anlagen mit Kaufoption</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <strong className="text-purple-700">📄 Factoring</strong>
                      <p className="text-sm text-slate-600 mt-1">Forderungsverkauf</p>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Statistik-Übersicht:</h4>
                  <p>Die Hauptseite zeigt Ihnen auf einen Blick:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Monatliche Belastung:</strong> Summe aller fälligen Raten</li>
                    <li><strong>Gesamtverbindlichkeiten:</strong> Offene Restschulden</li>
                    <li><strong>Aktive Verträge:</strong> Anzahl laufender Finanzierungen</li>
                  </ul>

                  <h4 className="font-semibold mt-4 mb-2">Navigation:</h4>
                  <p>
                    Klicken Sie in der Hauptnavigation auf <strong>„Kredite & Leasing"</strong>
                    (zwischen Kontoauszüge und Kalender).
                  </p>
                </CardContent>
              </Card>
            </section>

            <section id="vertrag-anlegen" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vertrag anlegen</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <h4 className="font-semibold mb-2">Manuell anlegen:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Klicken Sie auf <strong>„+ Neu anlegen"</strong></li>
                    <li>Wählen Sie den <strong>Vertragstyp</strong> (Kredit, Leasing, Mietkauf, Factoring)</li>
                    <li>Geben Sie die Vertragsdaten ein:
                      <ul className="list-disc pl-5 mt-1">
                        <li>Bezeichnung (z.B. „Sparkassen-Darlehen Betriebsmittel")</li>
                        <li>Vertragsnummer</li>
                        <li>Kreditgeber / Leasinggeber</li>
                        <li>Gesamtbetrag</li>
                        <li>Zinssatz (% p.a.)</li>
                        <li>Vertragsbeginn und -ende</li>
                        <li>Ratenbetrag und Zahlweise (monatlich/quartalsweise/etc.)</li>
                      </ul>
                    </li>
                    <li>Klicken Sie auf <strong>„Speichern"</strong></li>
                  </ol>

                  <div className="bg-teal-50 p-4 rounded-lg mt-4">
                    <strong className="text-teal-700">💡 Tipp:</strong>
                    <p className="text-sm mt-1">
                      Nutzen Sie die <strong>AI-Vertragsanalyse</strong> (siehe nächstes Kapitel), um das
                      Formular automatisch aus Ihrem Vertragsdokument auszufüllen!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="ai-vertragsanalyse" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>🤖 AI-Vertragsanalyse</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Die <strong>AI-Vertragsanalyse</strong> extrahiert automatisch alle relevanten Daten
                    aus Ihrem Vertragsdokument (PDF oder Bild).
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">So funktioniert's:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Klicken Sie auf <strong>„+ Neu anlegen"</strong></li>
                    <li>Im Dialog oben: <strong>„Datei auswählen"</strong> unter „AI-Vertragsanalyse"</li>
                    <li>Wählen Sie Ihr Vertragsdokument (PDF, JPG oder PNG)</li>
                    <li>Die KI analysiert den Vertrag und extrahiert:
                      <ul className="list-disc pl-5 mt-1">
                        <li>Vertragstyp (Kredit/Leasing/etc.)</li>
                        <li>Kreditgeber/Leasinggeber</li>
                        <li>Gesamtbetrag und Ratenbetrag</li>
                        <li>Zinssatz</li>
                        <li>Vertragslaufzeit (Beginn/Ende)</li>
                        <li>Vertragsnummer</li>
                        <li>Objektbezeichnung (bei Leasing)</li>
                      </ul>
                    </li>
                    <li>Das Formular wird automatisch ausgefüllt</li>
                    <li>Prüfen und ergänzen Sie die Daten bei Bedarf</li>
                    <li>Klicken Sie auf <strong>„Speichern"</strong></li>
                  </ol>

                  <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                    <strong className="text-yellow-700">⚠️ Hinweis:</strong>
                    <p className="text-sm mt-1">
                      Die KI-Erkennung ist sehr genau, aber prüfen Sie die extrahierten Werte
                      vor dem Speichern – besonders bei komplexen Vertragswerken.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="zahlungsplan" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Zahlungsplan</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Für jeden Finanzierungsvertrag kann ein <strong>Zahlungsplan</strong> generiert werden,
                    der alle fälligen Raten über die Vertragslaufzeit anzeigt.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Zahlungsplan generieren:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Öffnen Sie die Detailansicht eines Vertrags (auf Zeile klicken)</li>
                    <li>Klicken Sie auf <strong>„Zahlungsplan generieren"</strong></li>
                    <li>Die App berechnet alle Raten basierend auf:
                      <ul className="list-disc pl-5 mt-1">
                        <li>Ratenbetrag und Zahlweise</li>
                        <li>Vertragsbeginn und -ende</li>
                        <li>Fälligkeitstag im Monat</li>
                      </ul>
                    </li>
                  </ol>

                  <h4 className="font-semibold mt-4 mb-2">Zahlungsplan-Ansicht:</h4>
                  <p>Der Zahlungsplan zeigt für jede Rate:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Fälligkeitsdatum</strong></li>
                    <li><strong>Ratenbetrag</strong></li>
                    <li><strong>Status:</strong> Offen, Bezahlt, Überfällig</li>
                  </ul>

                  <h4 className="font-semibold mt-4 mb-2">Bei Krediten (Annuitätendarlehen):</h4>
                  <p>
                    Die App kann optional die <strong>Zins-/Tilgungs-Aufteilung</strong> berechnen,
                    wenn ein Zinssatz hinterlegt ist.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section id="buchungsintegration" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Buchungsintegration</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Verknüpfen Sie Ihre Finanzierungsverträge direkt mit der Buchhaltung durch
                    automatische <strong>Buchungsvorlagen</strong>.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Buchungsvorlage erstellen:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Öffnen Sie die Detailansicht eines Vertrags</li>
                    <li>Klicken Sie auf <strong>„Buchungsvorlage erstellen"</strong></li>
                    <li>Die Vorlage wird automatisch mit den richtigen SKR04-Konten erstellt</li>
                    <li>Nutzen Sie die Vorlage für die monatliche Ratenbuchung</li>
                  </ol>

                  <h4 className="font-semibold mt-4 mb-2">SKR04-Kontenzuordnung:</h4>
                  <table className="w-full text-sm border-collapse mt-2">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border p-2 text-left">Vertragstyp</th>
                        <th className="border p-2 text-left">Aufwandskonto</th>
                        <th className="border p-2 text-left">Verbindlichkeitskonto</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">Kredit</td>
                        <td className="border p-2">7300 Zinsaufwand</td>
                        <td className="border p-2">0650 Verbindl. Kreditinstitute</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Leasing</td>
                        <td className="border p-2">6520 Leasingaufwendungen</td>
                        <td className="border p-2">1576 Geleistete Anzahlungen</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Mietkauf</td>
                        <td className="border p-2">6310 Miete</td>
                        <td className="border p-2">0620 Verbindl. aus L&L</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Factoring</td>
                        <td className="border p-2">7380 Sonst. Finanzierungsaufw.</td>
                        <td className="border p-2">-</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <strong className="text-blue-700">💼 Workflow-Beispiel (Kredit):</strong>
                    <ol className="list-decimal pl-5 mt-2 text-sm">
                      <li>Kreditvertrag mit AI-Analyse hochladen</li>
                      <li>Zahlungsplan generieren lassen</li>
                      <li>Buchungsvorlage erstellen</li>
                      <li>Jeden Monat: Vorlage aufrufen → Buchung erstellen</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* ========== BUCHUNGSVORSCHLÄGE ========== */}
            <section id="vorschlaege-uebersicht" className="scroll-mt-20">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <CardTitle>Buchungsvorschläge - Übersicht</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Das Modul <strong>Buchungsvorschläge</strong> nutzt künstliche Intelligenz, um aus hochgeladenen
                    Belegen automatisch fertige Buchungen vorzuschlagen. Sie prüfen nur noch kurz die Daten und
                    akzeptieren die Buchung – die manuelle Eingabe entfällt.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Was macht das Modul?</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>AI-Beleganalyse:</strong> Extrahiert alle wichtigen Daten aus PDF/Bildern</li>
                    <li><strong>Kreditor-Matching:</strong> Erkennt Lieferanten anhand von IBAN und Name</li>
                    <li><strong>Automatische Kontierung:</strong> Schlägt passende Sachkonten vor</li>
                    <li><strong>Workflow-Unterstützung:</strong> Prüfen → Akzeptieren → Fertig</li>
                  </ul>

                  <h4 className="font-semibold mt-4 mb-2">Navigation:</h4>
                  <p>
                    Klicken Sie im Header auf <strong>„Mehr" → „Buchungsvorschläge"</strong> (unter Finanzen).
                  </p>

                  <div className="bg-green-50 p-4 rounded-lg mt-4">
                    <strong className="text-green-700">✨ Zeitersparnis:</strong>
                    <p className="text-sm mt-1">
                      Statt 3-5 Minuten pro Beleg verbringen Sie nur noch 10-20 Sekunden mit Prüfen und Klicken!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="vorschlaege-workflow" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow: Vorschlag → Buchung</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <h4 className="font-semibold mb-2">So funktioniert's:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Beleg hochladen:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Ziehen Sie PDF/Bild in die Upload-Zone auf der Buchungsseite</li>
                        <li>Oder fügen Sie einen Dropbox-Link ein (siehe Dropbox-Integration)</li>
                      </ul>
                    </li>
                    <li><strong>AI-Analyse läuft automatisch:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Extrahiert: Datum, Rechnungsnr., Betrag, Lieferant, IBAN, USt-ID</li>
                        <li>Matched Kreditor aus Stammdaten (via IBAN oder Name)</li>
                        <li>Erstellt Buchungsvorschlag mit Sachkonto</li>
                      </ul>
                    </li>
                    <li><strong>Vorschlag erscheint in Liste:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Status: "Vorschlag" (gelb markiert)</li>
                        <li>Alle Felder vorausgefüllt</li>
                        <li>Beleg-Vorschau rechts daneben</li>
                      </ul>
                    </li>
                    <li><strong>Prüfen & Akzeptieren:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Prüfen Sie die vorgeschlagenen Werte</li>
                        <li>Korrigieren Sie falls nötig (Sachkonto, Betrag, etc.)</li>
                        <li>Klicken Sie auf <strong>„Akzeptieren"</strong></li>
                      </ul>
                    </li>
                    <li><strong>Buchung wird erstellt:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Der Vorschlag wird zur fertigen Buchung</li>
                        <li>Beleg wird verknüpft und gespeichert</li>
                        <li>Status wechselt auf "Gebucht" (grün)</li>
                      </ul>
                    </li>
                  </ol>

                  <h4 className="font-semibold mt-4 mb-2">Alternative Aktionen:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Bearbeiten:</strong> Vorschlag öffnen und Felder manuell anpassen</li>
                    <li><strong>Ablehnen:</strong> Vorschlag löschen und manuell neu erfassen</li>
                  </ul>

                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <strong className="text-blue-700">💡 Tipp:</strong>
                    <p className="text-sm mt-1">
                      Nutzen Sie die <strong>Dropbox-Integration</strong>, um Belege direkt aus Ihrer Dropbox zu
                      verarbeiten – ohne manuellen Upload!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="kreditor-matching" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automatisches Kreditor-Matching</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Die AI erkennt Ihre Lieferanten automatisch anhand von <strong>IBAN</strong> und
                    <strong>Firmenname</strong> – und ordnet das richtige Personenkonto und Sachkonto zu.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Match-Typen:</h4>
                  <div className="space-y-2 mt-2">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <strong className="text-green-700">✓ Exakt-Match (IBAN):</strong>
                      <p className="text-sm mt-1">
                        Die IBAN auf dem Beleg stimmt mit einem Kreditor in den Stammdaten überein.
                        <br />
                        → Personenkonto, Name und Standard-Sachkonto werden automatisch übernommen.
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <strong className="text-yellow-700">≈ Partieller Match (Name):</strong>
                      <p className="text-sm mt-1">
                        Der Firmenname auf dem Beleg ähnelt einem Kreditor (z.B. "Telekom" → "Deutsche Telekom AG").
                        <br />
                        → Personenkonto wird vorgeschlagen, sollte geprüft werden.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <strong className="text-slate-700">✗ Kein Match:</strong>
                      <p className="text-sm mt-1">
                        Kreditor ist noch nicht in den Stammdaten angelegt.
                        <br />
                        → Personenkonto muss manuell eingegeben werden (oder Kreditor zuerst anlegen).
                      </p>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Vorteile:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Keine doppelte Erfassung von Lieferanten</li>
                    <li>Konsistente Kontierung durch Standard-Sachkonten</li>
                    <li>Schnellere Verarbeitung wiederkehrender Belege</li>
                  </ul>

                  <div className="bg-teal-50 p-4 rounded-lg mt-4">
                    <strong className="text-teal-700">🎯 Best Practice:</strong>
                    <p className="text-sm mt-1">
                      Pflegen Sie Ihre <strong>Kreditoren-Stammdaten</strong> sorgfältig:
                      IBAN und Standard-Sachkonto hinterlegen → maximale Automatisierung!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* ========== DROPBOX-INTEGRATION ========== */}
            <section id="dropbox-einrichten" className="scroll-mt-20">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-teal-600" />
                    <CardTitle>Dropbox-Integration - Einrichten</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Mit der <strong>Dropbox-Integration</strong> können Sie Belege direkt aus Ihrer Dropbox verarbeiten –
                    ohne manuelles Herunterladen und Hochladen. Einfach einen <strong>Shared Link</strong> einfügen,
                    fertig!
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Was Sie benötigen:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Einen <strong>Dropbox-Account</strong> (kostenlos oder kostenpflichtig)</li>
                    <li>Belege, die Sie in Dropbox gespeichert haben</li>
                    <li>Keine API-Tokens, keine OAuth-Einrichtung – es funktioniert mit <strong>einfachen Links</strong>!</li>
                  </ul>

                  <h4 className="font-semibold mt-4 mb-2">So geht's:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Navigieren Sie zu <strong>Mehr → Dropbox</strong> (unter „Finanzen")</li>
                    <li>Öffnen Sie Dropbox im Browser und suchen Sie die Beleg-Datei</li>
                    <li>Rechtsklick auf die Datei → <strong>„Link kopieren"</strong> oder <strong>„Freigeben"</strong></li>
                    <li>Fügen Sie den Link in das Eingabefeld ein (z.B. <code>https://www.dropbox.com/scl/fi/...</code>)</li>
                    <li>Klicken Sie auf <strong>„Verarbeiten"</strong></li>
                  </ol>

                  <div className="bg-green-50 p-4 rounded-lg mt-4">
                    <strong className="text-green-700">✨ Kein Setup nötig:</strong>
                    <p className="text-sm mt-1">
                      Im Gegensatz zu anderen Tools benötigt buchhaltung-ki.app <strong>keine App-Autorisierung</strong>
                      oder Zugriff auf Ihre Dropbox. Sie teilen nur einzelne Dateien via Link!
                    </p>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Unterstützte Link-Typen:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Shared Links:</strong> <code>https://www.dropbox.com/scl/fi/...</code></li>
                    <li><strong>Direkte Links:</strong> <code>https://dl.dropboxusercontent.com/...</code></li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section id="dropbox-verarbeitung" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automatische Verarbeitung</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Nachdem Sie einen Dropbox-Link eingefügt haben, läuft die Verarbeitung vollautomatisch ab:
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Ablauf:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Download:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Die App lädt die Datei von Dropbox herunter</li>
                        <li>Unterstützt: PDF, JPG, PNG</li>
                      </ul>
                    </li>
                    <li><strong>Upload:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Die Datei wird in Ihr Belegarchiv hochgeladen</li>
                        <li>Dateiname wird übernommen</li>
                      </ul>
                    </li>
                    <li><strong>AI-Analyse:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Claude AI extrahiert alle relevanten Daten</li>
                        <li>Datum, Rechnungsnr., Betrag, Lieferant, IBAN, USt-ID</li>
                      </ul>
                    </li>
                    <li><strong>Kreditor-Matching:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Automatische Zuordnung zu bestehendem Kreditor</li>
                        <li>Personenkonto und Sachkonto werden gesetzt</li>
                      </ul>
                    </li>
                    <li><strong>Buchungsvorschlag erstellen:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Ein fertiger Buchungsvorschlag erscheint auf der Buchungsseite</li>
                        <li>Status: "Vorschlag" → Sie müssen nur noch prüfen und akzeptieren</li>
                      </ul>
                    </li>
                  </ol>

                  <h4 className="font-semibold mt-4 mb-2">Ergebnis:</h4>
                  <p>
                    Der Buchungsvorschlag ist nun auf der <Link href="/" className="text-teal-600 hover:underline">
                    Buchungsseite</Link> sichtbar. Sie können ihn dort prüfen, ggf. anpassen und akzeptieren.
                  </p>

                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <strong className="text-blue-700">⚡ Workflow-Beispiel:</strong>
                    <ol className="list-decimal pl-5 mt-2 text-sm space-y-1">
                      <li>Rechnung kommt per E-Mail → in Dropbox speichern</li>
                      <li>Dropbox-Link kopieren → in buchhaltung-ki.app einfügen</li>
                      <li>AI erstellt Buchungsvorschlag automatisch</li>
                      <li>Buchungsseite öffnen → Vorschlag prüfen → Akzeptieren → Fertig!</li>
                    </ol>
                    <p className="text-sm mt-2 text-blue-600">
                      <strong>Zeitersparnis:</strong> Von 5 Minuten auf 30 Sekunden pro Beleg! 🚀
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* ========== ELSTER UST-VORANMELDUNG ========== */}
            <section id="elster-uebersicht" className="scroll-mt-20">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-teal-600" />
                    <CardTitle>ELSTER USt-Voranmeldung - Übersicht</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Das Modul <strong>ELSTER USt-Voranmeldung</strong> ermöglicht deutschen Unternehmen die automatische
                    Berechnung der Umsatzsteuer-Voranmeldung aus ihren SKR04-Buchungen – mit XML-Export für ELSTER.
                  </p>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <strong>Nur für deutsche Firmen:</strong> Dieses Modul ist nur für Unternehmen mit
                        <strong> Ländercode = DE</strong> verfügbar. Für Schweizer Firmen verwenden Sie
                        die <Link href="/mwst-abrechnung" className="text-teal-600 hover:underline">MWST-Quartalsabrechnung</Link>.
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Automatische Berechnung:</strong> Kennzahlen (KZ 81, 86, 66, etc.) werden aus Buchungen ermittelt</li>
                    <li><strong>SKR04-Mapping:</strong> Konten werden automatisch den richtigen Kennzahlen zugeordnet</li>
                    <li><strong>Monat oder Quartal:</strong> Flexibel wählbar je nach Ihrer Abgabepflicht</li>
                    <li><strong>XML-Export:</strong> ERiC-kompatibles XML für Upload in Mein ELSTER</li>
                    <li><strong>Testmodus:</strong> Prüfung ohne echte Abgabe</li>
                  </ul>

                  <h4 className="font-semibold mt-4 mb-2">Navigation:</h4>
                  <p>
                    Klicken Sie im Header auf <strong>„Mehr" → „USt-Voranmeldung"</strong> (unter „Behörden")
                    oder gehen Sie zu <Link href="/finanzamt/ustva" className="text-teal-600 hover:underline">
                    /finanzamt/ustva</Link>.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">Voraussetzungen:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Ihre Firma muss auf <strong>SKR04</strong> basieren (wird automatisch geprüft)</li>
                    <li>Buchungen müssen korrekt kontiert sein</li>
                    <li>Steuernummer muss in den Firmenstammdaten hinterlegt sein</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section id="elster-berechnung" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kennzahlen berechnen</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <h4 className="font-semibold mb-2">Schritt-für-Schritt:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Navigieren Sie zu <strong>USt-Voranmeldung</strong></li>
                    <li>Wählen Sie das <strong>Jahr</strong> (z.B. 2025)</li>
                    <li>Wählen Sie den <strong>Zeitraum</strong>:
                      <ul className="list-disc pl-5 mt-1">
                        <li><strong>Monat:</strong> 01-12 (für monatliche Abgabe)</li>
                        <li><strong>Quartal:</strong> Q1-Q4 (für quartalsweise Abgabe)</li>
                      </ul>
                    </li>
                    <li>Aktivieren Sie <strong>Testmodus</strong>, wenn Sie nur prüfen möchten (empfohlen beim ersten Mal)</li>
                    <li>Klicken Sie auf <strong>„Kennzahlen berechnen"</strong></li>
                  </ol>

                  <h4 className="font-semibold mt-4 mb-2">Die App berechnet automatisch:</h4>
                  <table className="w-full text-sm border-collapse mt-2">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border p-2 text-left">Kennzahl</th>
                        <th className="border p-2 text-left">Beschreibung</th>
                        <th className="border p-2 text-left">SKR04-Konten</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2"><strong>KZ 81</strong></td>
                        <td className="border p-2">Umsätze 19% (netto)</td>
                        <td className="border p-2">4000, 4100, 4110, 4120, 4200</td>
                      </tr>
                      <tr>
                        <td className="border p-2"><strong>KZ 86</strong></td>
                        <td className="border p-2">Umsätze 7% (netto)</td>
                        <td className="border p-2">4300, 4310, 4320</td>
                      </tr>
                      <tr>
                        <td className="border p-2"><strong>KZ 66</strong></td>
                        <td className="border p-2">Abziehbare Vorsteuer</td>
                        <td className="border p-2">1400, 1401, 1405, 1406, 1576</td>
                      </tr>
                      <tr>
                        <td className="border p-2"><strong>KZ 35</strong></td>
                        <td className="border p-2">Steuerfreie Umsätze</td>
                        <td className="border p-2">4125, 4126</td>
                      </tr>
                      <tr>
                        <td className="border p-2"><strong>KZ 21</strong></td>
                        <td className="border p-2">EU-Lieferungen steuerfrei</td>
                        <td className="border p-2">4125 (mit EU-Länder-Erkennung)</td>
                      </tr>
                      <tr>
                        <td className="border p-2"><strong>KZ 83</strong></td>
                        <td className="border p-2">Vorauszahlung (USt - VSt)</td>
                        <td className="border p-2">(berechnet)</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 className="font-semibold mt-4 mb-2">Ergebnis-Anzeige:</h4>
                  <p>Die berechneten Kennzahlen werden in einer übersichtlichen Tabelle angezeigt, inkl.:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Umsätze (netto)</li>
                    <li>Steuerbeträge (19%, 7%)</li>
                    <li>Vorsteuer</li>
                    <li>Vorauszahlung (kann negativ sein = Erstattung)</li>
                  </ul>

                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <strong className="text-blue-700">💡 Tipp:</strong>
                    <p className="text-sm mt-1">
                      Prüfen Sie die Kennzahlen auf Plausibilität, bevor Sie das XML exportieren!
                      Stimmen die Umsätze mit Ihren Erwartungen überein?
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="elster-xml" className="scroll-mt-20 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>XML-Export für ELSTER</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate max-w-none">
                  <p>
                    Nachdem Sie die Kennzahlen berechnet und geprüft haben, können Sie ein
                    <strong> ERiC-kompatibles XML</strong> generieren, das Sie in <strong>Mein ELSTER</strong> hochladen.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">XML generieren:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Klicken Sie auf <strong>„XML generieren"</strong></li>
                    <li>Wählen Sie <strong>Testmodus</strong> für erste Tests (empfohlen)</li>
                    <li>Die Datei wird generiert: <code>UStVA_[Firma]_[Jahr]_[Zeitraum].xml</code></li>
                    <li>Laden Sie die Datei herunter</li>
                  </ol>

                  <h4 className="font-semibold mt-4 mb-2">Upload in Mein ELSTER:</h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Loggen Sie sich in <a href="https://www.elster.de" target="_blank" rel="noopener" className="text-teal-600 hover:underline">Mein ELSTER</a> ein</li>
                    <li>Navigieren Sie zu <strong>„Alle Formulare" → „Umsatzsteuer-Voranmeldung"</strong></li>
                    <li>Wählen Sie <strong>„Datenübertragung mit authentifizierter Versendung"</strong></li>
                    <li>Laden Sie die XML-Datei hoch</li>
                    <li>ELSTER prüft die Datei und zeigt eine Vorschau</li>
                    <li>Bestätigen Sie die Übermittlung</li>
                  </ol>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <strong>Wichtig:</strong> Das XML-Format ist kompatibel mit dem ELSTER-System, aber die
                        <strong> tatsächliche Übermittlung</strong> erfolgt über Mein ELSTER. buchhaltung-ki.app
                        übermittelt nicht direkt an das Finanzamt.
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Testmodus vs. Echtmodus:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Testmodus:</strong> XML enthält Testmerker (Code: 700000004) → ELSTER akzeptiert die
                      Übermittlung, speichert sie aber nicht ab. Ideal zum Testen!</li>
                    <li><strong>Echtmodus:</strong> Echte Übermittlung ans Finanzamt (Code: 000000000) →
                      Nur verwenden, wenn Sie sicher sind!</li>
                  </ul>

                  <div className="bg-green-50 p-4 rounded-lg mt-4">
                    <strong className="text-green-700">✅ Best Practice:</strong>
                    <ol className="list-decimal pl-5 mt-2 text-sm space-y-1">
                      <li>Erste USt-VA: <strong>Testmodus</strong> verwenden und in ELSTER prüfen</li>
                      <li>Kennzahlen mit Ihrem Steuerberater/Finanzamt abgleichen</li>
                      <li>Wenn alles stimmt: <strong>Echtmodus</strong> verwenden für echte Abgabe</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            {/* DATEV Integration */}
            <Card id="datev-import">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-teal-600" />
                  <CardTitle>DATEV Import</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Importieren Sie bestehende Buchhaltungsdaten aus DATEV-Exporten (GDPdU-Format).
                </p>
                <h4 className="font-semibold mt-4 mb-2">DATEV-Export importieren:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>DATEV Import</strong></li>
                  <li>Wählen Sie die Firma aus</li>
                  <li>Laden Sie die ZIP-Datei hoch (z.B. <code>download_krwe_22593_28245_20260115.zip</code>)</li>
                  <li>Die App erkennt automatisch:
                    <ul>
                      <li><strong>Sachkonten:</strong> SKR04-Konten</li>
                      <li><strong>Kreditoren/Debitoren:</strong> Geschäftspartner</li>
                      <li><strong>Buchungen:</strong> Historische Buchungssätze</li>
                    </ul>
                  </li>
                  <li>Klicken Sie auf "Import starten"</li>
                  <li>Die App importiert die Daten (Dauer: einige Sekunden bis Minuten)</li>
                </ol>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Hinweis:</strong> Der Import erkennt automatisch Dubletten und überspringt bereits importierte Daten.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="datev-export">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-teal-600" />
                  <CardTitle>DATEV Export</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Exportieren Sie Ihre Buchungsdaten im DATEV-Format für Ihren Steuerberater.
                </p>
                <h4 className="font-semibold mt-4 mb-2">DATEV-Export erstellen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Übersicht</strong> oder <strong>Steuerberater</strong></li>
                  <li>Klicken Sie auf "DATEV Export"</li>
                  <li>Wählen Sie den Zeitraum (Monat/Jahr)</li>
                  <li>Klicken Sie auf "Export starten"</li>
                  <li>Die App erstellt eine ZIP-Datei mit:
                    <ul>
                      <li><strong>EXTF_Buchungsstapel.csv:</strong> Buchungssätze</li>
                      <li><strong>EXTF_Sachkontenbeschriftungen.csv:</strong> Kontenplan</li>
                      <li><strong>EXTF_Kreditoren.csv / EXTF_Debitoren.csv:</strong> Geschäftspartner</li>
                    </ul>
                  </li>
                  <li>Laden Sie die ZIP-Datei herunter</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">Export an Steuerberater senden:</h4>
                <p>
                  Alternativ können Sie den Export direkt über die Steuerberater-Seite versenden (inkl. Übergabeprotokoll).
                </p>
              </CardContent>
            </Card>

            <Card id="dateiformate">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  <CardTitle>Unterstützte Dateiformate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <h4 className="font-semibold mb-2">Import:</h4>
                <ul className="space-y-1">
                  <li>DATEV GDPdU ZIP-Archive</li>
                  <li>DATEV CSV-Dateien (latin-1, semicolon delimiter)</li>
                  <li>Excel/CSV für Stammdaten (Sachkonten, Kreditoren, Debitoren)</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Export:</h4>
                <ul className="space-y-1">
                  <li>DATEV ASCII (EXTF-Format)</li>
                  <li>CSV (für Excel)</li>
                  <li>PDF (Berichte, Auswertungen)</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Belege:</h4>
                <ul className="space-y-1">
                  <li>PDF (empfohlen)</li>
                  <li>JPG, PNG (Fotos von Belegen)</li>
                  <li>TIFF, GIF</li>
                </ul>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Berichte & Auswertungen */}
            <Card id="bwa">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <CardTitle>BWA (Betriebswirtschaftliche Auswertung)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die BWA zeigt die wichtigsten betriebswirtschaftlichen Kennzahlen Ihres Unternehmens in übersichtlicher Form.
                </p>
                <h4 className="font-semibold mt-4 mb-2">BWA aufrufen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Kennzahlen</strong></li>
                  <li>Wählen Sie den Zeitraum (Monat/Jahr)</li>
                  <li>Die BWA wird automatisch berechnet und angezeigt</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">BWA-Bestandteile:</h4>
                <ul className="space-y-1">
                  <li><strong>Gesamtleistung:</strong> Umsatzerlöse + Bestandsveränderungen</li>
                  <li><strong>Material- und Warenaufwand:</strong> Einkaufskosten</li>
                  <li><strong>Rohertrag:</strong> Gesamtleistung - Materialaufwand</li>
                  <li><strong>Personalkosten:</strong> Löhne, Gehälter, soziale Abgaben</li>
                  <li><strong>Sonstige betriebliche Aufwendungen:</strong> Miete, Marketing, etc.</li>
                  <li><strong>EBITDA:</strong> Gewinn vor Zinsen, Steuern, Abschreibungen</li>
                  <li><strong>EBIT:</strong> Betriebsergebnis</li>
                  <li><strong>Jahresüberschuss/-fehlbetrag:</strong> Gewinn/Verlust</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Export:</h4>
                <p>
                  Die BWA kann als PDF exportiert werden (Button "BWA herunterladen").
                </p>
              </CardContent>
            </Card>

            <Card id="kennzahlen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  <CardTitle>Kennzahlen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die Kennzahlen-Seite zeigt wichtige Finanzkennzahlen in Echtzeit.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Verfügbare Kennzahlen:</h4>
                <div className="grid grid-cols-2 gap-3 not-prose mt-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold">Umsatz</div>
                    <div className="text-xs text-slate-500">Gesamtumsatz im gewählten Zeitraum</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold">Gewinn/Verlust</div>
                    <div className="text-xs text-slate-500">Jahresüberschuss/-fehlbetrag</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold">Liquidität</div>
                    <div className="text-xs text-slate-500">Verfügbare Geldmittel</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold">Offene Forderungen</div>
                    <div className="text-xs text-slate-500">Ausstehende Debitorenzahlungen</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold">Offene Verbindlichkeiten</div>
                    <div className="text-xs text-slate-500">Ausstehende Kreditorenzahlungen</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-semibold">EBITDA</div>
                    <div className="text-xs text-slate-500">Operative Ertragskraft</div>
                  </div>
                </div>
                <h4 className="font-semibold mt-4 mb-2">Diagramme:</h4>
                <p>
                  Die Kennzahlen werden auch grafisch dargestellt (Umsatzverlauf, Gewinnentwicklung, Liquiditätstrend).
                </p>
              </CardContent>
            </Card>

            <Card id="uebersicht-berichte">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <CardTitle>Übersicht</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die Übersicht-Seite zeigt alle Buchungen und bietet schnelle Filtermöglichkeiten sowie Export-Funktionen.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                <ul className="space-y-1">
                  <li>Buchungsliste mit Sortierung und Filterung</li>
                  <li>Export als CSV oder PDF</li>
                  <li>DATEV-Export für Steuerberater</li>
                  <li>Statistiken (Anzahl Buchungen, Gesamtbetrag, etc.)</li>
                </ul>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Weitere Module */}
            <Card id="kalender">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <CardTitle>Kalender</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Der Kalender zeigt wichtige Termine und Fristen (Steuerzahlungen, Kündigungsfristen, Ablauf von Verträgen).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                <ul className="space-y-1">
                  <li>Monats- und Jahresansicht</li>
                  <li>Automatische Erinnerungen für Fristen</li>
                  <li>Verknüpfung mit Aufgaben</li>
                  <li>Export als iCal (für Outlook, Google Calendar)</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="zahlungen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  <CardTitle>Zahlungen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Das Zahlungsmodul verwaltet offene Posten (Forderungen und Verbindlichkeiten) und Zahlungseingänge/-ausgänge.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                <ul className="space-y-1">
                  <li>Offene Forderungen (Debitoren)</li>
                  <li>Offene Verbindlichkeiten (Kreditoren)</li>
                  <li>Zahlungserinnerungen</li>
                  <li>Mahnwesen (1. Mahnung, 2. Mahnung, Inkasso)</li>
                  <li>Zahlungsabgleich (Bank-Matching)</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="lager">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  <CardTitle>Lager</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die Lagerverwaltung ermöglicht die Verwaltung von Artikeln, Beständen und Inventuren.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Module:</h4>
                <ul className="space-y-1">
                  <li><strong>Artikel:</strong> Stammdaten für Produkte und Dienstleistungen</li>
                  <li><strong>Bestandsübersicht:</strong> Aktuelle Lagerbestände</li>
                  <li><strong>Inventur:</strong> Physische Bestandsaufnahme</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Artikel anlegen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Lager → Artikel</strong></li>
                  <li>Klicken Sie auf "Neuer Artikel"</li>
                  <li>Füllen Sie die Felder aus (Artikelnummer, Name, EAN, Einkaufspreis, Verkaufspreis, etc.)</li>
                  <li>Speichern Sie den Artikel</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="notizen">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-teal-600" />
                  <CardTitle>Notizen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Das Notizen-Modul ermöglicht interne Notizen und Kommentare zu Buchungen, Kunden, Lieferanten, etc.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Notiz erstellen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Notizen</strong></li>
                  <li>Klicken Sie auf "Neue Notiz"</li>
                  <li>Geben Sie Titel und Text ein</li>
                  <li>Optional: Verknüpfen Sie die Notiz mit einer Buchung oder einem Geschäftspartner</li>
                  <li>Speichern Sie die Notiz</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="finanzamt">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-teal-600" />
                  <CardTitle>Finanzamt</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Das Finanzamt-Modul unterstützt bei der Erstellung von Umsatzsteuer-Voranmeldungen (UStVA) und anderen Steuermeldungen.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                <ul className="space-y-1">
                  <li>Automatische Berechnung der Umsatzsteuer</li>
                  <li>UStVA-Vorschau (nach Kennziffern)</li>
                  <li>Export für ELSTER</li>
                  <li>Zusammenfassende Meldung (ZM) für innergemeinschaftliche Lieferungen</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Hinweis:</strong> Die tatsächliche Übermittlung an das Finanzamt erfolgt über ELSTER. Die App bereitet die Daten nur vor.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="steuerberater">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-teal-600" />
                  <CardTitle>Steuerberater</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Das Steuerberater-Modul ermöglicht die digitale Zusammenarbeit mit Ihrem Steuerberater.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                <ul className="space-y-1">
                  <li>DATEV-Export direkt an Steuerberater senden</li>
                  <li>Übergabeprotokoll (welche Belege wurden übergeben)</li>
                  <li>Chat/Nachrichten mit Steuerberater</li>
                  <li>Rückfragen und Feedback vom Steuerberater</li>
                  <li>Status-Tracking (z.B. "In Bearbeitung", "Abgeschlossen")</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Daten an Steuerberater übergeben:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Steuerberater</strong></li>
                  <li>Wählen Sie den Zeitraum (Monat/Jahr)</li>
                  <li>Klicken Sie auf "An Steuerberater übergeben"</li>
                  <li>Die App erstellt automatisch:
                    <ul>
                      <li>DATEV-Export (ZIP)</li>
                      <li>Übergabeprotokoll (PDF)</li>
                      <li>Liste der Belege</li>
                    </ul>
                  </li>
                  <li>Senden Sie die Übergabe per E-Mail oder laden Sie die Datei herunter</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="aufgaben">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-teal-600" />
                  <CardTitle>Aufgaben</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Das Aufgaben-Modul ist eine To-Do-Liste für buchhaltungsbezogene Aufgaben.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                <ul className="space-y-1">
                  <li>Aufgaben erstellen, bearbeiten, löschen</li>
                  <li>Status: Offen, In Bearbeitung, Erledigt</li>
                  <li>Fälligkeitsdatum und Priorität</li>
                  <li>Zuordnung zu Benutzern (bei Team-Accounts)</li>
                  <li>Erinnerungen</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Aufgabe erstellen:</h4>
                <ol className="space-y-2">
                  <li>Navigieren Sie zu <strong>Aufgaben</strong></li>
                  <li>Klicken Sie auf "Neue Aufgabe"</li>
                  <li>Geben Sie Titel, Beschreibung, Fälligkeit und Priorität ein</li>
                  <li>Speichern Sie die Aufgabe</li>
                </ol>
              </CardContent>
            </Card>

            {/* Support & Kontakt */}
            <Separator className="my-8" />

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  <CardTitle>Support & Kontakt</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Haben Sie Fragen oder benötigen Sie Unterstützung? Wir helfen Ihnen gerne weiter!
                </p>
                <div className="grid grid-cols-2 gap-4 not-prose mt-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="font-semibold mb-2">E-Mail Support</div>
                    <a href="mailto:support@buchhaltung-ki.app" className="text-teal-600 hover:underline">
                      support@buchhaltung-ki.app
                    </a>
                    <div className="text-xs text-slate-500 mt-2">Antwortzeit: 24h (werktags)</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="font-semibold mb-2">Dokumentation</div>
                    <a href="https://docs.buchhaltung-ki.app" className="text-teal-600 hover:underline">
                      docs.buchhaltung-ki.app
                    </a>
                    <div className="text-xs text-slate-500 mt-2">Ausführliche Anleitungen & FAQs</div>
                  </div>
                </div>
                <h4 className="font-semibold mt-6 mb-2">Für Steuerberater:</h4>
                <p>
                  Sind Sie Steuerberater und betreuen Mandanten, die buchhaltung-ki.app nutzen?
                  Unser <Link href="/steuerberater-handbuch" className="text-teal-600 hover:underline font-semibold">Steuerberater-Handbuch</Link> erklärt
                  die DATEV-Schnittstelle, Datenübergabe und Zusammenarbeit im Detail.
                </p>
                <h4 className="font-semibold mt-6 mb-2">Technische Informationen:</h4>
                <ul className="space-y-1">
                  <li><strong>Hosting:</strong> Railway (EU-Datacenter, GDPR-konform)</li>
                  <li><strong>Sicherheit:</strong> SSL/TLS-Verschlüsselung, regelmäßige Backups</li>
                  <li><strong>Verfügbarkeit:</strong> 99.9% Uptime-Garantie</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
