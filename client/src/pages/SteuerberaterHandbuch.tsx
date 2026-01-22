import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Building2,
  FileSpreadsheet,
  Download,
  Upload,
  Database,
  FileText,
  CheckCircle2,
  Info,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Users,
  Calendar,
  BarChart3,
  Send,
  Mail,
  Phone,
  FileCheck,
  Lock,
  Shield,
  Printer,
  Globe,
  Clock,
  TrendingUp,
  Calculator,
  Briefcase,
  Archive,
  FolderOpen,
  Settings,
  BookTemplate
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
    id: "einfuehrung",
    titel: "Einführung",
    icon: BookOpen,
    unterkapitel: [
      { id: "was-ist", titel: "Was ist buchhaltung-ki.app?" },
      { id: "vorteile", titel: "Vorteile der Zusammenarbeit" },
      { id: "rollenverteilung", titel: "Rollenverteilung" },
    ],
  },
  {
    id: "datev",
    titel: "DATEV-Schnittstelle",
    icon: FileSpreadsheet,
    unterkapitel: [
      { id: "formate", titel: "Unterstützte DATEV-Formate" },
      { id: "kontenrahmen", titel: "Kontenrahmen SKR04" },
      { id: "buchungsstapel", titel: "Buchungsstapel exportieren" },
      { id: "stammdaten", titel: "Stammdaten synchronisieren" },
    ],
  },
  {
    id: "uebergabe-vom-mandanten",
    titel: "Datenübergabe vom Mandanten",
    icon: Download,
    unterkapitel: [
      { id: "export-prozess", titel: "Export-Prozess" },
      { id: "dateien", titel: "Erhaltene Dateien" },
      { id: "zeitraeume", titel: "Zeiträume & Geschäftsjahre" },
    ],
  },
  {
    id: "uebergabe-an-mandanten",
    titel: "Datenübergabe an den Mandanten",
    icon: Upload,
    unterkapitel: [
      { id: "import-prozess", titel: "Import-Prozess" },
      { id: "korrekturen", titel: "Buchungskorrekturen" },
      { id: "jahresabschluss", titel: "Jahresabschluss-Buchungen" },
    ],
  },
  {
    id: "kontenzuordnung",
    titel: "Kontenzuordnung",
    icon: Database,
    unterkapitel: [
      { id: "skr04", titel: "SKR04 Kontenrahmen" },
      { id: "kontenklassen", titel: "Kontenklassen 0-9 Übersicht" },
      { id: "klassifizierung", titel: "Automatische Klassifizierung" },
    ],
  },
  {
    id: "belege",
    titel: "Belege & Dokumentation",
    icon: FileText,
    unterkapitel: [
      { id: "belegablage", titel: "Belegablage in der App" },
      { id: "ocr", titel: "OCR-Verarbeitung" },
      { id: "verknuepfung", titel: "Belegverknüpfung" },
      { id: "aufbewahrung", titel: "Aufbewahrungsfristen" },
    ],
  },
  {
    id: "jahresabschluss-kapitel",
    titel: "Jahresabschluss",
    icon: Calculator,
    unterkapitel: [
      { id: "bwa", titel: "BWA-Berichte" },
      { id: "anlagenspiegel", titel: "Anlagenspiegel" },
      { id: "forderungen", titel: "Forderungen/Verbindlichkeiten" },
      { id: "abstimmung", titel: "Abstimmung mit Steuerberater" },
    ],
  },
  {
    id: "faq",
    titel: "Häufige Fragen (FAQ)",
    icon: HelpCircle,
  },
  {
    id: "kontakt",
    titel: "Kontakt & Support",
    icon: Mail,
  },
];

export default function SteuerberaterHandbuch() {
  const [activeKapitel, setActiveKapitel] = useState<string>("einfuehrung");
  const [activeUnterkapitel, setActiveUnterkapitel] = useState<string>("was-ist");

  const scrollToSection = (unterkapitelId: string) => {
    setActiveUnterkapitel(unterkapitelId);
    const element = document.getElementById(unterkapitelId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header für öffentliche Seite (ohne AppHeader) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 print:hidden">
        <div className="h-1 w-full bg-gradient-to-r from-teal-600 to-blue-600" />
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">buchhaltung-ki.app</h1>
                  <p className="text-xs text-slate-500">Steuerberater-Handbuch</p>
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Drucken / PDF
              </Button>
              <Link href="/login">
                <Button variant="default" size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700">
                  <Shield className="w-4 h-4" />
                  Zum Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Print Header */}
      <div className="hidden print:block p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-600 to-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">buchhaltung-ki.app</h1>
            <p className="text-slate-600">Handbuch für Steuerberater & Kanzleien</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Ausgedruckt am {new Date().toLocaleDateString("de-DE")}</p>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3 print:hidden">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BookTemplate className="w-5 h-5 text-teal-600" />
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
                          } else {
                            scrollToSection(kapitel.id);
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
          <div className="col-span-12 print:col-span-12 lg:col-span-9 space-y-6">
            {/* Hero Section */}
            <Card className="bg-gradient-to-br from-teal-600 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="text-3xl">Handbuch für Steuerberater & Kanzleien</CardTitle>
                <CardDescription className="text-teal-50 text-base">
                  Digitale Zusammenarbeit mit Mandanten über buchhaltung-ki.app
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-teal-50 mb-4">
                  Dieses Handbuch erklärt, wie Sie als Steuerberater oder Kanzlei mit Mandanten zusammenarbeiten,
                  die buchhaltung-ki.app nutzen. Erfahren Sie, wie Sie DATEV-Daten austauschen, Belege prüfen
                  und den Jahresabschluss effizient durchführen.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-white/20 rounded-full text-sm">DATEV-kompatibel</div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-sm">SKR04</div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-sm">GDPdU-Export</div>
                  <div className="px-3 py-1 bg-white/20 rounded-full text-sm">Digitale Belege</div>
                </div>
              </CardContent>
            </Card>

            {/* Einführung */}
            <Card id="was-ist" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-600" />
                  <CardTitle>Was ist buchhaltung-ki.app?</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  <strong>buchhaltung-ki.app</strong> ist eine moderne, cloud-basierte Buchhaltungssoftware für kleine und mittlere Unternehmen
                  mit vollständiger DATEV-Integration. Die App richtet sich an Mandanten, die ihre Buchhaltung selbst erfassen
                  und die Daten anschließend digital an ihren Steuerberater übergeben möchten.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Kernfunktionen:</h4>
                <ul className="space-y-1">
                  <li>✅ Digitale Belegerfassung mit KI-gestützter Texterkennung (OCR)</li>
                  <li>✅ DATEV-Import & Export (GDPdU-kompatibel)</li>
                  <li>✅ SKR04-Kontenrahmen (Deutschland)</li>
                  <li>✅ Automatische Kontenzuordnung</li>
                  <li>✅ Echtzeit-BWA und Kennzahlen</li>
                  <li>✅ Digitaler Datenaustausch mit Steuerberater</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Technische Basis:</h4>
                <ul className="space-y-1">
                  <li><strong>Hosting:</strong> Railway (EU-Datacenter, GDPR-konform)</li>
                  <li><strong>Datenbank:</strong> MySQL mit Drizzle ORM</li>
                  <li><strong>Sicherheit:</strong> SSL/TLS-Verschlüsselung, tägliche Backups</li>
                  <li><strong>Verfügbarkeit:</strong> 99.9% Uptime</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="vorteile" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  <CardTitle>Vorteile der Zusammenarbeit</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die digitale Zusammenarbeit über buchhaltung-ki.app bietet erhebliche Effizienzgewinne für beide Seiten:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Für Steuerberater & Kanzleien:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div className="font-semibold">Zeitersparnis</div>
                    </div>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li>• Keine Belegstapel mehr durchsuchen</li>
                      <li>• Weniger Rückfragen an Mandanten</li>
                      <li>• Direkt DATEV-Import möglich</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div className="font-semibold">Qualität & Vollständigkeit</div>
                    </div>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li>• Strukturierte Datenübergabe</li>
                      <li>• Alle Belege digital archiviert</li>
                      <li>• Korrekte Kontenzuordnung</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <div className="font-semibold">Beratungsqualität</div>
                    </div>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li>• Echtzeit-Einblick in Mandantendaten</li>
                      <li>• Frühzeitige Erkennung von Problemen</li>
                      <li>• Bessere betriebswirtschaftliche Beratung</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="w-5 h-5 text-amber-600" />
                      <div className="font-semibold">Compliance</div>
                    </div>
                    <ul className="text-sm space-y-1 text-slate-700">
                      <li>• GoBD-konforme Archivierung</li>
                      <li>• Revisionssichere Belege</li>
                      <li>• Nachvollziehbare Buchungen</li>
                    </ul>
                  </div>
                </div>
                <h4 className="font-semibold mt-4 mb-2">Für Mandanten:</h4>
                <ul className="space-y-1">
                  <li>• Einfache digitale Belegerfassung (auch per Smartphone)</li>
                  <li>• Automatische Kontenzuordnung durch KI</li>
                  <li>• Ständiger Überblick über BWA und Liquidität</li>
                  <li>• Weniger Aufwand bei der Datenübergabe</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="rollenverteilung" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <CardTitle>Rollenverteilung</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Eine klare Aufgabenteilung zwischen Mandant und Steuerberater ist entscheidend für eine effiziente Zusammenarbeit:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mt-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      Mandant (Unternehmer)
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Belege erfassen:</strong> Eingangsrechnungen, Ausgangsrechnungen, Kassenbelege digital hochladen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Vorkontierung:</strong> Sachkonten zuordnen (mit KI-Unterstützung)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Bankbuchungen:</strong> Optional: Kontoauszüge zuordnen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Datenexport:</strong> Monatlich oder quartalsweise DATEV-Export erstellen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Rückfragen beantworten:</strong> Fehlende Informationen nachreichen</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Steuerberater
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Daten importieren:</strong> DATEV-Export vom Mandanten in eigene Software einlesen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Prüfung & Korrektur:</strong> Buchungen kontrollieren, Fehler korrigieren</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Ergänzungsbuchungen:</strong> Abgrenzungen, Rückstellungen, Abschreibungen buchen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Steuererklärungen:</strong> UStVA, EÜR, Jahresabschluss erstellen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Beratung:</strong> Steuerliche und betriebswirtschaftliche Beratung</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Empfehlung:</strong> Legen Sie zu Beginn der Zusammenarbeit fest, welche Aufgaben der Mandant übernimmt
                      und wo Sie als Steuerberater eingreifen. Eine klare Absprache verhindert Doppelarbeit und Missverständnisse.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8 print:hidden" />

            {/* DATEV-Schnittstelle */}
            <Card id="formate" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  <CardTitle>Unterstützte DATEV-Formate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  buchhaltung-ki.app unterstützt den vollständigen DATEV-Import und -Export nach GDPdU-Standard
                  (Grundsätze zum Datenzugriff und zur Prüfbarkeit digitaler Unterlagen).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Import-Formate:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="font-semibold mb-2">📥 GDPdU-Export (ZIP)</div>
                    <p className="text-sm text-slate-600 mb-2">
                      Vollständiger DATEV-Export mit allen Stamm- und Bewegungsdaten
                    </p>
                    <ul className="text-xs space-y-1 text-slate-600">
                      <li>• EXTF_Buchungsstapel.csv</li>
                      <li>• EXTF_Sachkontenbeschriftungen.csv</li>
                      <li>• EXTF_Kreditoren.csv / EXTF_Debitoren.csv</li>
                      <li>• EXTF_Kontenbeschriftungen.csv</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="font-semibold mb-2">📄 Einzelne CSV-Dateien</div>
                    <p className="text-sm text-slate-600 mb-2">
                      Import von einzelnen Stammdaten-Dateien
                    </p>
                    <ul className="text-xs space-y-1 text-slate-600">
                      <li>• DebitorenKreditorenstammdaten.csv</li>
                      <li>• Sachkontenstamm.csv</li>
                      <li>• Kontenplan.csv</li>
                    </ul>
                  </div>
                </div>
                <h4 className="font-semibold mt-4 mb-2">Export-Formate:</h4>
                <ul className="space-y-1">
                  <li><strong>DATEV ASCII (EXTF-Format):</strong> Kompatibel mit DATEV Kanzlei-Rechnungswesen, DATEV Unternehmen online</li>
                  <li><strong>GDPdU-Export (ZIP):</strong> Alle Buchungen und Stammdaten in einem Archiv</li>
                  <li><strong>CSV (Excel-kompatibel):</strong> Für eigene Auswertungen</li>
                </ul>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Kompatibilität:</strong> Die exportierten Dateien können direkt in DATEV Kanzlei-Rechnungswesen pro,
                      DATEV Unternehmen online oder andere DATEV-kompatible Systeme importiert werden.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="kontenrahmen" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-600" />
                  <CardTitle>Kontenrahmen SKR04</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die App verwendet den Standard-Kontenrahmen <strong>SKR04</strong> (DATEV-Standard für Industrie, Handel, Handwerk).
                  Dieser ist in Deutschland weit verbreitet und ermöglicht eine nahtlose Integration mit DATEV-Systemen.
                </p>
                <h4 className="font-semibold mt-4 mb-2">SKR04 im Überblick:</h4>
                <div className="not-prose">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-3 py-2 text-left">Kontenklasse</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Bezeichnung</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Beispiele</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">0</td>
                        <td className="border border-slate-300 px-3 py-2">Anlagevermögen</td>
                        <td className="border border-slate-300 px-3 py-2">0027 Betriebs-/Geschäftsausstattung, 0320 Fuhrpark</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">1</td>
                        <td className="border border-slate-300 px-3 py-2">Finanzkonten</td>
                        <td className="border border-slate-300 px-3 py-2">1200 Bank, 1360 Kasse</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">2</td>
                        <td className="border border-slate-300 px-3 py-2">Eigenkapital</td>
                        <td className="border border-slate-300 px-3 py-2">2000 Eigenkapital, 2980 Privatentnahmen</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">3</td>
                        <td className="border border-slate-300 px-3 py-2">Fremdkapital</td>
                        <td className="border border-slate-300 px-3 py-2">3000 Verbindlichkeiten L+L, 3300 Darlehen</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">4</td>
                        <td className="border border-slate-300 px-3 py-2">Betriebliche Aufwendungen</td>
                        <td className="border border-slate-300 px-3 py-2">4120 Miete, 4200 Telefon, 4500 Fahrzeugkosten</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">5</td>
                        <td className="border border-slate-300 px-3 py-2">Sonstige Aufwendungen</td>
                        <td className="border border-slate-300 px-3 py-2">5800 Zinsen, 5900 Steuern</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">7</td>
                        <td className="border border-slate-300 px-3 py-2">Betriebliche Erträge</td>
                        <td className="border border-slate-300 px-3 py-2">8400 Erlöse 19% USt, 8300 Erlöse 7% USt</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">8</td>
                        <td className="border border-slate-300 px-3 py-2">Erlöskonten</td>
                        <td className="border border-slate-300 px-3 py-2">8400 Umsatzerlöse 19% USt</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  Alle Standard-Sachkonten sind bereits in der App hinterlegt. Mandanten können bei Bedarf individuelle Konten anlegen,
                  die automatisch im DATEV-Export enthalten sind.
                </p>
              </CardContent>
            </Card>

            <Card id="buchungsstapel" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-teal-600" />
                  <CardTitle>Buchungsstapel exportieren</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Der Mandant exportiert seine Buchungen als <strong>DATEV-Buchungsstapel</strong> im EXTF-Format.
                  Diese Datei kann direkt in Ihre DATEV-Software importiert werden.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Dateiinhalt (EXTF_Buchungsstapel.csv):</h4>
                <div className="not-prose">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-3 py-2 text-left">Feld</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Beschreibung</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">Belegdatum</td>
                        <td className="border border-slate-300 px-3 py-2">Datum des Belegs (TTMMJJ)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">Belegnummer</td>
                        <td className="border border-slate-300 px-3 py-2">Rechnungsnummer oder interne Belegnummer</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">Sollkonto</td>
                        <td className="border border-slate-300 px-3 py-2">Soll-Konto (z.B. 4120 Miete)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">Habenkonto</td>
                        <td className="border border-slate-300 px-3 py-2">Haben-Konto (z.B. 1200 Bank oder Kreditor)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">Betrag</td>
                        <td className="border border-slate-300 px-3 py-2">Bruttobetrag</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">Steuersatz</td>
                        <td className="border border-slate-300 px-3 py-2">19, 7, 0 (automatisch oder manuell)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono">Buchungstext</td>
                        <td className="border border-slate-300 px-3 py-2">Beschreibung der Buchung</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <h4 className="font-semibold mt-4 mb-2">Import in DATEV:</h4>
                <ol className="space-y-2">
                  <li>Öffnen Sie DATEV Kanzlei-Rechnungswesen</li>
                  <li>Wählen Sie den Mandanten</li>
                  <li>Menü: <strong>Extras → Stapelverarbeitung → ASCII-Import</strong></li>
                  <li>Wählen Sie die Datei <code>EXTF_Buchungsstapel.csv</code></li>
                  <li>Format: <strong>EXTF-Datei</strong></li>
                  <li>Klicken Sie auf "Import starten"</li>
                </ol>
              </CardContent>
            </Card>

            <Card id="stammdaten" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-600" />
                  <CardTitle>Stammdaten synchronisieren</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Neben Buchungen exportiert der Mandant auch Stammdaten (Sachkonten, Kreditoren, Debitoren).
                  Diese können Sie in Ihre DATEV-Software importieren oder zur Prüfung verwenden.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Exportierte Stammdaten:</h4>
                <ul className="space-y-2">
                  <li>
                    <strong>EXTF_Sachkontenbeschriftungen.csv:</strong> Alle verwendeten Sachkonten mit Bezeichnungen
                  </li>
                  <li>
                    <strong>EXTF_Kreditoren.csv:</strong> Lieferanten-Stammdaten (Name, Adresse, USt-IdNr., IBAN)
                  </li>
                  <li>
                    <strong>EXTF_Debitoren.csv:</strong> Kunden-Stammdaten (Name, Adresse, USt-IdNr., IBAN)
                  </li>
                </ul>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Tipp:</strong> Importieren Sie die Stammdaten <em>vor</em> den Buchungen, damit die Konten bereits angelegt sind
                      und der Buchungsimport reibungslos funktioniert.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8 print:hidden" />

            {/* Datenübergabe vom Mandanten */}
            <Card id="export-prozess" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-teal-600" />
                  <CardTitle>Export-Prozess</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  So exportiert der Mandant die Daten aus buchhaltung-ki.app für Sie:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Schritt-für-Schritt:</h4>
                <ol className="space-y-3">
                  <li>
                    <strong>Navigation:</strong> Der Mandant navigiert zu <em>Steuerberater → An Steuerberater übergeben</em>
                  </li>
                  <li>
                    <strong>Zeitraum wählen:</strong> Auswahl des gewünschten Zeitraums (z.B. "Januar 2026" oder "Q1 2026")
                  </li>
                  <li>
                    <strong>Export erstellen:</strong> Die App erstellt automatisch:
                    <ul>
                      <li>DATEV-Export (ZIP mit allen Dateien)</li>
                      <li>Übergabeprotokoll (PDF mit Liste der Buchungen)</li>
                      <li>Optional: Alle Belege als ZIP</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Versand:</strong> Der Mandant kann die Dateien herunterladen oder per E-Mail an Sie senden
                  </li>
                </ol>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Best Practice:</strong> Vereinbaren Sie mit dem Mandanten einen festen Rhythmus (z.B. monatlich oder quartalsweise)
                      für die Datenübergabe. So vermeiden Sie Last-Minute-Stress vor Abgabeterminen.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="dateien" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-teal-600" />
                  <CardTitle>Erhaltene Dateien</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Nach dem Export erhalten Sie vom Mandanten typischerweise folgende Dateien:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Hauptexport (DATEV-Export.zip):</h4>
                <div className="not-prose">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-3 py-2 text-left">Datei</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Inhalt</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Verwendung</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono text-xs">EXTF_Buchungsstapel.csv</td>
                        <td className="border border-slate-300 px-3 py-2">Alle Buchungen</td>
                        <td className="border border-slate-300 px-3 py-2">Import in DATEV</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono text-xs">EXTF_Sachkontenbeschriftungen.csv</td>
                        <td className="border border-slate-300 px-3 py-2">Sachkonten</td>
                        <td className="border border-slate-300 px-3 py-2">Konten-Stammdaten</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono text-xs">EXTF_Kreditoren.csv</td>
                        <td className="border border-slate-300 px-3 py-2">Lieferanten</td>
                        <td className="border border-slate-300 px-3 py-2">Kreditoren-Stammdaten</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono text-xs">EXTF_Debitoren.csv</td>
                        <td className="border border-slate-300 px-3 py-2">Kunden</td>
                        <td className="border border-slate-300 px-3 py-2">Debitoren-Stammdaten</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono text-xs">Uebergabeprotokoll.pdf</td>
                        <td className="border border-slate-300 px-3 py-2">Übersicht</td>
                        <td className="border border-slate-300 px-3 py-2">Prüfung der Vollständigkeit</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <h4 className="font-semibold mt-4 mb-2">Optional (Belege.zip):</h4>
                <ul className="space-y-1">
                  <li>Alle Belege als PDF-Dateien</li>
                  <li>Dateinamen entsprechen Belegnummer + Datum</li>
                  <li>Sortiert nach Monat/Quartal</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="zeitraeume" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <CardTitle>Zeiträume & Geschäftsjahre</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Der Mandant kann Daten für beliebige Zeiträume exportieren:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="font-semibold mb-2">📅 Monatlich</div>
                    <p className="text-sm text-slate-600">
                      Export für einen einzelnen Monat (z.B. Januar 2026)
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="font-semibold mb-2">📊 Quartalsweise</div>
                    <p className="text-sm text-slate-600">
                      Export für ein Quartal (z.B. Q1 2026 = Jan-Mrz)
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="font-semibold mb-2">📆 Jährlich</div>
                    <p className="text-sm text-slate-600">
                      Export für ein Geschäftsjahr (z.B. 2026)
                    </p>
                  </div>
                </div>
                <h4 className="font-semibold mt-4 mb-2">Abweichendes Wirtschaftsjahr:</h4>
                <p>
                  Falls der Mandant ein abweichendes Wirtschaftsjahr hat (z.B. 01.07.-30.06.), kann er in den Unternehmenseinstellungen
                  das Geschäftsjahr anpassen. Die App berücksichtigt dies automatisch bei Exporten und BWA-Berichten.
                </p>
              </CardContent>
            </Card>

            <Separator className="my-8 print:hidden" />

            {/* Datenübergabe an den Mandanten */}
            <Card id="import-prozess" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-teal-600" />
                  <CardTitle>Import-Prozess für Mandanten</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Nach Ihrer Prüfung und eventuellen Korrekturen können Sie die finalen Buchungen zurück an den Mandanten übergeben:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Schritt-für-Schritt:</h4>
                <ol className="space-y-3">
                  <li>
                    <strong>Export aus DATEV:</strong> Exportieren Sie die korrigierten Buchungen aus Ihrer DATEV-Software als GDPdU-Export
                  </li>
                  <li>
                    <strong>Übergabe an Mandanten:</strong> Senden Sie die ZIP-Datei per E-Mail oder sicherer Datenübertragung
                  </li>
                  <li>
                    <strong>Mandant importiert:</strong> Der Mandant navigiert zu <em>DATEV Import</em> und lädt die ZIP-Datei hoch
                  </li>
                  <li>
                    <strong>Automatische Erkennung:</strong> Die App erkennt Dubletten und importiert nur neue/geänderte Buchungen
                  </li>
                </ol>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Wichtig:</strong> Besprechen Sie mit dem Mandanten, ob Korrekturen direkt in der App erfolgen sollen
                      oder ob Sie die "Master-Daten" zurückliefern. Letzteres verhindert Abweichungen zwischen Mandant und Steuerberater.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="korrekturen" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-600" />
                  <CardTitle>Buchungskorrekturen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Typische Korrekturen, die Sie als Steuerberater vornehmen:
                </p>
                <ul className="space-y-2">
                  <li>
                    <strong>Kontenzuordnung korrigieren:</strong> Falsch zugeordnete Sachkonten korrigieren
                  </li>
                  <li>
                    <strong>Abgrenzungen buchen:</strong> Periodengerechte Abgrenzungen (aktive/passive Rechnungsabgrenzung)
                  </li>
                  <li>
                    <strong>Rückstellungen bilden:</strong> Rückstellungen für offene Urlaube, drohende Verluste, etc.
                  </li>
                  <li>
                    <strong>Abschreibungen ergänzen:</strong> Planmäßige und außerplanmäßige Abschreibungen
                  </li>
                  <li>
                    <strong>Steuerbuchungen:</strong> Umsatzsteuer-Voranmeldung, Körperschaftsteuer, Gewerbesteuer
                  </li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Best Practice:</h4>
                <p>
                  Kennzeichnen Sie Ihre Korrekturbuchungen im Buchungstext mit einem Präfix (z.B. "STB: ..."), damit der Mandant
                  nachvollziehen kann, welche Buchungen von Ihnen stammen.
                </p>
              </CardContent>
            </Card>

            <Card id="jahresabschluss" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-teal-600" />
                  <CardTitle>Jahresabschluss-Buchungen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Am Ende des Geschäftsjahres erstellen Sie die Abschlussbuchungen:
                </p>
                <ul className="space-y-2">
                  <li><strong>GuV-Abschluss:</strong> Alle Aufwands- und Ertragskonten auf GuV-Konto abschließen</li>
                  <li><strong>Bilanzerstellung:</strong> Alle Bilanzkonten (Aktiva/Passiva) fortführen</li>
                  <li><strong>Gewinnverteilung:</strong> Jahresüberschuss auf Eigenkapital/Privatkonten verteilen</li>
                  <li><strong>Eröffnungsbilanz:</strong> Für das neue Geschäftsjahr</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Rücklieferung:</h4>
                <p>
                  Nach Fertigstellung des Jahresabschlusses liefern Sie die finalen Buchungen zurück an den Mandanten (DATEV-Export).
                  Der Mandant importiert diese und hat somit den "offiziellen" Buchungsstand.
                </p>
              </CardContent>
            </Card>

            <Separator className="my-8 print:hidden" />

            {/* Kontenzuordnung */}
            <Card id="skr04" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-600" />
                  <CardTitle>SKR04 Kontenrahmen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Der SKR04 ist der Standard-Kontenrahmen für Industrie, Handel und Handwerk in Deutschland.
                  Er ist nach dem <strong>Abschlussgliederungsprinzip</strong> aufgebaut (Bilanz und GuV-Reihenfolge).
                </p>
                <h4 className="font-semibold mt-4 mb-2">Aufbau:</h4>
                <p>
                  Die Konten sind in 10 Klassen (0-9) unterteilt, wobei jede Klasse einen bestimmten Bereich der Bilanz oder GuV abdeckt.
                </p>
              </CardContent>
            </Card>

            <Card id="kontenklassen" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <CardTitle>Kontenklassen 0-9 Übersicht</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <div className="not-prose">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-3 py-2 text-left">Klasse</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Bezeichnung</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Wichtige Konten</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">0</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Anlagevermögen</td>
                        <td className="border border-slate-300 px-3 py-2">0027 BGA, 0210 Maschinen, 0320 Fuhrpark, 0520 Geschäftsausstattung</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">1</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Umlaufvermögen</td>
                        <td className="border border-slate-300 px-3 py-2">1200 Bank, 1360 Kasse, 1400 Forderungen, 1576 Abziehbare Vorsteuer</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">2</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Eigenkapital</td>
                        <td className="border border-slate-300 px-3 py-2">2000 Eigenkapital, 2100 Gesellschafterkonten, 2980 Privatentnahmen</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">3</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Fremdkapital</td>
                        <td className="border border-slate-300 px-3 py-2">3000 Verbindlichkeiten L+L, 3300 Darlehen, 3806 Umsatzsteuer</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">4</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Betriebliche Aufwendungen</td>
                        <td className="border border-slate-300 px-3 py-2">4120 Miete, 4200 Telefon, 4500 Kfz-Kosten, 4600 Werbung, 4920 Abschreibungen</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">5-6</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Weitere Aufwendungen</td>
                        <td className="border border-slate-300 px-3 py-2">5800 Zinsen, 5900 Steuern vom Einkommen</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">7</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Sonstige Erträge</td>
                        <td className="border border-slate-300 px-3 py-2">7600 Zinserträge, 7800 Sonstige betriebliche Erträge</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">8</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Erlöskonten</td>
                        <td className="border border-slate-300 px-3 py-2">8300 Erlöse 7% USt, 8400 Erlöse 19% USt, 8500 Erlöse steuerfrei</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 font-mono font-bold">9</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">Vortragskonten</td>
                        <td className="border border-slate-300 px-3 py-2">9000 Saldenvorträge Sachkonten, 9008 Saldenvorträge Debitoren/Kreditoren</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card id="klassifizierung" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                  <CardTitle>Automatische Klassifizierung</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die App verwendet KI-gestützte Kontenzuordnung, um Belege automatisch den richtigen Sachkonten zuzuordnen:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionsweise:</h4>
                <ol className="space-y-2">
                  <li>OCR erkennt Text und Beträge aus dem Beleg</li>
                  <li>KI analysiert Lieferantenname, Rechnungstext und frühere Buchungen</li>
                  <li>Vorschlag eines passenden Sachkontos (z.B. "Telekom" → 4200 Telefon)</li>
                  <li>Mandant kann Vorschlag akzeptieren oder manuell korrigieren</li>
                  <li>System lernt aus Korrekturen (Mandanten-spezifisches Machine Learning)</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">Genauigkeit:</h4>
                <p>
                  Nach einer Einlernphase von ca. 20-30 Buchungen erreicht die KI eine Genauigkeit von 85-95%.
                  Komplexe Buchungen (Abschreibungen, Rückstellungen, etc.) werden typischerweise manuell erfasst.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Vorteil für Sie:</strong> Durch die automatische Vorkontierung sind die meisten Buchungen bereits
                      korrekt erfasst, wenn Sie die Daten erhalten. Sie müssen nur noch prüfen und komplexe Buchungen ergänzen.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8 print:hidden" />

            {/* Belege & Dokumentation */}
            <Card id="belegablage" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-teal-600" />
                  <CardTitle>Belegablage in der App</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Alle Belege werden in der App digital archiviert und sind jederzeit abrufbar.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Archivierung:</h4>
                <ul className="space-y-1">
                  <li>Belege werden als PDF gespeichert (falls JPG/PNG hochgeladen, automatisch konvertiert)</li>
                  <li>Jeder Beleg ist mit der zugehörigen Buchung verknüpft</li>
                  <li>Belegsuche über Belegnummer, Datum, Lieferant, Betrag</li>
                  <li>Download als ZIP (alle Belege eines Zeitraums)</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">GoBD-Konformität:</h4>
                <p>
                  Die App erfüllt die Anforderungen der GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form):
                </p>
                <ul className="space-y-1">
                  <li>✅ Unveränderbarkeit (Belege können nach Archivierung nicht mehr bearbeitet werden)</li>
                  <li>✅ Nachvollziehbarkeit (Änderungsprotokolle für Buchungen)</li>
                  <li>✅ Vollständigkeit (alle Belege werden archiviert)</li>
                  <li>✅ Zeitgerechte Erfassung (Datum der Belegerfassung wird gespeichert)</li>
                </ul>
              </CardContent>
            </Card>

            <Card id="ocr" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-teal-600" />
                  <CardTitle>OCR-Verarbeitung</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die integrierte OCR-Engine (Optical Character Recognition) extrahiert automatisch alle relevanten Daten aus Belegen:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Erkannte Felder:</h4>
                <ul className="space-y-1">
                  <li>Rechnungsdatum</li>
                  <li>Rechnungsnummer</li>
                  <li>Lieferant/Kunde (Name, Adresse)</li>
                  <li>Betrag (Netto, Brutto, MwSt.)</li>
                  <li>IBAN (falls vorhanden)</li>
                  <li>USt-IdNr. (falls vorhanden)</li>
                  <li>Rechnungstext/Positionen</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Genauigkeit:</h4>
                <p>
                  Die OCR erreicht bei gut lesbaren Belegen (PDF, hochauflösende Scans) eine Genauigkeit von 95-99%.
                  Bei schlechter Qualität (Handy-Fotos, verblasste Kassenzettel) kann die Genauigkeit sinken.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Hinweis:</strong> Die OCR-Ergebnisse werden dem Mandanten zur Prüfung angezeigt. Fehler können manuell korrigiert werden.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="verknuepfung" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <CardTitle>Belegverknüpfung</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Jede Buchung kann mit einem oder mehreren Belegen verknüpft werden:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Zugriff auf Belege:</h4>
                <ol className="space-y-2">
                  <li>In der Buchungsübersicht ist ersichtlich, ob ein Beleg vorhanden ist (Icon)</li>
                  <li>Klick auf Buchung öffnet Detail-Ansicht mit Belegvorschau</li>
                  <li>Beleg kann als PDF heruntergeladen werden</li>
                </ol>
                <h4 className="font-semibold mt-4 mb-2">Beim DATEV-Export:</h4>
                <p>
                  Optional kann der Mandant alle Belege als separate ZIP-Datei exportieren. Die Dateinamen entsprechen dem Schema:
                </p>
                <div className="p-3 bg-slate-100 rounded font-mono text-sm">
                  YYYYMMDD_Belegnummer_Lieferant.pdf
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Beispiel: <code>20260115_RE-12345_Telekom.pdf</code>
                </p>
              </CardContent>
            </Card>

            <Card id="aufbewahrung" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <CardTitle>Aufbewahrungsfristen</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Gemäß § 147 AO (Abgabenordnung) gelten folgende Aufbewahrungsfristen:
                </p>
                <div className="not-prose">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-3 py-2 text-left">Dokument</th>
                        <th className="border border-slate-300 px-3 py-2 text-left">Frist</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2">Buchungen, Belege, Rechnungen</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">10 Jahre</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2">Jahresabschlüsse, Eröffnungsbilanzen</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">10 Jahre</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2">Empfangene Handelsbriefe, Kopien abgesandter Handelsbriefe</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">6 Jahre</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2">Sonstige geschäftliche Unterlagen</td>
                        <td className="border border-slate-300 px-3 py-2 font-semibold">6 Jahre</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  Die App speichert alle Belege und Buchungen für mindestens 10 Jahre. Mandanten können auf Wunsch auch länger aufbewahren.
                </p>
              </CardContent>
            </Card>

            <Separator className="my-8 print:hidden" />

            {/* Jahresabschluss */}
            <Card id="bwa" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <CardTitle>BWA-Berichte</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die App erstellt automatisch BWA-Berichte (Betriebswirtschaftliche Auswertungen) nach DATEV-Standard.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Verfügbare Auswertungen:</h4>
                <ul className="space-y-1">
                  <li>BWA nach DATEV-Schema (Kurzform)</li>
                  <li>Summen- und Saldenliste</li>
                  <li>Offene Posten (Forderungen/Verbindlichkeiten)</li>
                  <li>Liquiditätsübersicht</li>
                  <li>Kennzahlen (EBITDA, Eigenkapitalquote, etc.)</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Zugriff für Steuerberater:</h4>
                <p>
                  Der Mandant kann Ihnen Zugriff auf die BWA-Berichte gewähren (optional). So können Sie jederzeit den aktuellen Stand einsehen,
                  ohne auf den monatlichen Export warten zu müssen.
                </p>
              </CardContent>
            </Card>

            <Card id="anlagenspiegel" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-teal-600" />
                  <CardTitle>Anlagenspiegel</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die App verwaltet das Anlagevermögen und erstellt automatisch den Anlagenspiegel für den Jahresabschluss.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Verwaltete Daten:</h4>
                <ul className="space-y-1">
                  <li>Anschaffungskosten</li>
                  <li>Anschaffungsdatum</li>
                  <li>Nutzungsdauer</li>
                  <li>Abschreibungsmethode (linear, degressiv)</li>
                  <li>Jährliche Abschreibung</li>
                  <li>Buchwert (aktuell)</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Export:</h4>
                <p>
                  Der Anlagenspiegel kann als CSV oder PDF exportiert werden und wird auch im DATEV-Export enthalten.
                </p>
              </CardContent>
            </Card>

            <Card id="forderungen" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  <CardTitle>Forderungen/Verbindlichkeiten</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Die App verwaltet offene Posten und erstellt automatisch Listen für Forderungen und Verbindlichkeiten.
                </p>
                <h4 className="font-semibold mt-4 mb-2">Funktionen:</h4>
                <ul className="space-y-1">
                  <li>Übersicht über offene Forderungen (Debitoren)</li>
                  <li>Übersicht über offene Verbindlichkeiten (Kreditoren)</li>
                  <li>Fälligkeitsdaten und Zahlungserinnerungen</li>
                  <li>Zahlungsabgleich (Bank-Matching)</li>
                  <li>Mahnwesen (1. Mahnung, 2. Mahnung)</li>
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Für Jahresabschluss:</h4>
                <p>
                  Listen der offenen Posten zum Bilanzstichtag können exportiert werden und sind Grundlage für die Bilanzierung
                  (Forderungen als Aktivposten, Verbindlichkeiten als Passivposten).
                </p>
              </CardContent>
            </Card>

            <Card id="abstimmung" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  <CardTitle>Abstimmung mit Steuerberater</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Für einen reibungslosen Jahresabschluss empfiehlt sich folgendes Vorgehen:
                </p>
                <h4 className="font-semibold mt-4 mb-2">Ablauf:</h4>
                <ol className="space-y-3">
                  <li>
                    <strong>Vorabstimmung (ca. 2 Wochen vor Bilanzstichtag):</strong>
                    <ul>
                      <li>Mandant exportiert vorläufige Daten</li>
                      <li>Sie prüfen auf Vollständigkeit und offensichtliche Fehler</li>
                      <li>Rückfragen klären</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Finale Übergabe (kurz nach Bilanzstichtag):</strong>
                    <ul>
                      <li>Mandant schließt alle Buchungen ab</li>
                      <li>Export des gesamten Geschäftsjahres</li>
                      <li>Übergabe aller Belege</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Jahresabschluss-Erstellung:</strong>
                    <ul>
                      <li>Sie importieren die Daten in DATEV</li>
                      <li>Ergänzungsbuchungen (Abgrenzungen, Rückstellungen, etc.)</li>
                      <li>Bilanzerstellung</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Rücklieferung:</strong>
                    <ul>
                      <li>Finale Buchungen zurück an Mandanten</li>
                      <li>Jahresabschluss als PDF</li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Separator className="my-8 print:hidden" />

            {/* FAQ */}
            <Card id="faq" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  <CardTitle>Häufige Fragen (FAQ)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <h4 className="font-semibold mt-4 mb-2">Wie erhalte ich Zugang zu Mandantendaten?</h4>
                <p>
                  Ihr Mandant kann Ihnen auf zwei Arten Daten übergeben:
                </p>
                <ul>
                  <li><strong>Option 1 (empfohlen):</strong> Regelmäßiger DATEV-Export (monatlich/quartalsweise)</li>
                  <li><strong>Option 2:</strong> Direkter Lesezugriff auf die App (Mandant lädt Sie als Benutzer ein)</li>
                </ul>

                <h4 className="font-semibold mt-6 mb-2">Kann ich direkt in der App arbeiten?</h4>
                <p>
                  Nein, die App ist primär für Mandanten gedacht. Sie erhalten die Daten als DATEV-Export und arbeiten in Ihrer eigenen Software.
                  Optional können Sie Lesezugriff erhalten, um den Status zu prüfen.
                </p>

                <h4 className="font-semibold mt-6 mb-2">Wie werden Änderungen synchronisiert?</h4>
                <p>
                  Änderungen, die Sie in DATEV vornehmen, können Sie als Export zurück an den Mandanten senden.
                  Der Mandant importiert diese dann in die App. Eine Live-Synchronisation gibt es nicht.
                </p>

                <h4 className="font-semibold mt-6 mb-2">Was passiert, wenn der Mandant falsche Konten zuordnet?</h4>
                <p>
                  Sie korrigieren die Kontenzuordnung in Ihrer DATEV-Software und liefern die korrigierten Buchungen zurück.
                  Die KI lernt aus Ihren Korrekturen (falls der Mandant die Daten reimportiert).
                </p>

                <h4 className="font-semibold mt-6 mb-2">Ist die App GoBD-konform?</h4>
                <p>
                  Ja, die App erfüllt die GoBD-Anforderungen: Unveränderbarkeit, Nachvollziehbarkeit, Vollständigkeit, zeitgerechte Erfassung.
                  Alle Belege werden revisionssicher archiviert.
                </p>

                <h4 className="font-semibold mt-6 mb-2">Kann ich mehrere Mandanten mit der App betreuen?</h4>
                <p>
                  Ja, jeder Mandant hat sein eigenes Unternehmen in der App. Sie erhalten von jedem Mandanten separate DATEV-Exporte.
                  Es gibt keine Vermischung der Daten.
                </p>

                <h4 className="font-semibold mt-6 mb-2">Welche DATEV-Software ist kompatibel?</h4>
                <p>
                  Alle gängigen DATEV-Produkte:
                </p>
                <ul>
                  <li>DATEV Kanzlei-Rechnungswesen</li>
                  <li>DATEV Kanzlei-Rechnungswesen pro</li>
                  <li>DATEV Unternehmen online</li>
                  <li>DATEV Mittelstand Faktura</li>
                </ul>

                <h4 className="font-semibold mt-6 mb-2">Was kostet buchhaltung-ki.app für den Mandanten?</h4>
                <p>
                  Die Preisgestaltung ist mandantenindividuell. Informationen finden Sie auf der Website oder Sie kontaktieren den Support.
                </p>

                <h4 className="font-semibold mt-6 mb-2">Gibt es eine Schulung für Mandanten?</h4>
                <p>
                  Ja, die App bietet ein integriertes Benutzerhandbuch und Video-Tutorials. Bei Bedarf können Sie auch gemeinsam mit dem Mandanten
                  die Einrichtung durchführen.
                </p>
              </CardContent>
            </Card>

            {/* Kontakt & Support */}
            <Card id="kontakt" className="break-inside-avoid">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-600" />
                  <CardTitle>Kontakt & Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p>
                  Bei Fragen oder technischen Problemen stehen wir Ihnen gerne zur Verfügung:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mt-4">
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-teal-600" />
                      <div className="font-semibold">E-Mail Support</div>
                    </div>
                    <a href="mailto:support@buchhaltung-ki.app" className="text-teal-600 hover:underline block mb-1">
                      support@buchhaltung-ki.app
                    </a>
                    <p className="text-sm text-slate-600">Antwortzeit: 24h (werktags)</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div className="font-semibold">Technische Dokumentation</div>
                    </div>
                    <a href="https://docs.buchhaltung-ki.app" className="text-blue-600 hover:underline block mb-1">
                      docs.buchhaltung-ki.app
                    </a>
                    <p className="text-sm text-slate-600">API-Docs, Schnittstellen, FAQ</p>
                  </div>
                </div>
                <h4 className="font-semibold mt-6 mb-2">Für Steuerberater-Kanzleien:</h4>
                <p>
                  Falls Sie mehrere Mandanten betreuen möchten, kontaktieren Sie uns für Informationen zu:
                </p>
                <ul className="space-y-1">
                  <li>Kanzlei-Lizenzen (Rabatte bei mehreren Mandanten)</li>
                  <li>API-Zugang für eigene Integrationen</li>
                  <li>Schulungen für Ihre Mitarbeiter</li>
                  <li>Individuelle Anpassungen</li>
                </ul>
              </CardContent>
            </Card>

            {/* Schlusswort */}
            <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
              <CardHeader>
                <CardTitle className="text-center">Vielen Dank für Ihr Interesse!</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-700 mb-4">
                  Wir hoffen, dieses Handbuch hilft Ihnen bei der Zusammenarbeit mit Mandanten, die buchhaltung-ki.app nutzen.
                  Für weitere Fragen stehen wir jederzeit zur Verfügung.
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/login">
                    <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
                      <Shield className="w-4 h-4" />
                      Zur App
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Handbuch drucken
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 mt-12 print:hidden">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-3">buchhaltung-ki.app</h4>
              <p className="text-sm">
                Moderne Buchhaltungssoftware mit KI-Unterstützung und vollständiger DATEV-Integration.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/hilfe" className="hover:text-white">Benutzerhandbuch</Link></li>
                <li><Link href="/steuerberater-handbuch" className="hover:text-white">Steuerberater-Handbuch</Link></li>
                <li><a href="https://docs.buchhaltung-ki.app" className="hover:text-white">API-Dokumentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Kontakt</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@buchhaltung-ki.app" className="hover:text-white">support@buchhaltung-ki.app</a></li>
                <li className="text-slate-400">© 2026 buchhaltung-ki.app</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
