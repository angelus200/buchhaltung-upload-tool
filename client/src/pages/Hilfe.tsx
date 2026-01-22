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
  Calculator
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
