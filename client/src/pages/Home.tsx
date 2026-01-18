import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Euro,
  Hash,
  FileSpreadsheet,
  ChevronRight,
  BarChart3,
  StickyNote,
  Briefcase,
  Users,
  ArrowRightLeft,
  Bell,
  LayoutDashboard,
  Shield,
  Loader2,
  Sparkles,
  Wand2,
  Clock,
  CreditCard,
  CircleDot,
  Ban,
  Link2,
  Send
} from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import BelegVorschau from "@/components/BelegVorschau";
import { SachkontoCombobox } from "@/components/SachkontoCombobox";
import QuickBookingDialog from "@/components/QuickBookingDialog";
import { trpc } from "@/lib/trpc";

interface Buchung {
  id: string;
  buchungsart: "aufwand" | "ertrag" | "anlage" | "sonstig";
  belegdatum: string;
  belegnummer: string;
  geschaeftspartner: string;
  geschaeftspartnerTyp: "kreditor" | "debitor" | "gesellschafter" | "sonstig";
  geschaeftspartnerKonto: string;
  sachkonto: string;
  kostenstelle: string;
  nettobetrag: string;
  steuersatz: string;
  bruttobetrag: string;
  buchungstext: string;
  belegDatei: File | null;
  status: "pending" | "complete" | "error";
  // Zusätzliche erkannte Felder
  iban: string;
  ustIdNr: string;
  // Zahlungsstatus
  zahlungsstatus: "offen" | "bezahlt" | "teilbezahlt" | "storniert";
  faelligkeitsdatum: string;
  zahlungsdatum: string;
  // Kreditor-Match
  kreditorId: number | null;
  kreditorMatch: "exact" | "partial" | "none";
  // Steuerberater-Übergabe
  anSteuerberaterUebergeben: boolean;
  steuerberaterUebergabeId: number | null;
}

// Erweiterter Kontenrahmen SKR03
const KONTENRAHMEN_SKR03 = {
  aufwand: [
    { konto: "4120", bezeichnung: "Miete" },
    { konto: "4200", bezeichnung: "Telefon" },
    { konto: "4210", bezeichnung: "Internet" },
    { konto: "4240", bezeichnung: "Gas, Strom, Wasser" },
    { konto: "4260", bezeichnung: "Instandhaltung" },
    { konto: "4500", bezeichnung: "Fahrzeugkosten" },
    { konto: "4600", bezeichnung: "Werbekosten" },
    { konto: "4650", bezeichnung: "Bewirtungskosten" },
    { konto: "4830", bezeichnung: "Abschreibungen Sachanlagen" },
    { konto: "4900", bezeichnung: "Sonstige Aufwendungen" },
    { konto: "4930", bezeichnung: "Bürobedarf" },
    { konto: "4940", bezeichnung: "Zeitschriften, Bücher" },
    { konto: "4950", bezeichnung: "Rechts- und Beratungskosten" },
  ],
  ertrag: [
    { konto: "8400", bezeichnung: "Erlöse 19% USt" },
    { konto: "8300", bezeichnung: "Erlöse 7% USt" },
    { konto: "8100", bezeichnung: "Steuerfreie Erlöse" },
    { konto: "8200", bezeichnung: "Erlöse Ausland" },
    { konto: "8900", bezeichnung: "Sonstige Erträge" },
    { konto: "2650", bezeichnung: "Zinserträge" },
    { konto: "2700", bezeichnung: "Erträge aus Beteiligungen" },
  ],
  anlage: [
    { konto: "0200", bezeichnung: "Grundstücke" },
    { konto: "0210", bezeichnung: "Gebäude" },
    { konto: "0400", bezeichnung: "Maschinen" },
    { konto: "0420", bezeichnung: "Fahrzeuge" },
    { konto: "0480", bezeichnung: "Betriebs- und Geschäftsausstattung" },
    { konto: "0500", bezeichnung: "Anlagen im Bau" },
    { konto: "0600", bezeichnung: "Beteiligungen" },
    { konto: "0650", bezeichnung: "Wertpapiere des Anlagevermögens" },
  ],
  finanz: [
    { konto: "1200", bezeichnung: "Bank" },
    { konto: "1210", bezeichnung: "Sparkonto" },
    { konto: "1000", bezeichnung: "Kasse" },
    { konto: "1300", bezeichnung: "Wechsel" },
    { konto: "1400", bezeichnung: "Forderungen aus L+L" },
    { konto: "1600", bezeichnung: "Verbindlichkeiten aus L+L" },
  ],
  eigenkapital: [
    { konto: "0800", bezeichnung: "Gezeichnetes Kapital" },
    { konto: "0840", bezeichnung: "Kapitalrücklage" },
    { konto: "0860", bezeichnung: "Gewinnrücklagen" },
    { konto: "0880", bezeichnung: "Gewinnvortrag" },
    { konto: "0890", bezeichnung: "Verlustvortrag" },
    { konto: "2000", bezeichnung: "Privatentnahmen" },
    { konto: "2100", bezeichnung: "Privateinlagen" },
  ],
  steuer: [
    { satz: "19", bezeichnung: "19% USt/VSt" },
    { satz: "7", bezeichnung: "7% USt/VSt" },
    { satz: "0", bezeichnung: "Steuerfrei" },
  ]
};

const BUCHUNGSARTEN = [
  { value: "aufwand", label: "Aufwandsbuchung", icon: Building2, color: "text-red-600" },
  { value: "ertrag", label: "Ertragsbuchung", icon: Euro, color: "text-green-600" },
  { value: "anlage", label: "Anlagenbuchung", icon: FileText, color: "text-blue-600" },
  { value: "sonstig", label: "Sonstige Buchung", icon: ArrowRightLeft, color: "text-gray-600" },
];

const GESCHAEFTSPARTNER_TYPEN = [
  { value: "kreditor", label: "Kreditor (Lieferant)", kontobereich: "70000" },
  { value: "debitor", label: "Debitor (Kunde)", kontobereich: "10000" },
  { value: "gesellschafter", label: "Gesellschafter", kontobereich: "08000" },
  { value: "sonstig", label: "Sonstige", kontobereich: "00000" },
];

const ZAHLUNGSSTATUS_OPTIONEN = [
  { value: "offen", label: "Offen", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50" },
  { value: "bezahlt", label: "Bezahlt", icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50" },
  { value: "teilbezahlt", label: "Teilbezahlt", icon: CircleDot, color: "text-blue-600", bgColor: "bg-blue-50" },
  { value: "storniert", label: "Storniert", icon: Ban, color: "text-red-600", bgColor: "bg-red-50" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatCurrency(value: string): string {
  const num = parseFloat(value.replace(",", "."));
  if (isNaN(num)) return "";
  return num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateBrutto(netto: string, steuersatz: string): string {
  const nettoNum = parseFloat(netto.replace(",", "."));
  const steuerNum = parseFloat(steuersatz);
  if (isNaN(nettoNum) || isNaN(steuerNum)) return "";
  const brutto = nettoNum * (1 + steuerNum / 100);
  return brutto.toFixed(2).replace(".", ",");
}

function generateDATEVExport(buchungen: Buchung[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, "").slice(0, 17) + "000";
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}${String(month).padStart(2, "0")}01`;
  const endDate = `${year}${String(month).padStart(2, "0")}${new Date(year, month, 0).getDate()}`;
  
  const header = `"EXTF";700;21;"Buchungsstapel";13;${timestamp};;"MA";"";"";1001;10001;${year}0101;4;${startDate};${endDate};"Buchungsstapel";"MA";1;0;0;"EUR";;"";;;"03";;;"";""`;
  const columns = `Umsatz;Soll/Haben-Kz;WKZ Umsatz;Kurs;Basis-Umsatz;WKZ Basis-Umsatz;Konto;Gegenkonto (ohne BU-Schluessel);BU-Schluessel;Belegdatum;Belegfeld 1;Belegfeld 2;Skonto;Buchungstext;Postensperre;Diverse Adressnummer;Geschaeftspartnerbank;Sachverhalt;Zinssperre;Beleglink;KOST1`;
  
  const rows = buchungen
    .filter(b => b.status === "complete")
    .map(b => {
      const brutto = b.bruttobetrag.replace(",", ".");
      const datum = b.belegdatum.split("-").slice(1).reverse().join("").slice(0, 4);
      const sollHaben = b.buchungsart === "ertrag" ? "H" : "S";
      return `${brutto};"${sollHaben}";"EUR";;;;"${b.sachkonto}";"${b.geschaeftspartnerKonto}";"";"${datum}";"${b.belegnummer}";"";;${b.buchungstext};0;;;;;"";"${b.kostenstelle}"`;
    });
  
  return [header, columns, ...rows].join("\n");
}

export default function Home() {
  const { user } = useAuth();

  // Hole die ausgewählte Unternehmens-ID aus dem LocalStorage
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    return saved ? parseInt(saved) : null;
  });

  // Lade Sachkonten für das ausgewählte Unternehmen
  const { data: sachkontenGrouped } = trpc.stammdaten.sachkonten.listGrouped.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Lade Kreditoren für automatische Sachkonto-Zuordnung
  const { data: kreditorenList } = trpc.stammdaten.kreditoren.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Lade offene Aufgaben für Dashboard-Widget
  const { data: offeneAufgaben } = trpc.aufgaben.list.useQuery(
    { unternehmenId: selectedUnternehmenId!, status: "offen" },
    { enabled: !!selectedUnternehmenId }
  );

  // Lade Aufgaben-Statistiken für Dashboard
  const { data: aufgabenStats } = trpc.aufgaben.statistiken.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Lade Finanzamt-Statistiken für Dashboard
  const { data: finanzamtStats } = trpc.finanzamt.statistiken.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Aktualisiere selectedUnternehmenId wenn sich LocalStorage ändert
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("selectedUnternehmenId");
      setSelectedUnternehmenId(saved ? parseInt(saved) : null);
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Auch bei Fokus prüfen (für Änderungen im gleichen Tab)
    const checkStorage = () => {
      const saved = localStorage.getItem("selectedUnternehmenId");
      const newId = saved ? parseInt(saved) : null;
      if (newId !== selectedUnternehmenId) {
        setSelectedUnternehmenId(newId);
      }
    };
    
    const interval = setInterval(checkStorage, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedUnternehmenId]);

  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedBuchungId, setSelectedBuchungId] = useState<string | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  
  // Steuerberater-Übergabe State
  const [stbDialogOpen, setStbDialogOpen] = useState(false);
  const [stbBuchungId, setStbBuchungId] = useState<string | null>(null);
  const [selectedUebergabeId, setSelectedUebergabeId] = useState<number | null>(null);

  // Steuerberater-Übergaben laden
  const { data: uebergaben } = trpc.steuerberater.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId }
  );

  // Mutation für Buchung in Datenbank speichern
  const createBuchungMutation = trpc.buchungen.create.useMutation();

  // Mutation für Beleg-Upload zu S3
  const uploadBelegMutation = trpc.buchungen.uploadBeleg.useMutation();

  // Mutation für Buchung zu Übergabe hinzufügen
  const addBuchungToUebergabeMutation = trpc.steuerberater.addBuchungen.useMutation({
    onSuccess: (data) => {
      toast.success(`Buchung erfolgreich zur Übergabe hinzugefügt`);
      // Buchung als übergeben markieren
      if (stbBuchungId) {
        setBuchungen(prev => prev.map(b => 
          b.id === stbBuchungId 
            ? { ...b, anSteuerberaterUebergeben: true, steuerberaterUebergabeId: selectedUebergabeId }
            : b
        ));
      }
      setStbDialogOpen(false);
      setStbBuchungId(null);
      setSelectedUebergabeId(null);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // OCR Mutations
  const ocrMutation = trpc.ocr.analyzeImage.useMutation();
  const pdfOcrMutation = trpc.ocr.analyzePdf.useMutation();

  // Auto-Kontierung State
  const [autoKontierungCache, setAutoKontierungCache] = useState<Map<string, any>>(new Map());

  // Auto-Kontierung Mutation
  const markUsedMutation = trpc.kontierungsregeln.markUsed.useMutation();

  // Finde die ausgewählte Buchung für die Vorschau
  const selectedBuchung = buchungen.find(b => b.id === selectedBuchungId);

  // Berechne Standard-Fälligkeitsdatum (14 Tage nach heute)
  const getDefaultFaelligkeit = useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
  }, []);

  const createEmptyBuchung = useCallback((): Buchung => ({
    id: generateId(),
    buchungsart: "aufwand",
    belegdatum: new Date().toISOString().split("T")[0],
    belegnummer: `RE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    geschaeftspartner: "",
    geschaeftspartnerTyp: "kreditor",
    geschaeftspartnerKonto: "70000",
    sachkonto: "",
    kostenstelle: "",
    nettobetrag: "",
    steuersatz: "19",
    bruttobetrag: "",
    buchungstext: "",
    belegDatei: null,
    status: "pending",
    iban: "",
    ustIdNr: "",
    zahlungsstatus: "offen",
    faelligkeitsdatum: getDefaultFaelligkeit(),
    zahlungsdatum: "",
    kreditorId: null,
    kreditorMatch: "none",
    anSteuerberaterUebergeben: false,
    steuerberaterUebergabeId: null
  }), [getDefaultFaelligkeit]);

  // OCR-Analyse für einen Beleg durchführen (Bilder und PDFs)
  const analyzeBeleg = useCallback(async (buchungId: string, file: File) => {
    if (!file || analyzingIds.has(buchungId)) return;
    
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    
    if (!isPdf && !isImage) {
      toast.info("OCR-Analyse ist nur für Bilder und PDFs verfügbar");
      return;
    }

    setAnalyzingIds(prev => new Set(prev).add(buchungId));
    
    try {
      // Datei zu Base64 konvertieren
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Entferne den Data-URL-Prefix
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Wähle die richtige OCR-Methode basierend auf Dateityp
      let result;
      if (isPdf) {
        toast.info("PDF wird analysiert...");
        result = await pdfOcrMutation.mutateAsync({
          pdfBase64: base64,
          kontenrahmen: "SKR04" // TODO: Aus Firmeneinstellungen laden
        });
      } else {
        result = await ocrMutation.mutateAsync({
          imageBase64: base64,
          mimeType: file.type,
          kontenrahmen: "SKR04" // TODO: Aus Firmeneinstellungen laden
        });
      }

      // Aktualisiere die Buchung mit den erkannten Daten
      setBuchungen(prev => prev.map(b => {
        if (b.id !== buchungId) return b;
        
        const updated = { ...b };
        
        if (result.belegdatum) {
          updated.belegdatum = result.belegdatum;
          // Setze Fälligkeitsdatum auf 14 Tage nach Belegdatum
          const belegDate = new Date(result.belegdatum);
          belegDate.setDate(belegDate.getDate() + 14);
          updated.faelligkeitsdatum = belegDate.toISOString().split("T")[0];
        }
        if (result.belegnummer) updated.belegnummer = result.belegnummer;
        if (result.geschaeftspartner) updated.geschaeftspartner = result.geschaeftspartner;
        if (result.nettobetrag) updated.nettobetrag = result.nettobetrag.toFixed(2).replace(".", ",");
        if (result.bruttobetrag) updated.bruttobetrag = result.bruttobetrag.toFixed(2).replace(".", ",");
        if (result.steuersatz) updated.steuersatz = String(result.steuersatz);
        if (result.sachkonto) updated.sachkonto = result.sachkonto;
        if (result.sachkontoBeschreibung) updated.buchungstext = result.sachkontoBeschreibung;
        // Neue Felder: IBAN und USt-ID
        if (result.iban) updated.iban = result.iban;
        if (result.ustIdNr) updated.ustIdNr = result.ustIdNr;
        
        // IBAN-Matching mit Kreditoren-Stammdaten
        if (result.iban && kreditorenList) {
          const normalizedIban = result.iban.replace(/\s/g, "").toUpperCase();
          
          // Suche nach exaktem IBAN-Match
          const exactMatch = kreditorenList.find(k => 
            k.iban && k.iban.replace(/\s/g, "").toUpperCase() === normalizedIban
          );
          
          if (exactMatch) {
            updated.kreditorId = exactMatch.id;
            updated.kreditorMatch = "exact";
            updated.geschaeftspartner = exactMatch.name;
            updated.geschaeftspartnerKonto = exactMatch.kontonummer;
            // Standard-Sachkonto vom Kreditor übernehmen falls vorhanden
            if (exactMatch.standardSachkonto) {
              updated.sachkonto = exactMatch.standardSachkonto;
            }
            toast.success(`Kreditor "${exactMatch.name}" via IBAN erkannt!`);
          } else {
            // Suche nach partiellem Match (Name)
            if (result.geschaeftspartner) {
              const nameLower = result.geschaeftspartner.toLowerCase();
              const partialMatch = kreditorenList.find(k => 
                k.name.toLowerCase().includes(nameLower) || 
                nameLower.includes(k.name.toLowerCase())
              );
              if (partialMatch) {
                updated.kreditorId = partialMatch.id;
                updated.kreditorMatch = "partial";
                updated.geschaeftspartnerKonto = partialMatch.kontonummer;
                if (partialMatch.standardSachkonto) {
                  updated.sachkonto = partialMatch.standardSachkonto;
                }
              }
            }
          }
        } else if (result.geschaeftspartner && kreditorenList) {
          // Fallback: Nur Name-Matching wenn keine IBAN vorhanden
          const nameLower = result.geschaeftspartner.toLowerCase();
          const nameMatch = kreditorenList.find(k => 
            k.name.toLowerCase().includes(nameLower) || 
            nameLower.includes(k.name.toLowerCase())
          );
          if (nameMatch) {
            updated.kreditorId = nameMatch.id;
            updated.kreditorMatch = "partial";
            updated.geschaeftspartnerKonto = nameMatch.kontonummer;
            if (nameMatch.standardSachkonto) {
              updated.sachkonto = nameMatch.standardSachkonto;
            }
          }
        }
        
        // Status aktualisieren
        const isComplete = 
          updated.belegdatum && 
          updated.belegnummer && 
          updated.geschaeftspartner && 
          updated.sachkonto && 
          updated.bruttobetrag;
        
        updated.status = isComplete ? "complete" : "pending";
        
        return updated;
      }));

      const erkannteAnzahl = result.erkannteFelder.length;
      if (erkannteAnzahl > 0) {
        toast.success(`${erkannteAnzahl} Felder automatisch erkannt (${result.konfidenz}% Konfidenz)`);
      } else {
        toast.info("Keine Daten automatisch erkannt");
      }
    } catch (error) {
      console.error("OCR Fehler:", error);
      toast.error("Fehler bei der Belegerkennung");
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(buchungId);
        return next;
      });
    }
  }, [analyzingIds, ocrMutation, pdfOcrMutation]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f => 
      f.type === "application/pdf" || 
      f.type.startsWith("image/")
    );
    
    if (validFiles.length > 0) {
      const newBuchungen = validFiles.map(file => {
        const buchung = {
          ...createEmptyBuchung(),
          belegDatei: file,
          belegnummer: file.name.replace(/\.[^/.]+$/, "").slice(0, 20)
        };
        return buchung;
      });
      setBuchungen(prev => [...prev, ...newBuchungen]);
      toast.success(`${validFiles.length} Beleg(e) hinzugefügt - Starte automatische Erkennung...`);
      
      // Starte OCR-Analyse für jeden Beleg
      newBuchungen.forEach(buchung => {
        if (buchung.belegDatei) {
          setTimeout(() => analyzeBeleg(buchung.id, buchung.belegDatei!), 100);
        }
      });
    } else {
      toast.error("Bitte nur PDF oder Bilddateien hochladen");
    }
  }, [createEmptyBuchung, analyzeBeleg]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newBuchungen = files.map(file => {
        const buchung = {
          ...createEmptyBuchung(),
          belegDatei: file,
          belegnummer: file.name.replace(/\.[^/.]+$/, "").slice(0, 20)
        };
        return buchung;
      });
      setBuchungen(prev => [...prev, ...newBuchungen]);
      toast.success(`${files.length} Beleg(e) hinzugefügt - Starte automatische Erkennung...`);
      
      // Starte OCR-Analyse für jeden Beleg
      newBuchungen.forEach(buchung => {
        if (buchung.belegDatei) {
          setTimeout(() => analyzeBeleg(buchung.id, buchung.belegDatei!), 100);
        }
      });
    }
  }, [createEmptyBuchung, analyzeBeleg]);

  const addEmptyBuchung = useCallback(() => {
    setBuchungen(prev => [...prev, createEmptyBuchung()]);
  }, [createEmptyBuchung]);

  const removeBuchung = useCallback((id: string) => {
    setBuchungen(prev => prev.filter(b => b.id !== id));
    toast.info("Buchung entfernt");
  }, []);

  const updateBuchung = useCallback((id: string, field: keyof Buchung, value: string | File | null) => {
    setBuchungen(prev => prev.map(b => {
      if (b.id !== id) return b;

      const updated = { ...b, [field]: value };

      // Auto-update Kontobereich bei Geschäftspartner-Typ-Änderung
      if (field === "geschaeftspartnerTyp") {
        const typ = GESCHAEFTSPARTNER_TYPEN.find(t => t.value === value);
        if (typ) {
          updated.geschaeftspartnerKonto = typ.kontobereich;
        }
      }

      // Auto-update Sachkonto bei Personenkonto-Änderung (basierend auf Kreditor-Stammdaten)
      if (field === "geschaeftspartnerKonto" && kreditorenList) {
        const kreditor = kreditorenList.find(k => k.kontonummer === value);
        if (kreditor?.standardSachkonto && !updated.sachkonto) {
          updated.sachkonto = kreditor.standardSachkonto;
        }
      }

      // Auto-calculate brutto when netto or steuersatz changes
      if (field === "nettobetrag" || field === "steuersatz") {
        const netto = field === "nettobetrag" ? value as string : b.nettobetrag;
        const steuer = field === "steuersatz" ? value as string : b.steuersatz;
        updated.bruttobetrag = calculateBrutto(netto, steuer);
      }

      // Auto-Kontierung: Wenn Buchungstext geändert wird, hole Vorschläge
      if (field === "buchungstext" && value && typeof value === "string" && value.length >= 3 && selectedUnternehmenId) {
        // Debounce: Nur wenn Text sich wirklich geändert hat
        setTimeout(async () => {
          try {
            const response = await fetch(`/trpc/kontierungsregeln.suggest?input=${encodeURIComponent(JSON.stringify({
              unternehmenId: selectedUnternehmenId,
              buchungstext: value
            }))}`);
            if (response.ok) {
              const result = await response.json();
              if (result.result?.data) {
                setAutoKontierungCache(prev => new Map(prev).set(id, result.result.data));
              }
            }
          } catch (error) {
            console.error("Auto-Kontierung Fehler:", error);
          }
        }, 500);
      }

      // Check if buchung is complete
      const isComplete =
        updated.belegdatum &&
        updated.belegnummer &&
        updated.geschaeftspartner &&
        updated.sachkonto &&
        updated.bruttobetrag;

      updated.status = isComplete ? "complete" : "pending";

      return updated;
    }));
  }, [kreditorenList, selectedUnternehmenId]);

  // Funktion zum Anwenden eines Auto-Kontierungs-Vorschlags
  const applyAutoKontierung = useCallback((buchungId: string, vorschlag: any, accepted: boolean) => {
    if (accepted) {
      setBuchungen(prev => prev.map(b => {
        if (b.id !== buchungId) return b;
        const updated = {
          ...b,
          sachkonto: vorschlag.sollKonto,
          geschaeftspartnerKonto: vorschlag.habenKonto,
          steuersatz: vorschlag.ustSatz.toString(),
          bruttobetrag: calculateBrutto(b.nettobetrag, vorschlag.ustSatz.toString()),
        };
        // Check completeness
        const isComplete =
          updated.belegdatum &&
          updated.belegnummer &&
          updated.geschaeftspartner &&
          updated.sachkonto &&
          updated.bruttobetrag;
        updated.status = isComplete ? "complete" : "pending";
        return updated;
      }));
      toast.success("Kontierung angewendet");
    }

    // Markiere Regel als verwendet
    if (vorschlag.regelId) {
      markUsedMutation.mutate({
        id: vorschlag.regelId,
        erfolg: accepted,
      });
    }

    // Entferne Vorschlag aus Cache
    setAutoKontierungCache(prev => {
      const next = new Map(prev);
      next.delete(buchungId);
      return next;
    });
  }, [markUsedMutation]);

  const handleExport = useCallback(() => {
    const completeBuchungen = buchungen.filter(b => b.status === "complete");
    if (completeBuchungen.length === 0) {
      toast.error("Keine vollständigen Buchungen zum Exportieren");
      return;
    }
    
    const csvContent = generateDATEVExport(buchungen);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const filename = `EXTF_Buchungsstapel_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
    
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${completeBuchungen.length} Buchung(en) exportiert`);
  }, [buchungen]);

  const completeBuchungenCount = buchungen.filter(b => b.status === "complete").length;
  const totalBrutto = buchungen
    .filter(b => b.status === "complete")
    .reduce((sum, b) => sum + parseFloat(b.bruttobetrag.replace(",", ".") || "0"), 0);

  // Konten basierend auf Buchungsart - nutzt Sachkonten aus der Datenbank wenn verfügbar
  const getKontenForBuchungsart = (art: string) => {
    // Wenn Sachkonten aus der Datenbank geladen sind, diese verwenden
    if (sachkontenGrouped && Object.keys(sachkontenGrouped).length > 0) {
      // Alle Sachkonten aus allen Kategorien zusammenführen
      const allKonten: { konto: string; bezeichnung: string; kategorie?: string }[] = [];
      for (const [kategorie, konten] of Object.entries(sachkontenGrouped)) {
        for (const konto of konten as any[]) {
          allKonten.push({
            konto: konto.kontonummer,
            bezeichnung: konto.bezeichnung,
            kategorie
          });
        }
      }
      return allKonten;
    }
    
    // Fallback auf statischen Kontenrahmen
    switch (art) {
      case "aufwand": return KONTENRAHMEN_SKR03.aufwand;
      case "ertrag": return KONTENRAHMEN_SKR03.ertrag;
      case "anlage": return KONTENRAHMEN_SKR03.anlage;
      default: return [...KONTENRAHMEN_SKR03.finanz, ...KONTENRAHMEN_SKR03.eigenkapital];
    }
  };

  // Prüfe ob Sachkonten aus der Datenbank verfügbar sind
  const hasDatabaseSachkonten = sachkontenGrouped && Object.keys(sachkontenGrouped).length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header mit Firmenauswahl */}
      <AppHeader />
      
      {/* Statistik-Leiste */}
      <div className="border-b border-border bg-card">
        <div className="container py-3">
          <div className="flex items-center justify-end gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Vollständige Buchungen</p>
              <p className="text-lg font-semibold tabular-nums">{completeBuchungenCount} / {buchungen.length}</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Gesamtbetrag (brutto)</p>
              <p className="text-lg font-semibold tabular-nums font-mono">{formatCurrency(totalBrutto.toFixed(2))} €</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-8">
        {/* Dashboard-Widgets für offene Aufgaben und Finanzamt-Fristen */}
        {selectedUnternehmenId && ((aufgabenStats?.ueberfaellig || 0) > 0 || (finanzamtStats?.ueberfaelligeFristen || 0) > 0 || (offeneAufgaben?.length || 0) > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Offene Aufgaben Widget */}
            <Link href="/aufgaben">
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Offene Aufgaben</p>
                      <p className="text-2xl font-bold">{aufgabenStats?.offen || 0}</p>
                      {(aufgabenStats?.ueberfaellig || 0) > 0 && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {aufgabenStats?.ueberfaellig} überfällig
                        </p>
                      )}
                    </div>
                    <div className="p-3 rounded-full bg-amber-100">
                      <Bell className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Finanzamt-Fristen Widget */}
            <Link href="/finanzamt">
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Finanzamt-Fristen</p>
                      <p className="text-2xl font-bold">{finanzamtStats?.ueberfaelligeFristen || 0}</p>
                      {(finanzamtStats?.ueberfaelligeFristen || 0) > 0 && (
                        <p className="text-xs text-blue-600 mt-1">offene Fristen</p>
                      )}
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Dringende Aufgaben Widget */}
            {offeneAufgaben && offeneAufgaben.filter((a: any) => a.prioritaet === "dringend" || a.prioritaet === "hoch").length > 0 && (
              <Link href="/aufgaben">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Dringend/Hoch</p>
                        <p className="text-2xl font-bold">
                          {offeneAufgaben.filter((a: any) => a.prioritaet === "dringend" || a.prioritaet === "hoch").length}
                        </p>
                        <p className="text-xs text-red-600 mt-1">hohe Priorität</p>
                      </div>
                      <div className="p-3 rounded-full bg-red-100">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        )}

        {/* Upload Zone */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Belege hochladen
            </CardTitle>
            <CardDescription>
              Ziehen Sie Ihre Belege (PDF, JPG, PNG) hierher oder klicken Sie zum Auswählen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Belege hier ablegen</p>
              <p className="text-sm text-muted-foreground">oder klicken zum Auswählen</p>
              <input
                id="fileInput"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </CardContent>
        </Card>

        {/* Buchungen */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Buchungen ({buchungen.length})</h2>
            <div className="flex gap-2 flex-wrap">
              {/* Quick-Booking Button */}
              {selectedUnternehmenId && (
                <QuickBookingDialog
                  unternehmenId={selectedUnternehmenId}
                  onVorlageSelected={(vorlage) => {
                    // Neue Buchung aus Vorlage erstellen
                    const neueBuchung = {
                      ...createEmptyBuchung(),
                      sachkonto: vorlage.sollKonto,
                      geschaeftspartnerKonto: vorlage.habenKonto,
                      buchungstext: vorlage.buchungstext,
                      steuersatz: vorlage.ustSatz.toString(),
                      geschaeftspartner: vorlage.geschaeftspartner || "",
                      nettobetrag: vorlage.betrag ? parseFloat(vorlage.betrag).toFixed(2).replace(".", ",") : "",
                      bruttobetrag: vorlage.betrag ? calculateBrutto(
                        parseFloat(vorlage.betrag).toFixed(2).replace(".", ","),
                        vorlage.ustSatz.toString()
                      ) : "",
                      status: "pending" as const,
                    };
                    setBuchungen(prev => [...prev, neueBuchung]);
                  }}
                />
              )}

              <Button variant="outline" onClick={addEmptyBuchung}>
                <Plus className="w-4 h-4 mr-2" />
                Manuelle Buchung
              </Button>
              <Button
                onClick={handleExport}
                disabled={completeBuchungenCount === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                DATEV Export
              </Button>

            </div>
          </div>

          {buchungen.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Noch keine Buchungen</p>
                <p className="text-sm">Laden Sie Belege hoch oder erstellen Sie eine manuelle Buchung</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Buchungsliste - 2/3 Breite */}
              <div className="lg:col-span-2 space-y-4">
                {buchungen.map((buchung) => (
                  <Card 
                    key={buchung.id} 
                    className={`transition-all cursor-pointer hover:shadow-md ${
                      buchung.status === "complete" ? "border-green-200 bg-green-50/30" : ""
                    } ${selectedBuchungId === buchung.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedBuchungId(buchung.id)}
                  >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className="pt-2">
                        {buchung.status === "complete" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                        )}
                      </div>

                      {/* Form Fields */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Buchungsart */}
                        <div className="space-y-2">
                          <Label>Buchungsart</Label>
                          <Select 
                            value={buchung.buchungsart} 
                            onValueChange={(v) => updateBuchung(buchung.id, "buchungsart", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BUCHUNGSARTEN.map((art) => (
                                <SelectItem key={art.value} value={art.value}>
                                  {art.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Belegdatum */}
                        <div className="space-y-2">
                          <Label htmlFor={`datum-${buchung.id}`}>Belegdatum</Label>
                          <Input
                            id={`datum-${buchung.id}`}
                            type="date"
                            value={buchung.belegdatum}
                            onChange={(e) => updateBuchung(buchung.id, "belegdatum", e.target.value)}
                          />
                        </div>

                        {/* Belegnummer */}
                        <div className="space-y-2">
                          <Label htmlFor={`belegnr-${buchung.id}`}>Belegnummer</Label>
                          <Input
                            id={`belegnr-${buchung.id}`}
                            placeholder="RE-2025-001"
                            value={buchung.belegnummer}
                            onChange={(e) => updateBuchung(buchung.id, "belegnummer", e.target.value)}
                          />
                        </div>

                        {/* Geschäftspartner Typ */}
                        <div className="space-y-2">
                          <Label>Partner-Typ</Label>
                          <Select 
                            value={buchung.geschaeftspartnerTyp} 
                            onValueChange={(v) => updateBuchung(buchung.id, "geschaeftspartnerTyp", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GESCHAEFTSPARTNER_TYPEN.map((typ) => (
                                <SelectItem key={typ.value} value={typ.value}>
                                  {typ.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Geschäftspartner Name */}
                        <div className="space-y-2">
                          <Label htmlFor={`partner-${buchung.id}`}>Geschäftspartner</Label>
                          <Input
                            id={`partner-${buchung.id}`}
                            placeholder="Firmenname"
                            value={buchung.geschaeftspartner}
                            onChange={(e) => updateBuchung(buchung.id, "geschaeftspartner", e.target.value)}
                          />
                        </div>

                        {/* Geschäftspartner Konto */}
                        <div className="space-y-2">
                          <Label htmlFor={`partnerkonto-${buchung.id}`}>Personenkonto</Label>
                          <Input
                            id={`partnerkonto-${buchung.id}`}
                            placeholder="70000"
                            value={buchung.geschaeftspartnerKonto}
                            onChange={(e) => updateBuchung(buchung.id, "geschaeftspartnerKonto", e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        {/* Sachkonto mit Suchfunktion */}
                        <div className="space-y-2">
                          <Label>Sachkonto</Label>
                          <SachkontoCombobox
                            value={buchung.sachkonto}
                            onValueChange={(v) => updateBuchung(buchung.id, "sachkonto", v)}
                            sachkontenGrouped={sachkontenGrouped as any}
                            fallbackKonten={getKontenForBuchungsart(buchung.buchungsart)}
                            placeholder="Konto suchen..."
                          />
                        </div>

                        {/* Kostenstelle */}
                        <div className="space-y-2">
                          <Label htmlFor={`kst-${buchung.id}`}>Kostenstelle</Label>
                          <Input
                            id={`kst-${buchung.id}`}
                            placeholder="Optional"
                            value={buchung.kostenstelle}
                            onChange={(e) => updateBuchung(buchung.id, "kostenstelle", e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        {/* Nettobetrag */}
                        <div className="space-y-2">
                          <Label htmlFor={`netto-${buchung.id}`}>Nettobetrag</Label>
                          <Input
                            id={`netto-${buchung.id}`}
                            placeholder="0,00"
                            value={buchung.nettobetrag}
                            onChange={(e) => updateBuchung(buchung.id, "nettobetrag", e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        {/* Steuersatz */}
                        <div className="space-y-2">
                          <Label>Steuersatz</Label>
                          <Select 
                            value={buchung.steuersatz} 
                            onValueChange={(v) => updateBuchung(buchung.id, "steuersatz", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {KONTENRAHMEN_SKR03.steuer.map((s) => (
                                <SelectItem key={s.satz} value={s.satz}>
                                  {s.bezeichnung}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bruttobetrag */}
                        <div className="space-y-2">
                          <Label htmlFor={`brutto-${buchung.id}`}>Bruttobetrag</Label>
                          <Input
                            id={`brutto-${buchung.id}`}
                            placeholder="0,00"
                            value={buchung.bruttobetrag}
                            onChange={(e) => updateBuchung(buchung.id, "bruttobetrag", e.target.value)}
                            className="font-mono bg-muted/50"
                            readOnly
                          />
                        </div>

                        {/* Buchungstext */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`text-${buchung.id}`}>Buchungstext</Label>
                          <Textarea
                            id={`text-${buchung.id}`}
                            placeholder="Beschreibung der Buchung..."
                            value={buchung.buchungstext}
                            onChange={(e) => updateBuchung(buchung.id, "buchungstext", e.target.value)}
                            rows={2}
                          />
                          {/* Auto-Kontierung Vorschläge */}
                          {autoKontierungCache.has(buchung.id) && autoKontierungCache.get(buchung.id)?.vorschlaege?.length > 0 && (
                            <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-900">Automatische Kontierungsvorschläge</span>
                              </div>
                              {autoKontierungCache.get(buchung.id).vorschlaege.slice(0, 3).map((vorschlag: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-2 mt-2 p-2 bg-white rounded border border-purple-100">
                                  <div className="flex-1 text-xs">
                                    <div className="flex gap-2 items-center">
                                      <span className="font-medium">Soll: {vorschlag.sollKonto}</span>
                                      <span className="text-muted-foreground">→</span>
                                      <span className="font-medium">Haben: {vorschlag.habenKonto}</span>
                                      <span className="text-muted-foreground">•</span>
                                      <span>USt: {vorschlag.ustSatz}%</span>
                                      {vorschlag.verwendungen > 0 && (
                                        <>
                                          <span className="text-muted-foreground">•</span>
                                          <span className="text-green-600">{Math.round(parseFloat(vorschlag.erfolgsrate))}% Erfolg</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="text-muted-foreground mt-1">Regel: "{vorschlag.suchbegriff}"</div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 px-3 bg-purple-600 hover:bg-purple-700"
                                      onClick={() => applyAutoKontierung(buchung.id, vorschlag, true)}
                                    >
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Anwenden
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2"
                                      onClick={() => applyAutoKontierung(buchung.id, vorschlag, false)}
                                    >
                                      <Ban className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Zahlungsstatus */}
                        <div className="space-y-2">
                          <Label>Zahlungsstatus</Label>
                          <Select 
                            value={buchung.zahlungsstatus} 
                            onValueChange={(v) => {
                              updateBuchung(buchung.id, "zahlungsstatus", v);
                              // Setze Zahlungsdatum automatisch wenn auf "bezahlt" gesetzt
                              if (v === "bezahlt" && !buchung.zahlungsdatum) {
                                updateBuchung(buchung.id, "zahlungsdatum", new Date().toISOString().split("T")[0]);
                              }
                            }}
                          >
                            <SelectTrigger className={`${
                              buchung.zahlungsstatus === "offen" ? "border-amber-300 bg-amber-50/50" :
                              buchung.zahlungsstatus === "bezahlt" ? "border-green-300 bg-green-50/50" :
                              buchung.zahlungsstatus === "teilbezahlt" ? "border-blue-300 bg-blue-50/50" :
                              "border-red-300 bg-red-50/50"
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ZAHLUNGSSTATUS_OPTIONEN.map((status) => {
                                const Icon = status.icon;
                                return (
                                  <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-4 h-4 ${status.color}`} />
                                      {status.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Fälligkeitsdatum */}
                        <div className="space-y-2">
                          <Label htmlFor={`faelligkeit-${buchung.id}`} className="flex items-center gap-1">
                            Fälligkeit
                            {buchung.faelligkeitsdatum && new Date(buchung.faelligkeitsdatum) < new Date() && buchung.zahlungsstatus === "offen" && (
                              <span className="text-xs text-red-500 font-medium">Überfällig!</span>
                            )}
                          </Label>
                          <Input
                            id={`faelligkeit-${buchung.id}`}
                            type="date"
                            value={buchung.faelligkeitsdatum}
                            onChange={(e) => updateBuchung(buchung.id, "faelligkeitsdatum", e.target.value)}
                            className={`${
                              buchung.faelligkeitsdatum && new Date(buchung.faelligkeitsdatum) < new Date() && buchung.zahlungsstatus === "offen"
                                ? "border-red-300 bg-red-50/50"
                                : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {/* An Steuerberater Button */}
                        {buchung.status === "complete" && !buchung.anSteuerberaterUebergeben && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStbBuchungId(buchung.id);
                              setStbDialogOpen(true);
                            }}
                            title="An Steuerberater übergeben"
                          >
                            <Send className="w-5 h-5" />
                          </Button>
                        )}
                        
                        {/* Übergeben-Indikator */}
                        {buchung.anSteuerberaterUebergeben && (
                          <div className="p-2" title="An Steuerberater übergeben">
                            <CheckCircle2 className="w-5 h-5 text-teal-600" />
                          </div>
                        )}
                        
                        {/* Analyse Button */}
                        {buchung.belegDatei && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              analyzeBeleg(buchung.id, buchung.belegDatei!);
                            }}
                            disabled={analyzingIds.has(buchung.id)}
                            title="Beleg erneut analysieren"
                          >
                            {analyzingIds.has(buchung.id) ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Wand2 className="w-5 h-5" />
                            )}
                          </Button>
                        )}
                        
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBuchung(buchung.id);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Beleg Info mit erkannten Daten */}
                    {buchung.belegDatei && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {/* Datei-Info */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>{buchung.belegDatei.name}</span>
                          <span className="text-xs">({(buchung.belegDatei.size / 1024).toFixed(1)} KB)</span>
                          {analyzingIds.has(buchung.id) && (
                            <span className="flex items-center gap-1 text-primary ml-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span className="text-xs">Analysiere...</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Erkannte Daten - nur anzeigen wenn vorhanden */}
                        {(buchung.belegdatum || buchung.belegnummer || buchung.iban || buchung.ustIdNr) && (
                          <div className="flex flex-wrap gap-4 text-xs">
                            {buchung.belegdatum && (
                              <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded">
                                <Calendar className="w-3 h-3 text-primary" />
                                <span className="text-muted-foreground">Datum:</span>
                                <span className="font-medium">{new Date(buchung.belegdatum).toLocaleDateString('de-DE')}</span>
                              </div>
                            )}
                            {buchung.belegnummer && (
                              <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded">
                                <Hash className="w-3 h-3 text-primary" />
                                <span className="text-muted-foreground">Beleg-Nr:</span>
                                <span className="font-medium font-mono">{buchung.belegnummer}</span>
                              </div>
                            )}
                            {buchung.iban && (
                              <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded">
                                <Building2 className="w-3 h-3 text-green-600" />
                                <span className="text-muted-foreground">IBAN:</span>
                                <span className="font-medium font-mono text-green-700">{buchung.iban}</span>
                              </div>
                            )}
                            {buchung.ustIdNr && (
                              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded">
                                <FileSpreadsheet className="w-3 h-3 text-blue-600" />
                                <span className="text-muted-foreground">USt-ID:</span>
                                <span className="font-medium font-mono text-blue-700">{buchung.ustIdNr}</span>
                              </div>
                            )}
                            {/* Kreditor-Match Anzeige */}
                            {buchung.kreditorMatch !== "none" && (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                                buchung.kreditorMatch === "exact" ? "bg-green-100" : "bg-amber-50"
                              }`}>
                                <Link2 className={`w-3 h-3 ${
                                  buchung.kreditorMatch === "exact" ? "text-green-600" : "text-amber-600"
                                }`} />
                                <span className="text-muted-foreground">Kreditor:</span>
                                <span className={`font-medium ${
                                  buchung.kreditorMatch === "exact" ? "text-green-700" : "text-amber-700"
                                }`}>
                                  {buchung.kreditorMatch === "exact" ? "✓ IBAN-Match" : "≈ Name-Match"}
                                </span>
                              </div>
                            )}
                            {/* Fälligkeit Anzeige */}
                            {buchung.faelligkeitsdatum && (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                                new Date(buchung.faelligkeitsdatum) < new Date() && buchung.zahlungsstatus === "offen"
                                  ? "bg-red-100"
                                  : buchung.zahlungsstatus === "bezahlt"
                                    ? "bg-green-50"
                                    : "bg-gray-50"
                              }`}>
                                <Clock className={`w-3 h-3 ${
                                  new Date(buchung.faelligkeitsdatum) < new Date() && buchung.zahlungsstatus === "offen"
                                    ? "text-red-600"
                                    : buchung.zahlungsstatus === "bezahlt"
                                      ? "text-green-600"
                                      : "text-gray-600"
                                }`} />
                                <span className="text-muted-foreground">Fällig:</span>
                                <span className={`font-medium ${
                                  new Date(buchung.faelligkeitsdatum) < new Date() && buchung.zahlungsstatus === "offen"
                                    ? "text-red-700"
                                    : buchung.zahlungsstatus === "bezahlt"
                                      ? "text-green-700"
                                      : "text-gray-700"
                                }`}>
                                  {new Date(buchung.faelligkeitsdatum).toLocaleDateString('de-DE')}
                                  {new Date(buchung.faelligkeitsdatum) < new Date() && buchung.zahlungsstatus === "offen" && " (Überfällig!)"}
                                  {buchung.zahlungsstatus === "bezahlt" && " (Bezahlt)"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
              
              {/* Beleg-Vorschau - 1/3 Breite */}
              <div className="lg:col-span-1">
                <div className="sticky top-32">
                  <BelegVorschau 
                    file={selectedBuchung?.belegDatei || null}
                    onClose={() => setSelectedBuchungId(null)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Steuerberater-Übergabe Dialog */}
        <Dialog open={stbDialogOpen} onOpenChange={setStbDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>An Steuerberater übergeben</DialogTitle>
              <DialogDescription>
                Wählen Sie eine bestehende Übergabe aus oder erstellen Sie eine neue im Steuerberater-Modul.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Übergabe auswählen</Label>
                <Select 
                  value={selectedUebergabeId?.toString() || ""} 
                  onValueChange={(v) => setSelectedUebergabeId(v ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Übergabe wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uebergaben?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.bezeichnung} ({new Date(u.uebergabedatum).toLocaleDateString("de-DE")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(!uebergaben || uebergaben.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Keine Übergaben vorhanden. Erstellen Sie zuerst eine Übergabe im{" "}
                  <Link href="/steuerberater" className="text-teal-600 hover:underline">Steuerberater-Modul</Link>.
                </p>
              )}

              {/* Buchungs-Info */}
              {stbBuchungId && (() => {
                const buchung = buchungen.find(b => b.id === stbBuchungId);
                if (!buchung) return null;
                return (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium">{buchung.geschaeftspartner}</p>
                    <p className="text-muted-foreground">
                      {buchung.belegnummer} • {new Date(buchung.belegdatum).toLocaleDateString("de-DE")} • {buchung.bruttobetrag} €
                    </p>
                  </div>
                );
              })()}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setStbDialogOpen(false);
                setStbBuchungId(null);
                setSelectedUebergabeId(null);
              }}>Abbrechen</Button>
              <Button 
                onClick={async () => {
                  if (stbBuchungId && selectedUebergabeId && selectedUnternehmenId) {
                    const buchung = buchungen.find(b => b.id === stbBuchungId);
                    if (buchung) {
                      try {
                        let belegUrl: string | undefined = undefined;
                        
                        // 1. Falls Beleg vorhanden, zu S3 hochladen
                        if (buchung.belegDatei) {
                          toast.info("Beleg wird hochgeladen...");
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(buchung.belegDatei!);
                          });
                          
                          const uploadResult = await uploadBelegMutation.mutateAsync({
                            unternehmenId: selectedUnternehmenId,
                            dateiName: buchung.belegDatei.name,
                            dateiBase64: base64,
                            contentType: buchung.belegDatei.type,
                          });
                          belegUrl = uploadResult.url;
                        }
                        
                        // 2. Buchung in der Datenbank speichern
                        toast.info("Buchung wird gespeichert...");
                        const result = await createBuchungMutation.mutateAsync({
                          unternehmenId: selectedUnternehmenId,
                          buchungsart: buchung.buchungsart,
                          belegdatum: buchung.belegdatum,
                          belegnummer: buchung.belegnummer,
                          geschaeftspartnerTyp: buchung.geschaeftspartnerTyp,
                          geschaeftspartner: buchung.geschaeftspartner,
                          geschaeftspartnerKonto: buchung.geschaeftspartnerKonto,
                          sachkonto: buchung.sachkonto,
                          nettobetrag: buchung.nettobetrag.replace(",", "."),
                          steuersatz: buchung.steuersatz,
                          bruttobetrag: buchung.bruttobetrag.replace(",", "."),
                          buchungstext: buchung.buchungstext || undefined,
                          belegUrl: belegUrl,
                        });
                        
                        // 3. Buchung zur Übergabe hinzufügen
                        await addBuchungToUebergabeMutation.mutateAsync({
                          uebergabeId: selectedUebergabeId,
                          buchungIds: [result.id],
                        });
                        
                        // 4. Lokale Buchung als übergeben markieren
                        setBuchungen(prev => prev.map(b => 
                          b.id === stbBuchungId 
                            ? { ...b, anSteuerberaterUebergeben: true, steuerberaterUebergabeId: selectedUebergabeId }
                            : b
                        ));
                        
                        const belegInfo = belegUrl ? " (inkl. Beleg)" : "";
                        toast.success(`Buchung "${buchung.geschaeftspartner}" gespeichert und zur Übergabe hinzugefügt${belegInfo}`);
                        setStbDialogOpen(false);
                        setStbBuchungId(null);
                        setSelectedUebergabeId(null);
                      } catch (error: any) {
                        toast.error(`Fehler: ${error.message}`);
                      }
                    }
                  }
                }}
                disabled={!selectedUebergabeId || !selectedUnternehmenId || createBuchungMutation.isPending || addBuchungToUebergabeMutation.isPending || uploadBelegMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {(createBuchungMutation.isPending || addBuchungToUebergabeMutation.isPending || uploadBelegMutation.isPending) ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</>
                ) : (
                  "Speichern & Übergeben"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
