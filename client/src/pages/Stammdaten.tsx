import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import Kontierungsregeln from "@/components/Kontierungsregeln";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Save,
  Building2,
  Users,
  Landmark,
  Car,
  Briefcase,
  CreditCard,
  FolderTree,
  FileText,
  Search,
  Factory,
  UserCircle,
  PiggyBank,
  Calculator,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";

// Typen für alle Stammdaten
interface Stammdatum {
  id: string;
  typ: string;
  name: string;
  kontonummer: string;
  details: Record<string, string>;
  notizen: string;
  erstelltAm: string;
  aktualisiertAm: string;
}

// Konfiguration für alle Stammdaten-Typen
const STAMMDATEN_TYPEN = [
  {
    value: "kreditor",
    label: "Kreditoren",
    labelSingular: "Kreditor",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    kontobereich: "70000-79999",
    felder: [
      { key: "firma", label: "Firma/Name", required: true },
      { key: "ansprechpartner", label: "Ansprechpartner" },
      { key: "strasse", label: "Straße" },
      { key: "plz", label: "PLZ" },
      { key: "ort", label: "Ort" },
      { key: "telefon", label: "Telefon" },
      { key: "email", label: "E-Mail" },
      { key: "ustid", label: "USt-IdNr." },
      { key: "vorsteuersatz", label: "Vorsteuersatz (%)" },
      { key: "iban", label: "IBAN" },
      { key: "zahlungsziel", label: "Zahlungsziel (Tage)" },
      { key: "standardSachkonto", label: "Standard-Sachkonto" },
    ]
  },
  {
    value: "debitor",
    label: "Debitoren",
    labelSingular: "Debitor",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-100",
    kontobereich: "1800",
    felder: [
      { key: "firma", label: "Firma/Name", required: true },
      { key: "ansprechpartner", label: "Ansprechpartner" },
      { key: "strasse", label: "Straße" },
      { key: "plz", label: "PLZ" },
      { key: "ort", label: "Ort" },
      { key: "telefon", label: "Telefon" },
      { key: "email", label: "E-Mail" },
      { key: "ustid", label: "USt-IdNr." },
      { key: "umsatzsteuersatz", label: "Umsatzsteuersatz (%)" },
      { key: "kreditlimit", label: "Kreditlimit (€)" },
      { key: "zahlungsziel", label: "Zahlungsziel (Tage)" },
    ]
  },
  { 
    value: "beteiligung", 
    label: "Beteiligungen", 
    labelSingular: "Beteiligung",
    icon: Factory, 
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    kontobereich: "0600-0699",
    felder: [
      { key: "firma", label: "Unternehmensname", required: true },
      { key: "rechtsform", label: "Rechtsform" },
      { key: "anteil", label: "Anteil (%)" },
      { key: "nennwert", label: "Nennwert (€)" },
      { key: "buchwert", label: "Buchwert (€)" },
      { key: "erwerbsdatum", label: "Erwerbsdatum" },
      { key: "handelsregister", label: "Handelsregister" },
      { key: "sitz", label: "Sitz der Gesellschaft" },
    ]
  },
  { 
    value: "anlagevermoegen", 
    label: "Anlagevermögen", 
    labelSingular: "Anlagegut",
    icon: Car, 
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    kontobereich: "0100-0899",
    felder: [
      { key: "bezeichnung", label: "Bezeichnung", required: true },
      { key: "kategorie", label: "Kategorie (Gebäude/Maschine/Fahrzeug/etc.)" },
      { key: "anschaffungsdatum", label: "Anschaffungsdatum" },
      { key: "anschaffungskosten", label: "Anschaffungskosten (€)" },
      { key: "nutzungsdauer", label: "Nutzungsdauer (Jahre)" },
      { key: "abschreibungsmethode", label: "Abschreibungsmethode" },
      { key: "restwert", label: "Aktueller Restwert (€)" },
      { key: "standort", label: "Standort" },
      { key: "inventarnummer", label: "Inventarnummer" },
      { key: "seriennummer", label: "Seriennummer" },
    ]
  },
  { 
    value: "gesellschafter", 
    label: "Gesellschafter", 
    labelSingular: "Gesellschafter",
    icon: UserCircle, 
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    kontobereich: "0800-0899",
    felder: [
      { key: "name", label: "Name", required: true },
      { key: "typ", label: "Typ (natürliche/juristische Person)" },
      { key: "anteil", label: "Anteil (%)" },
      { key: "einlage", label: "Einlage (€)" },
      { key: "strasse", label: "Straße" },
      { key: "plz", label: "PLZ" },
      { key: "ort", label: "Ort" },
      { key: "steuernummer", label: "Steuernummer" },
      { key: "eintrittsdatum", label: "Eintrittsdatum" },
    ]
  },
  {
    value: "bankkonto",
    label: "Bankkonten",
    labelSingular: "Bankkonto",
    icon: Landmark,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    kontobereich: "1200-1299",
    felder: [
      { key: "bankname", label: "Bankname", required: true },
      { key: "iban", label: "IBAN", required: true },
      { key: "bic", label: "BIC" },
      { key: "kontoinhaber", label: "Kontoinhaber" },
      { key: "waehrung", label: "Währung" },
      { key: "kontotyp", label: "Kontotyp (Giro/Festgeld/etc.)" },
      { key: "kreditlinie", label: "Kreditlinie (€)" },
    ]
  },
  {
    value: "kreditkarte",
    label: "Kreditkarten",
    labelSingular: "Kreditkarte",
    icon: CreditCard,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    kontobereich: "1250-1259",
    felder: [
      { key: "name", label: "Kartenname", required: true },
      { key: "provider", label: "Anbieter", required: true, options: ["Soldo Master", "Payhawk", "American Express", "Sonstiges"] },
      { key: "lastFour", label: "Letzte 4 Stellen" },
      { key: "creditLimit", label: "Kreditlimit (€)" },
      { key: "billingDay", label: "Abrechnungstag (1-31)" },
      { key: "currency", label: "Währung" },
    ]
  },
  {
    value: "zahlungsdienstleister",
    label: "Zahlungsdienstleister",
    labelSingular: "Zahlungsdienstleister",
    icon: ArrowRightLeft,
    color: "text-violet-600",
    bgColor: "bg-violet-100",
    kontobereich: "1260-1269",
    felder: [
      { key: "name", label: "Kontoname", required: true },
      { key: "provider", label: "Anbieter", required: true, options: ["Sparkasse", "Sumup", "Stripe", "PayPal", "Sonstiges"] },
      { key: "accountId", label: "Konto-ID/E-Mail" },
      { key: "feePercent", label: "Gebühren (%)" },
      { key: "currency", label: "Währung" },
    ]
  },
  {
    value: "brokerkonto",
    label: "Brokerkonten",
    labelSingular: "Brokerkonto",
    icon: PiggyBank,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    kontobereich: "1270-1279",
    felder: [
      { key: "name", label: "Depotname", required: true },
      { key: "broker", label: "Broker", required: true },
      { key: "depotNumber", label: "Depotnummer" },
      { key: "clearingAccount", label: "Verrechnungskonto" },
      { key: "currency", label: "Währung" },
    ]
  },
  {
    value: "kostenstelle", 
    label: "Kostenstellen", 
    labelSingular: "Kostenstelle",
    icon: FolderTree, 
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    kontobereich: "KST",
    felder: [
      { key: "bezeichnung", label: "Bezeichnung", required: true },
      { key: "nummer", label: "Kostenstellennummer" },
      { key: "verantwortlicher", label: "Verantwortlicher" },
      { key: "abteilung", label: "Abteilung" },
      { key: "budget", label: "Jahresbudget (€)" },
      { key: "uebergeordnet", label: "Übergeordnete Kostenstelle" },
    ]
  },
  { 
    value: "vertrag", 
    label: "Verträge", 
    labelSingular: "Vertrag",
    icon: FileText, 
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    kontobereich: "-",
    felder: [
      { key: "bezeichnung", label: "Vertragsbezeichnung", required: true },
      { key: "vertragsart", label: "Vertragsart (Miet/Leasing/Wartung/etc.)" },
      { key: "vertragspartner", label: "Vertragspartner" },
      { key: "vertragsnummer", label: "Vertragsnummer" },
      { key: "beginn", label: "Vertragsbeginn" },
      { key: "ende", label: "Vertragsende" },
      { key: "kuendigungsfrist", label: "Kündigungsfrist" },
      { key: "betrag", label: "Monatlicher Betrag (€)" },
      { key: "zahlungsrhythmus", label: "Zahlungsrhythmus" },
      { key: "buchungskonto", label: "Buchungskonto" },
    ]
  },
  { 
    value: "sachkonto", 
    label: "Sachkonten", 
    labelSingular: "Sachkonto",
    icon: Calculator, 
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    kontobereich: "4000-7999",
    felder: [
      { key: "kontonummer", label: "Kontonummer", required: true },
      { key: "bezeichnung", label: "Bezeichnung", required: true },
      { key: "kategorie", label: "Kategorie" },
      { key: "kontotyp", label: "Kontotyp (aufwand/ertrag/aktiv/passiv)" },
      { key: "standardSteuersatz", label: "Standard-Steuersatz (%)" },
    ]
  },
];

// ─── Verträge v2: Konstanten ──────────────────────────────────────────────────

const VERTRAGSART_LABELS: Record<string, string> = {
  miete: "Miete",
  leasing: "Leasing",
  wartung: "Wartung & Service",
  versicherung: "Versicherung",
  abo: "Abo / Subscription",
  darlehen: "Darlehen",
  pacht: "Pacht",
  lizenz: "Lizenz",
  dienstleistung: "Dienstleistung",
  sonstig: "Sonstiger Vertrag",
};

// Kontenrahmen-spezifische Standardkonten (Aufwandskonten) je Vertragsart
const VERTRAGS_KONTEN: Record<string, Record<string, string>> = {
  SKR04: {
    miete: "6310", leasing: "6560", wartung: "6805", versicherung: "6400",
    abo: "6825", lizenz: "6820", arbeitsvertrag: "6010", darlehen: "7310",
    rahmenvertrag: "6300", dienstleistung: "6800", pacht: "6315", sonstig: "6300",
    gegenkonto: "1600", vorsteuer: "1406",
  },
  SKR03: {
    miete: "4210", leasing: "4570", wartung: "4950", versicherung: "4360",
    abo: "4970", lizenz: "4980", arbeitsvertrag: "4100", darlehen: "2150",
    rahmenvertrag: "4900", dienstleistung: "4800", pacht: "4220", sonstig: "4900",
    gegenkonto: "1600", vorsteuer: "1576",
  },
  OeKR: {
    miete: "7400", leasing: "7690", wartung: "7600", versicherung: "7500",
    abo: "7680", lizenz: "7670", arbeitsvertrag: "6000", darlehen: "8280",
    rahmenvertrag: "7800", dienstleistung: "7200", pacht: "7420", sonstig: "7800",
    gegenkonto: "3300", vorsteuer: "2500",
  },
  KMU: {
    miete: "6000", leasing: "6200", wartung: "6300", versicherung: "6500",
    abo: "6840", lizenz: "6800", arbeitsvertrag: "5000", darlehen: "6900",
    rahmenvertrag: "6960", dienstleistung: "6400", pacht: "6100", sonstig: "6960",
    gegenkonto: "2000", vorsteuer: "1170",
  },
  RLG: {
    miete: "7400", leasing: "7690", wartung: "7600", versicherung: "7500",
    abo: "7680", lizenz: "7670", arbeitsvertrag: "6000", darlehen: "8280",
    rahmenvertrag: "7800", dienstleistung: "7200", pacht: "7420", sonstig: "7800",
    gegenkonto: "3300", vorsteuer: "2500",
  },
  OR: {
    miete: "6000", leasing: "6200", wartung: "6300", versicherung: "6500",
    abo: "6840", lizenz: "6800", arbeitsvertrag: "5000", darlehen: "6900",
    rahmenvertrag: "6960", dienstleistung: "6400", pacht: "6100", sonstig: "6960",
    gegenkonto: "2000", vorsteuer: "1170",
  },
};

const UST_SAETZE: Record<string, { satz: string; label: string }[]> = {
  DE: [
    { satz: "0", label: "0 % (steuerfrei)" },
    { satz: "7", label: "7 % (ermäßigt)" },
    { satz: "19", label: "19 % (Regelsteuersatz)" },
  ],
  AT: [
    { satz: "0", label: "0 % (steuerfrei)" },
    { satz: "10", label: "10 % (ermäßigt)" },
    { satz: "13", label: "13 % (ermäßigt)" },
    { satz: "20", label: "20 % (Regelsteuersatz)" },
    { satz: "22", label: "22 % (Wein / Schaumwein)" },
  ],
  CH: [
    { satz: "0", label: "0 % (befreit)" },
    { satz: "2.6", label: "2.6 % (Sonderregel)" },
    { satz: "3.8", label: "3.8 % (Beherbergung)" },
    { satz: "8.1", label: "8.1 % (Normalsatz)" },
  ],
};

interface VertragFormState {
  bezeichnung: string;
  vertragsart: string;
  vertragspartner: string;
  vertragsnummer: string;
  beginn: string;
  ende: string;
  kuendigungsfrist: string;
  nettoBetrag: string;
  ustSatz: string;
  zahlungsrhythmus: string;
  gegenkontoNr: string;
  kostenstelleId: string;
  belegUrl: string;
  notizen: string;
  aktiv: boolean;
}

const VERTRAG_FORM_DEFAULT: VertragFormState = {
  bezeichnung: "",
  vertragsart: "sonstig",
  vertragspartner: "",
  vertragsnummer: "",
  beginn: "",
  ende: "",
  kuendigungsfrist: "",
  nettoBetrag: "",
  ustSatz: "19",
  zahlungsrhythmus: "monatlich",
  gegenkontoNr: "",
  kostenstelleId: "",
  belegUrl: "",
  notizen: "",
  aktiv: true,
};

// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Lokaler Speicher
function loadStammdaten(): Stammdatum[] {
  try {
    const saved = localStorage.getItem("buchhaltung_stammdaten");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveStammdaten(data: Stammdatum[]): void {
  localStorage.setItem("buchhaltung_stammdaten", JSON.stringify(data));
}

export default function Stammdaten() {
  const [stammdaten, setStammdaten] = useState<Stammdatum[]>([]);
  const [activeTab, setActiveTab] = useState("kreditor");
  const [suchbegriff, setSuchbegriff] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const trpcUtils = trpc.useUtils();
  const [editItem, setEditItem] = useState<Stammdatum | null>(null);
  const [editingSachkontoId, setEditingSachkontoId] = useState<number | null>(null);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);

  // Verträge v2 – dedizierter State
  const [vertragDialogOpen, setVertragDialogOpen] = useState(false);
  const [editingVertragId, setEditingVertragId] = useState<number | null>(null);
  const [vertragForm, setVertragForm] = useState<VertragFormState>(VERTRAG_FORM_DEFAULT);
  const [vertragUploadFile, setVertragUploadFile] = useState<File | null>(null);

  // Formular-State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formKontonummer, setFormKontonummer] = useState("");
  const [formNotizen, setFormNotizen] = useState("");

  // Hole die ausgewählte Unternehmens-ID aus dem LocalStorage
  const [selectedUnternehmenId, setSelectedUnternehmenId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    return saved ? parseInt(saved) : null;
  });

  // Lade Kreditoren für das ausgewählte Unternehmen
  const { data: kreditorenList, refetch: refetchKreditoren } = trpc.stammdaten.kreditoren.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && activeTab === "kreditor" }
  );

  // Lade Debitoren für das ausgewählte Unternehmen
  const { data: debitorenList, refetch: refetchDebitoren } = trpc.stammdaten.debitoren.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && activeTab === "debitor" }
  );

  // Lade Vorschläge für Kreditoren
  const { data: kreditorenSuggestions } = trpc.stammdaten.kreditoren.getSuggestions.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && suggestionsDialogOpen && activeTab === "kreditor" }
  );

  // Lade Vorschläge für Debitoren
  const { data: debitorenSuggestions } = trpc.stammdaten.debitoren.getSuggestions.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && suggestionsDialogOpen && activeTab === "debitor" }
  );

  // Lade Sachkonten für das ausgewählte Unternehmen
  const { data: sachkontenList, refetch: refetchSachkonten } = trpc.stammdaten.sachkonten.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && activeTab === "sachkonto" }
  );

  // Lade Anlagevermögen für das ausgewählte Unternehmen
  const { data: anlagenList, refetch: refetchAnlagen } = trpc.jahresabschluss.anlagevermoegen.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && activeTab === "anlagevermoegen" }
  );

  // Lade Bankkonten für das ausgewählte Unternehmen
  const { data: bankkontenList, refetch: refetchBankkonten } = trpc.jahresabschluss.bankkonten.list.useQuery(
    { unternehmenId: selectedUnternehmenId!, stichtag: new Date().toISOString().split("T")[0] },
    { enabled: !!selectedUnternehmenId && activeTab === "bankkonto" }
  );

  // Lade Gesellschafter für das ausgewählte Unternehmen
  const { data: gesellschafterList, refetch: refetchGesellschafter } = trpc.stammdaten.gesellschafter.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && activeTab === "gesellschafter" }
  );

  // Lade Finanzkonten (Kreditkarten, Zahlungsdienstleister, etc.) für das ausgewählte Unternehmen
  const { data: finanzkontenList, refetch: refetchFinanzkonten } = trpc.finanzkonten.list.useQuery(
    { unternehmenId: selectedUnternehmenId!, nurAktive: false },
    { enabled: !!selectedUnternehmenId && (activeTab === "kreditkarte" || activeTab === "zahlungsdienstleister" || activeTab === "brokerkonto") }
  );

  // Lade Verträge für das ausgewählte Unternehmen
  const { data: vertraegeList, refetch: refetchVertraege } = trpc.stammdaten.vertraege.list.useQuery(
    { unternehmenId: selectedUnternehmenId! },
    { enabled: !!selectedUnternehmenId && activeTab === "vertrag" }
  );

  // Unternehmensdaten (für landCode → länderspezifische USt / Konten)
  const { data: unternehmenList } = trpc.unternehmen.list.useQuery(undefined, {
    enabled: !!selectedUnternehmenId,
  });

  // Mutations für Kreditoren
  const createKreditorMutation = trpc.stammdaten.kreditoren.create.useMutation({
    onSuccess: () => {
      refetchKreditoren();
      toast.success("Kreditor erstellt");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const updateKreditorMutation = trpc.stammdaten.kreditoren.update.useMutation({
    onSuccess: () => {
      refetchKreditoren();
      toast.success("Kreditor aktualisiert");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const deleteKreditorMutation = trpc.stammdaten.kreditoren.delete.useMutation({
    onSuccess: () => {
      refetchKreditoren();
      toast.info("Kreditor gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Mutations für Debitoren
  const createDebitorMutation = trpc.stammdaten.debitoren.create.useMutation({
    onSuccess: () => {
      refetchDebitoren();
      toast.success("Debitor erstellt");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const updateDebitorMutation = trpc.stammdaten.debitoren.update.useMutation({
    onSuccess: () => {
      refetchDebitoren();
      toast.success("Debitor aktualisiert");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const deleteDebitorMutation = trpc.stammdaten.debitoren.delete.useMutation({
    onSuccess: () => {
      refetchDebitoren();
      toast.info("Debitor gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Mutations für Sachkonten
  const createSachkontoMutation = trpc.stammdaten.sachkonten.create.useMutation({
    onSuccess: () => {
      refetchSachkonten();
      toast.success("Sachkonto erstellt");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const updateSachkontoMutation = trpc.stammdaten.sachkonten.update.useMutation({
    onSuccess: () => {
      refetchSachkonten();
      toast.success("Sachkonto aktualisiert");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const deleteSachkontoMutation = trpc.stammdaten.sachkonten.delete.useMutation({
    onSuccess: () => {
      refetchSachkonten();
      toast.info("Sachkonto gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const seedSachkontenMutation = trpc.stammdaten.sachkonten.seedStandard.useMutation({
    onSuccess: (data) => {
      refetchSachkonten();
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Fehler beim Import: ${error.message}`);
    },
  });

  // Mutations für Anlagevermögen
  const createAnlageMutation = trpc.jahresabschluss.anlagevermoegen.create.useMutation({
    onSuccess: () => {
      refetchAnlagen();
      toast.success("Anlagegut erstellt");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const updateAnlageMutation = trpc.jahresabschluss.anlagevermoegen.update.useMutation({
    onSuccess: () => {
      refetchAnlagen();
      toast.success("Anlagegut aktualisiert");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const deleteAnlageMutation = trpc.jahresabschluss.anlagevermoegen.delete.useMutation({
    onSuccess: () => {
      refetchAnlagen();
      toast.info("Anlagegut gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Mutations für Bankkonten
  const createBankkontoMutation = trpc.jahresabschluss.bankkonten.create.useMutation({
    onSuccess: () => {
      refetchBankkonten();
      toast.success("Bankkonto erstellt");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const updateBankkontoMutation = trpc.jahresabschluss.bankkonten.update.useMutation({
    onSuccess: () => {
      refetchBankkonten();
      toast.success("Bankkonto aktualisiert");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const deleteBankkontoMutation = trpc.jahresabschluss.bankkonten.delete.useMutation({
    onSuccess: () => {
      refetchBankkonten();
      toast.info("Bankkonto gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Mutations für Gesellschafter
  const createGesellschafterMutation = trpc.stammdaten.gesellschafter.create.useMutation({
    onSuccess: () => {
      refetchGesellschafter();
      toast.success("Gesellschafter erstellt");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const updateGesellschafterMutation = trpc.stammdaten.gesellschafter.update.useMutation({
    onSuccess: () => {
      refetchGesellschafter();
      toast.success("Gesellschafter aktualisiert");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const deleteGesellschafterMutation = trpc.stammdaten.gesellschafter.delete.useMutation({
    onSuccess: () => {
      refetchGesellschafter();
      toast.info("Gesellschafter gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Mutations für Finanzkonten
  const createFinanzkontoMutation = trpc.finanzkonten.create.useMutation({
    onSuccess: () => {
      refetchFinanzkonten();
      toast.success("Finanzkonto erstellt");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const updateFinanzkontoMutation = trpc.finanzkonten.update.useMutation({
    onSuccess: () => {
      refetchFinanzkonten();
      toast.success("Finanzkonto aktualisiert");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const deleteFinanzkontoMutation = trpc.finanzkonten.delete.useMutation({
    onSuccess: () => {
      trpcUtils.finanzkonten.list.invalidate();
      toast.info("Finanzkonto gelöscht");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Mutations für Verträge
  const createVertragMutation = trpc.stammdaten.vertraege.create.useMutation({
    onSuccess: () => {
      refetchVertraege();
      toast.success("Vertrag erstellt");
      setVertragDialogOpen(false);
      setVertragForm(VERTRAG_FORM_DEFAULT);
      setEditingVertragId(null);
    },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const updateVertragMutation = trpc.stammdaten.vertraege.update.useMutation({
    onSuccess: () => {
      refetchVertraege();
      toast.success("Vertrag aktualisiert");
      setVertragDialogOpen(false);
      setVertragForm(VERTRAG_FORM_DEFAULT);
      setEditingVertragId(null);
    },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const deleteVertragMutation = trpc.stammdaten.vertraege.delete.useMutation({
    onSuccess: () => {
      refetchVertraege();
      toast.info("Vertrag gelöscht");
    },
    onError: (error) => { toast.error(`Fehler: ${error.message}`); },
  });

  const uploadBelegVertragMutation = trpc.stammdaten.vertraege.uploadBeleg.useMutation({
    onSuccess: () => {
      trpcUtils.buchhaltung.vertraege.list.invalidate();
      toast.success("Dokument hochgeladen");
    },
    onError: (error) => { toast.error(`Upload fehlgeschlagen: ${error.message}`); },
  });

  // Konvertierungs-Mutations
  const convertToDebitorMutation = trpc.stammdaten.kreditoren.convertToDebitor.useMutation({
    onSuccess: () => {
      refetchKreditoren();
      refetchDebitoren();
      toast.success("Kreditor zu Debitor konvertiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  const convertToKreditorMutation = trpc.stammdaten.debitoren.convertToKreditor.useMutation({
    onSuccess: () => {
      refetchKreditoren();
      refetchDebitoren();
      toast.success("Debitor zu Kreditor konvertiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    }
  });

  // Aktualisiere selectedUnternehmenId wenn sich LocalStorage ändert
  useEffect(() => {
    const checkStorage = () => {
      const saved = localStorage.getItem("selectedUnternehmenId");
      const newId = saved ? parseInt(saved) : null;
      if (newId !== selectedUnternehmenId) {
        setSelectedUnternehmenId(newId);
      }
    };
    
    const interval = setInterval(checkStorage, 1000);
    return () => clearInterval(interval);
  }, [selectedUnternehmenId]);

  useEffect(() => {
    setStammdaten(loadStammdaten());
  }, []);

  const activeTypConfig = STAMMDATEN_TYPEN.find(t => t.value === activeTab)!;

  const resetForm = useCallback(() => {
    setFormData({});
    setFormKontonummer("");
    setFormNotizen("");
    setEditItem(null);
    setEditingSachkontoId(null);
  }, []);

  // Vertrag-Dialog öffnen (neu oder bearbeiten)
  const openVertragDialog = useCallback((vertrag?: any) => {
    const currentUnternehmen = unternehmenList?.find(
      (u) => u.unternehmen.id === selectedUnternehmenId
    )?.unternehmen;
    const land = (currentUnternehmen?.landCode as string) || "DE";
    const defaultUstSatz = land === "AT" ? "20" : land === "CH" ? "8.1" : "19";

    if (vertrag) {
      setEditingVertragId(vertrag.id);
      setVertragForm({
        bezeichnung: vertrag.bezeichnung || "",
        vertragsart: vertrag.vertragsart || "sonstig",
        vertragspartner: vertrag.vertragspartner || "",
        vertragsnummer: vertrag.vertragsnummer || "",
        beginn: vertrag.beginn
          ? new Date(vertrag.beginn).toISOString().split("T")[0]
          : "",
        ende: vertrag.ende
          ? new Date(vertrag.ende).toISOString().split("T")[0]
          : "",
        kuendigungsfrist: vertrag.kuendigungsfrist || "",
        nettoBetrag: vertrag.nettoBetrag ?? vertrag.monatlicheBetrag ?? "",
        ustSatz: vertrag.ustSatz ?? defaultUstSatz,
        zahlungsrhythmus: vertrag.zahlungsrhythmus || "monatlich",
        gegenkontoNr: vertrag.gegenkontoNr || "",
        kostenstelleId: vertrag.kostenstelleId?.toString() || "",
        belegUrl: vertrag.belegUrl || "",
        notizen: vertrag.notizen || "",
        aktiv: vertrag.aktiv ?? true,
      });
    } else {
      setEditingVertragId(null);
      setVertragForm({ ...VERTRAG_FORM_DEFAULT, ustSatz: defaultUstSatz });
    }
    setVertragDialogOpen(true);
  }, [unternehmenList, selectedUnternehmenId]);

  const openNewDialog = useCallback(() => {
    if (activeTab === "vertrag") {
      openVertragDialog();
      return;
    }
    resetForm();
    setDialogOpen(true);
  }, [resetForm, activeTab, openVertragDialog]);

  const openEditDialog = useCallback((item: Stammdatum) => {
    setEditItem(item);
    setFormData(item.details);
    setFormKontonummer(item.kontonummer);
    setFormNotizen(item.notizen);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const requiredFields = activeTypConfig.felder.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.key]?.trim());
    
    if (missingFields.length > 0) {
      toast.error(`Bitte füllen Sie aus: ${missingFields.map(f => f.label).join(", ")}`);
      return;
    }

    // Spezielle Behandlung für Sachkonten (Datenbank)
    if (activeTab === "sachkonto") {
      if (!selectedUnternehmenId) {
        toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
        return;
      }

      if (editingSachkontoId) {
        // Sachkonto aktualisieren
        updateSachkontoMutation.mutate({
          id: editingSachkontoId,
          kontonummer: formData.kontonummer,
          bezeichnung: formData.bezeichnung,
          kategorie: formData.kategorie || undefined,
          kontotyp: (formData.kontotyp as any) || undefined,
          standardSteuersatz: formData.standardSteuersatz || undefined,
          notizen: formNotizen || undefined,
        });
      } else {
        // Neues Sachkonto erstellen
        createSachkontoMutation.mutate({
          unternehmenId: selectedUnternehmenId,
          kontenrahmen: "SKR04",
          kontonummer: formData.kontonummer,
          bezeichnung: formData.bezeichnung,
          kategorie: formData.kategorie || undefined,
          kontotyp: (formData.kontotyp as any) || undefined,
          standardSteuersatz: formData.standardSteuersatz || undefined,
          notizen: formNotizen || undefined,
        });
      }
      return;
    }

    // Kreditoren (Datenbank)
    if (activeTab === "kreditor") {
      if (!selectedUnternehmenId) {
        toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
        return;
      }

      const kreditorData = {
        kontonummer: formKontonummer,
        name: formData.firma || "",
        kurzbezeichnung: formData.ansprechpartner || undefined,
        strasse: formData.strasse || undefined,
        plz: formData.plz || undefined,
        ort: formData.ort || undefined,
        telefon: formData.telefon || undefined,
        email: formData.email || undefined,
        ustIdNr: formData.ustid || undefined,
        iban: formData.iban || undefined,
        zahlungsziel: formData.zahlungsziel ? parseInt(formData.zahlungsziel) : undefined,
        standardSachkonto: formData.standardSachkonto || undefined,
        notizen: formNotizen || undefined,
      };

      if (editItem) {
        updateKreditorMutation.mutate({ id: parseInt(editItem.id), ...kreditorData });
      } else {
        createKreditorMutation.mutate({ unternehmenId: selectedUnternehmenId, ...kreditorData });
      }
      return;
    }

    // Debitoren (Datenbank)
    if (activeTab === "debitor") {
      if (!selectedUnternehmenId) {
        toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
        return;
      }

      const debitorData = {
        kontonummer: formKontonummer,
        name: formData.firma || "",
        kurzbezeichnung: formData.ansprechpartner || undefined,
        strasse: formData.strasse || undefined,
        plz: formData.plz || undefined,
        ort: formData.ort || undefined,
        telefon: formData.telefon || undefined,
        email: formData.email || undefined,
        ustIdNr: formData.ustid || undefined,
        kreditlimit: formData.kreditlimit || undefined,
        zahlungsziel: formData.zahlungsziel ? parseInt(formData.zahlungsziel) : undefined,
        notizen: formNotizen || undefined,
      };

      if (editItem) {
        updateDebitorMutation.mutate({ id: parseInt(editItem.id), ...debitorData });
      } else {
        createDebitorMutation.mutate({ unternehmenId: selectedUnternehmenId, ...debitorData });
      }
      return;
    }

    // Anlagevermögen (Datenbank)
    if (activeTab === "anlagevermoegen") {
      if (!selectedUnternehmenId) {
        toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
        return;
      }

      const anlageData = {
        kontonummer: formKontonummer,
        bezeichnung: formData.bezeichnung || "",
        kategorie: formData.kategorie || undefined,
        anschaffungsdatum: formData.anschaffungsdatum || undefined,
        anschaffungskosten: formData.anschaffungskosten || undefined,
        nutzungsdauer: formData.nutzungsdauer ? parseInt(formData.nutzungsdauer) : undefined,
        abschreibungsmethode: (formData.abschreibungsmethode as any) || undefined,
        restwert: formData.restwert || undefined,
        sachkonto: formData.sachkonto || undefined,
        standort: formData.standort || undefined,
        inventarnummer: formData.inventarnummer || undefined,
        seriennummer: formData.seriennummer || undefined,
        notizen: formNotizen || undefined,
      };

      if (editItem) {
        updateAnlageMutation.mutate({ id: parseInt(editItem.id), ...anlageData });
      } else {
        createAnlageMutation.mutate({ unternehmenId: selectedUnternehmenId, ...anlageData });
      }
      return;
    }

    // Bankkonten (Datenbank)
    if (activeTab === "bankkonto") {
      if (!selectedUnternehmenId) {
        toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
        return;
      }

      const bankkontoData = {
        kontonummer: formKontonummer,
        bezeichnung: formData.bankname || "",
        bankname: formData.bankname || undefined,
        iban: formData.iban || undefined,
        bic: formData.bic || undefined,
        sachkonto: formData.sachkonto || undefined,
        anfangsbestand: formData.anfangsbestand || undefined,
        kontotyp: (formData.kontotyp as any) || undefined,
        waehrung: formData.waehrung || undefined,
        kontoinhaber: formData.kontoinhaber || undefined,
        notizen: formNotizen || undefined,
      };

      if (editItem) {
        updateBankkontoMutation.mutate({ id: parseInt(editItem.id), unternehmenId: selectedUnternehmenId, ...bankkontoData });
      } else {
        createBankkontoMutation.mutate({ unternehmenId: selectedUnternehmenId, ...bankkontoData });
      }
      return;
    }

    // Gesellschafter (Datenbank)
    if (activeTab === "gesellschafter") {
      if (!selectedUnternehmenId) {
        toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
        return;
      }

      const gesellschafterData = {
        kontonummer: formKontonummer,
        name: formData.name || "",
        typ: (formData.typ as "natuerlich" | "juristisch") || undefined,
        anteil: formData.anteil || undefined,
        einlage: formData.einlage || undefined,
        eintrittsdatum: formData.eintrittsdatum || undefined,
        strasse: formData.strasse || undefined,
        plz: formData.plz || undefined,
        ort: formData.ort || undefined,
        steuerId: formData.steuerId || undefined,
        notizen: formNotizen || undefined,
      };

      if (editItem) {
        updateGesellschafterMutation.mutate({
          id: parseInt(editItem.id),
          unternehmenId: selectedUnternehmenId,
          ...gesellschafterData
        });
      } else {
        createGesellschafterMutation.mutate({ unternehmenId: selectedUnternehmenId, ...gesellschafterData });
      }
      return;
    }

    // Kreditkarten, Zahlungsdienstleister, Brokerkonten (Datenbank)
    if (activeTab === "kreditkarte" || activeTab === "zahlungsdienstleister" || activeTab === "brokerkonto") {
      if (!selectedUnternehmenId) {
        toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
        return;
      }

      // Bestimme den typ basierend auf activeTab und formData
      let typ: string;
      if (activeTab === "kreditkarte") {
        typ = "kreditkarte";
      } else if (activeTab === "zahlungsdienstleister") {
        typ = formData.typ || "paypal"; // paypal, stripe, klarna, etc.
      } else {
        typ = "broker";
      }

      const finanzkontoData = {
        typ,
        name: formData.name || "",
        sachkontoId: formData.sachkontoId ? parseInt(formData.sachkontoId) : undefined,
        // Kreditkarten-spezifisch
        kreditkartenNummer: formData.kreditkartenNummer || undefined,
        kreditlimit: formData.kreditlimit || undefined,
        abrechnungstag: formData.abrechnungstag ? parseInt(formData.abrechnungstag) : undefined,
        // Zahlungsdienstleister-spezifisch
        email: formData.email || undefined,
        waehrung: formData.waehrung || undefined,
        // Broker-spezifisch
        depotNummer: formData.depotNummer || undefined,
        brokerName: formData.brokerName || undefined,
        // Gemeinsame Felder
        kontonummer: formKontonummer || undefined,
        notizen: formNotizen || undefined,
      };

      if (editItem) {
        updateFinanzkontoMutation.mutate({
          id: parseInt(editItem.finanzkonto?.id || editItem.id),
          unternehmenId: selectedUnternehmenId,
          ...finanzkontoData,
          aktiv: true,
        });
      } else {
        createFinanzkontoMutation.mutate({ unternehmenId: selectedUnternehmenId, ...finanzkontoData });
      }
      return;
    }

    // Standard-Behandlung für andere Stammdaten (LocalStorage)
    const now = new Date().toISOString();
    const name = formData[activeTypConfig.felder[0].key] || "Unbenannt";

    if (editItem) {
      const updated = stammdaten.map(s =>
        s.id === editItem.id
          ? { ...s, name, kontonummer: formKontonummer, details: formData, notizen: formNotizen, aktualisiertAm: now }
          : s
      );
      setStammdaten(updated);
      saveStammdaten(updated);
      toast.success(`${activeTypConfig.labelSingular} aktualisiert`);
    } else {
      const neuesItem: Stammdatum = {
        id: generateId(),
        typ: activeTab,
        name,
        kontonummer: formKontonummer,
        details: formData,
        notizen: formNotizen,
        erstelltAm: now,
        aktualisiertAm: now,
      };
      const updated = [neuesItem, ...stammdaten];
      setStammdaten(updated);
      saveStammdaten(updated);
      toast.success(`${activeTypConfig.labelSingular} erstellt`);
    }

    setDialogOpen(false);
    resetForm();
  }, [activeTab, activeTypConfig, formData, formKontonummer, formNotizen, editItem, stammdaten, resetForm, selectedUnternehmenId, editingSachkontoId, createSachkontoMutation, updateSachkontoMutation, createKreditorMutation, updateKreditorMutation, createDebitorMutation, updateDebitorMutation, createGesellschafterMutation, updateGesellschafterMutation, createFinanzkontoMutation, updateFinanzkontoMutation]);

  const handleDelete = useCallback((id: string) => {
    const updated = stammdaten.filter(s => s.id !== id);
    setStammdaten(updated);
    saveStammdaten(updated);
    toast.info(`${activeTypConfig.labelSingular} gelöscht`);
  }, [stammdaten, activeTypConfig]);

  // Kreditor löschen (Datenbank)
  const handleDeleteKreditor = useCallback((id: number) => {
    if (confirm("Möchten Sie diesen Kreditor wirklich löschen?")) {
      deleteKreditorMutation.mutate({ id });
    }
  }, [deleteKreditorMutation]);

  // Debitor löschen (Datenbank)
  const handleDeleteDebitor = useCallback((id: number) => {
    if (confirm("Möchten Sie diesen Debitor wirklich löschen?")) {
      deleteDebitorMutation.mutate({ id });
    }
  }, [deleteDebitorMutation]);

  // Sachkonto löschen (Datenbank)
  const handleDeleteSachkonto = useCallback((id: number) => {
    if (confirm("Möchten Sie dieses Sachkonto wirklich löschen?")) {
      deleteSachkontoMutation.mutate({ id });
    }
  }, [deleteSachkontoMutation]);

  // Anlage löschen (Datenbank)
  const handleDeleteAnlage = useCallback((id: number) => {
    if (confirm("Möchten Sie dieses Anlagegut wirklich löschen?")) {
      deleteAnlageMutation.mutate({ id });
    }
  }, [deleteAnlageMutation]);

  // Bankkonto löschen (Datenbank)
  const handleDeleteBankkonto = useCallback((id: number) => {
    if (confirm("Möchten Sie dieses Bankkonto wirklich löschen?")) {
      deleteBankkontoMutation.mutate({ id });
    }
  }, [deleteBankkontoMutation]);

  // Gesellschafter löschen (Datenbank)
  const handleDeleteGesellschafter = useCallback((id: number) => {
    if (!selectedUnternehmenId) {
      toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
      return;
    }
    if (confirm("Möchten Sie diesen Gesellschafter wirklich löschen?")) {
      deleteGesellschafterMutation.mutate({ id, unternehmenId: selectedUnternehmenId });
    }
  }, [deleteGesellschafterMutation, selectedUnternehmenId]);

  // Kreditkarte löschen (Datenbank)
  const handleDeleteKreditkarte = useCallback((id: number) => {
    if (confirm("Möchten Sie diese Kreditkarte wirklich löschen?")) {
      deleteFinanzkontoMutation.mutate({ id, unternehmenId: selectedUnternehmenId! });
    }
  }, [deleteFinanzkontoMutation, selectedUnternehmenId]);

  // Zahlungsdienstleister löschen (Datenbank)
  const handleDeleteZahlungsdienstleister = useCallback((id: number) => {
    if (confirm("Möchten Sie diesen Zahlungsdienstleister wirklich löschen?")) {
      deleteFinanzkontoMutation.mutate({ id, unternehmenId: selectedUnternehmenId! });
    }
  }, [deleteFinanzkontoMutation, selectedUnternehmenId]);

  // Vertrag löschen
  const handleDeleteVertrag = useCallback((id: number) => {
    if (confirm("Möchten Sie diesen Vertrag wirklich löschen?")) {
      deleteVertragMutation.mutate({ id });
    }
  }, [deleteVertragMutation]);

  // Vertrag speichern (create oder update, optional mit Datei-Upload)
  const handleVertragSpeichern = useCallback(() => {
    if (!vertragForm.bezeichnung.trim()) {
      toast.error("Vertragsbezeichnung ist erforderlich");
      return;
    }
    if (!selectedUnternehmenId) {
      toast.error("Bitte wählen Sie zuerst ein Unternehmen aus");
      return;
    }

    const netto = parseFloat(vertragForm.nettoBetrag || "0");
    const ustSatz = parseFloat(vertragForm.ustSatz || "0");
    const ustBetrag = Math.round(netto * ustSatz / 100 * 100) / 100;
    const brutto = Math.round((netto + ustBetrag) * 100) / 100;

    const payload = {
      bezeichnung: vertragForm.bezeichnung,
      vertragsart: vertragForm.vertragsart as any,
      vertragspartner: vertragForm.vertragspartner || undefined,
      vertragsnummer: vertragForm.vertragsnummer || undefined,
      beginn: vertragForm.beginn || undefined,
      ende: vertragForm.ende || undefined,
      kuendigungsfrist: vertragForm.kuendigungsfrist || undefined,
      nettoBetrag: vertragForm.nettoBetrag || undefined,
      ustSatz: vertragForm.ustSatz || undefined,
      ustBetrag: ustBetrag > 0 ? ustBetrag.toFixed(2) : undefined,
      monatlicheBetrag: brutto > 0 ? brutto.toFixed(2) : undefined,
      zahlungsrhythmus: vertragForm.zahlungsrhythmus as any,
      buchungskonto: vertragForm.gegenkontoNr ||
        (VERTRAGS_KONTEN[currentKontenrahmen]?.[vertragForm.vertragsart] ?? undefined),
      gegenkontoNr: vertragForm.gegenkontoNr ||
        (VERTRAGS_KONTEN[currentKontenrahmen]?.gegenkonto ?? undefined),
      kostenstelleId: vertragForm.kostenstelleId ? parseInt(vertragForm.kostenstelleId) : undefined,
      notizen: vertragForm.notizen || undefined,
      belegUrl: vertragForm.belegUrl || undefined,
      aktiv: vertragForm.aktiv,
    };

    // Datei nach erfolgreichem Speichern hochladen
    const doUpload = (id: number) => {
      if (!vertragUploadFile) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        uploadBelegVertragMutation.mutate({
          id,
          unternehmenId: selectedUnternehmenId,
          fileName: vertragUploadFile.name,
          fileBase64: base64,
          mimeType: vertragUploadFile.type,
        });
      };
      reader.readAsDataURL(vertragUploadFile);
    };

    if (editingVertragId) {
      updateVertragMutation.mutate(
        { id: editingVertragId, ...payload },
        { onSuccess: () => doUpload(editingVertragId) }
      );
    } else {
      createVertragMutation.mutate(
        { unternehmenId: selectedUnternehmenId, ...payload },
        { onSuccess: (data) => doUpload(data.id) }
      );
    }
  }, [
    vertragForm, editingVertragId, selectedUnternehmenId, vertragUploadFile,
    createVertragMutation, updateVertragMutation, uploadBelegVertragMutation,
    currentKontenrahmen,
  ]);

  // Kreditor bearbeiten
  const openEditKreditorDialog = useCallback((kreditor: any) => {
    setEditItem({
      id: kreditor.id.toString(),
      typ: "kreditor",
      name: kreditor.name,
      kontonummer: kreditor.kontonummer,
      details: {},
      notizen: kreditor.notizen || "",
      erstelltAm: kreditor.createdAt,
      aktualisiertAm: kreditor.updatedAt,
    });
    setFormKontonummer(kreditor.kontonummer);
    setFormData({
      firma: kreditor.name || "",
      ansprechpartner: kreditor.kurzbezeichnung || "",
      strasse: kreditor.strasse || "",
      plz: kreditor.plz || "",
      ort: kreditor.ort || "",
      telefon: kreditor.telefon || "",
      email: kreditor.email || "",
      ustid: kreditor.ustIdNr || "",
      iban: kreditor.iban || "",
      zahlungsziel: kreditor.zahlungsziel?.toString() || "",
      standardSachkonto: kreditor.standardSachkonto || "",
    });
    setFormNotizen(kreditor.notizen || "");
    setDialogOpen(true);
  }, []);

  // Debitor bearbeiten
  const openEditDebitorDialog = useCallback((debitor: any) => {
    setEditItem({
      id: debitor.id.toString(),
      typ: "debitor",
      name: debitor.name,
      kontonummer: debitor.kontonummer,
      details: {},
      notizen: debitor.notizen || "",
      erstelltAm: debitor.createdAt,
      aktualisiertAm: debitor.updatedAt,
    });
    setFormKontonummer(debitor.kontonummer);
    setFormData({
      firma: debitor.name || "",
      ansprechpartner: debitor.kurzbezeichnung || "",
      strasse: debitor.strasse || "",
      plz: debitor.plz || "",
      ort: debitor.ort || "",
      telefon: debitor.telefon || "",
      email: debitor.email || "",
      ustid: debitor.ustIdNr || "",
      kreditlimit: debitor.kreditlimit || "",
      zahlungsziel: debitor.zahlungsziel?.toString() || "",
    });
    setFormNotizen(debitor.notizen || "");
    setDialogOpen(true);
  }, []);

  // Sachkonto bearbeiten
  const openEditSachkontoDialog = useCallback((sachkonto: any) => {
    setEditingSachkontoId(sachkonto.id);
    setFormData({
      kontonummer: sachkonto.kontonummer,
      bezeichnung: sachkonto.bezeichnung,
      kategorie: sachkonto.kategorie || "",
      kontotyp: sachkonto.kontotyp || "",
      standardSteuersatz: sachkonto.standardSteuersatz || "",
    });
    setFormNotizen(sachkonto.notizen || "");
    setDialogOpen(true);
  }, []);

  // Anlage bearbeiten
  const openEditAnlageDialog = useCallback((anlage: any) => {
    setEditItem({
      id: anlage.id.toString(),
      typ: "anlagevermoegen",
      name: anlage.bezeichnung,
      kontonummer: anlage.kontonummer,
      details: {},
      notizen: anlage.notizen || "",
      erstelltAm: anlage.createdAt,
      aktualisiertAm: anlage.updatedAt,
    });
    setFormKontonummer(anlage.kontonummer);
    setFormData({
      bezeichnung: anlage.bezeichnung || "",
      kategorie: anlage.kategorie || "",
      anschaffungsdatum: anlage.anschaffungsdatum
        ? new Date(anlage.anschaffungsdatum).toISOString().split("T")[0]
        : "",
      anschaffungskosten: anlage.anschaffungskosten || "",
      nutzungsdauer: anlage.nutzungsdauer?.toString() || "",
      abschreibungsmethode: anlage.abschreibungsmethode || "linear",
      restwert: anlage.restwert || "0",
      sachkonto: anlage.sachkonto || "",
      standort: anlage.standort || "",
      inventarnummer: anlage.inventarnummer || "",
      seriennummer: anlage.seriennummer || "",
    });
    setFormNotizen(anlage.notizen || "");
    setDialogOpen(true);
  }, []);

  // Bankkonto bearbeiten
  const openEditBankkontoDialog = useCallback((konto: any) => {
    setEditItem({
      id: konto.id.toString(),
      typ: "bankkonto",
      name: konto.bezeichnung,
      kontonummer: konto.kontonummer,
      details: {},
      notizen: konto.notizen || "",
      erstelltAm: konto.createdAt,
      aktualisiertAm: konto.updatedAt,
    });
    setFormKontonummer(konto.kontonummer);
    setFormData({
      bankname: konto.bankname || "",
      iban: konto.iban || "",
      bic: konto.bic || "",
      kontoinhaber: konto.kontoinhaber || "",
      waehrung: konto.waehrung || "EUR",
      kontotyp: konto.kontotyp || "girokonto",
      sachkonto: konto.sachkonto || "",
      anfangsbestand: konto.anfangsbestand || "0",
      kreditlinie: konto.kreditlinie || "",
    });
    setFormNotizen(konto.notizen || "");
    setDialogOpen(true);
  }, []);

  // Gefilterte Kreditoren
  const gefilterteKreditoren = kreditorenList?.filter(k => {
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return k.kontonummer.toLowerCase().includes(searchLower) ||
           k.name.toLowerCase().includes(searchLower) ||
           (k.ort?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // Gefilterte Debitoren
  const gefilterteDebitoren = debitorenList?.filter(d => {
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return d.kontonummer.toLowerCase().includes(searchLower) ||
           d.name.toLowerCase().includes(searchLower) ||
           (d.ort?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // Gefilterte Sachkonten
  const gefilterteSachkonten = sachkontenList?.filter(s => {
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return s.kontonummer.toLowerCase().includes(searchLower) ||
           s.bezeichnung.toLowerCase().includes(searchLower) ||
           (s.kategorie?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // Gefilterte Anlagen
  const gefilterteAnlagen = anlagenList?.filter(a => {
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return a.kontonummer.toLowerCase().includes(searchLower) ||
           a.bezeichnung.toLowerCase().includes(searchLower) ||
           (a.kategorie?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // Gefilterte Bankkonten
  const gefilterteBankkonten = bankkontenList?.filter(b => {
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return b.kontonummer.toLowerCase().includes(searchLower) ||
           b.bezeichnung.toLowerCase().includes(searchLower) ||
           (b.bankname?.toLowerCase().includes(searchLower) ?? false) ||
           (b.iban?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // Gefilterte Gesellschafter
  const gefilterteGesellschafter = gesellschafterList?.filter(g => {
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return g.name.toLowerCase().includes(searchLower) ||
           g.kontonummer.toLowerCase().includes(searchLower) ||
           (g.ort?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // Gefilterte Finanzkonten nach Typ
  const gefilterteKreditkarten = finanzkontenList?.filter(f => {
    if (f.finanzkonto.typ !== "kreditkarte") return false;
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return f.finanzkonto.name.toLowerCase().includes(searchLower) ||
           (f.finanzkonto.kontonummer?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  const gefilterteZahlungsdienstleister = finanzkontenList?.filter(f => {
    if (!["paypal", "stripe", "sonstiges"].includes(f.finanzkonto.typ)) return false;
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return f.finanzkonto.name.toLowerCase().includes(searchLower) ||
           (f.finanzkonto.email?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  const gefilterteBrokerkonten = finanzkontenList?.filter(f => {
    if (f.finanzkonto.typ !== "broker") return false;
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return f.finanzkonto.name.toLowerCase().includes(searchLower) ||
           (f.finanzkonto.brokerName?.toLowerCase().includes(searchLower) ?? false) ||
           (f.finanzkonto.depotNummer?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // Gefilterte Verträge
  const gefilterteVertraege = vertraegeList?.filter(v => {
    if (!suchbegriff) return true;
    const searchLower = suchbegriff.toLowerCase();
    return v.bezeichnung.toLowerCase().includes(searchLower) ||
           (v.vertragspartner?.toLowerCase().includes(searchLower) ?? false) ||
           (v.vertragsnummer?.toLowerCase().includes(searchLower) ?? false);
  }) || [];

  // landCode + Kontenrahmen des aktuellen Unternehmens
  const currentUnternehmenData = unternehmenList?.find(
    (u) => u.unternehmen.id === selectedUnternehmenId
  )?.unternehmen;
  const currentLandCode = (currentUnternehmenData?.landCode as string) || "DE";
  const currentKontenrahmen = (currentUnternehmenData?.kontenrahmen as string) || "SKR04";
  const ustSaetzeForLand = UST_SAETZE[currentLandCode] ?? UST_SAETZE["DE"];

  // USt-Berechnung für Vertrag-Dialog
  const vertragNetto = parseFloat(vertragForm.nettoBetrag || "0");
  const vertragUstSatz = parseFloat(vertragForm.ustSatz || "0");
  const vertragUstBetrag = vertragNetto * vertragUstSatz / 100;
  const vertragBrutto = vertragNetto + vertragUstBetrag;

  // Gefilterte Daten für aktiven Tab (LocalStorage-Typen wie kostenstelle)
  const gefilterteDaten = stammdaten.filter(s => {
    if (s.typ !== activeTab) return false;
    if (!suchbegriff) return true;

    const searchLower = suchbegriff.toLowerCase();
    return s.name.toLowerCase().includes(searchLower) ||
           s.kontonummer.toLowerCase().includes(searchLower) ||
           Object.values(s.details).some(v => v.toLowerCase().includes(searchLower));
  });

  const Icon = activeTypConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Einheitlicher Header */}
      <AppHeader title="Stammdaten" subtitle="Kreditoren, Debitoren, Anlagen & mehr" />

      <main className="container py-6">
        {/* Neuer Eintrag Button */}
        <div className="flex justify-end gap-2 mb-4">
          {(activeTab === "kreditor" || activeTab === "debitor") && selectedUnternehmenId && (
            <Button
              variant="outline"
              onClick={() => setSuggestionsDialogOpen(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              Vorschläge aus Buchungen
            </Button>
          )}
          {activeTab === "sachkonto" && selectedUnternehmenId && (
            <Button
              variant="outline"
              onClick={() => seedSachkontenMutation.mutate({ unternehmenId: selectedUnternehmenId })}
              disabled={seedSachkontenMutation.isPending}
            >
              {seedSachkontenMutation.isPending ? 'Importiere...' : 'Standard-Konten importieren'}
            </Button>
          )}
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {activeTypConfig.labelSingular} anlegen
          </Button>
        </div>
        {/* Tabs für Stammdaten-Typen */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50">
              {STAMMDATEN_TYPEN.map((typ) => {
                const TabIcon = typ.icon;
                // Für Datenbank-Typen: Zähle aus der Datenbank, sonst aus LocalStorage
                let count = 0;
                if (typ.value === "sachkonto") {
                  count = sachkontenList?.length || 0;
                } else if (typ.value === "kreditor") {
                  count = kreditorenList?.length || 0;
                } else if (typ.value === "debitor") {
                  count = debitorenList?.length || 0;
                } else if (typ.value === "anlagevermoegen") {
                  count = anlagenList?.length || 0;
                } else if (typ.value === "bankkonto") {
                  count = bankkontenList?.length || 0;
                } else if (typ.value === "gesellschafter") {
                  count = gesellschafterList?.length || 0;
                } else if (typ.value === "kreditkarte") {
                  count = gefilterteKreditkarten.length;
                } else if (typ.value === "zahlungsdienstleister") {
                  count = gefilterteZahlungsdienstleister.length;
                } else if (typ.value === "brokerkonto") {
                  count = gefilterteBrokerkonten.length;
                } else if (typ.value === "vertrag") {
                  count = vertraegeList?.length || 0;
                } else {
                  count = stammdaten.filter(s => s.typ === typ.value).length;
                }
                return (
                  <TabsTrigger 
                    key={typ.value} 
                    value={typ.value}
                    className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background"
                  >
                    <TabIcon className={`w-4 h-4 ${typ.color}`} />
                    <span className="hidden sm:inline">{typ.label}</span>
                    {count > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Suchfeld */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`${activeTypConfig.label} durchsuchen...`}
                  value={suchbegriff}
                  onChange={(e) => setSuchbegriff(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Inhalt für jeden Tab */}
          {STAMMDATEN_TYPEN.map((typ) => (
            <TabsContent key={typ.value} value={typ.value} className="mt-0">
              {/* Spezielle Anzeige für Kreditoren */}
              {typ.value === "kreditor" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-blue-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteKreditoren.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-blue-600" />
                      <p className="font-medium">Keine Kreditoren vorhanden</p>
                      <p className="text-sm">Legen Sie einen neuen Kreditor an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteKreditoren.map((kreditor) => (
                      <Card key={kreditor.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{kreditor.name}</CardTitle>
                                <CardDescription className="text-sm font-mono">
                                  {kreditor.kontonummer}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditKreditorDialog(kreditor)}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  if (confirm(`"${kreditor.name}" zu Debitor (Kunde) konvertieren?`)) {
                                    convertToDebitorMutation.mutate({ id: kreditor.id });
                                  }
                                }}
                                title="Zu Debitor konvertieren"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteKreditor(kreditor.id)}
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {kreditor.ort && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ort:</span>
                                <span className="font-medium">{kreditor.plz} {kreditor.ort}</span>
                              </div>
                            )}
                            {kreditor.email && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">E-Mail:</span>
                                <span className="font-medium truncate max-w-[150px]">{kreditor.email}</span>
                              </div>
                            )}
                            {kreditor.standardSachkonto && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sachkonto:</span>
                                <span className="font-medium font-mono">{kreditor.standardSachkonto}</span>
                              </div>
                            )}
                          </div>
                          {kreditor.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {kreditor.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "debitor" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteDebitoren.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-600" />
                      <p className="font-medium">Keine Debitoren vorhanden</p>
                      <p className="text-sm">Legen Sie einen neuen Debitor an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteDebitoren.map((debitor) => (
                      <Card key={debitor.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{debitor.name}</CardTitle>
                                <CardDescription className="text-sm font-mono">
                                  {debitor.kontonummer}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDebitorDialog(debitor)}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  if (confirm(`"${debitor.name}" zu Kreditor (Lieferant) konvertieren?`)) {
                                    convertToKreditorMutation.mutate({ id: debitor.id });
                                  }
                                }}
                                title="Zu Kreditor konvertieren"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteDebitor(debitor.id)}
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {debitor.ort && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ort:</span>
                                <span className="font-medium">{debitor.plz} {debitor.ort}</span>
                              </div>
                            )}
                            {debitor.email && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">E-Mail:</span>
                                <span className="font-medium truncate max-w-[150px]">{debitor.email}</span>
                              </div>
                            )}
                            {debitor.kreditlimit && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Kreditlimit:</span>
                                <span className="font-medium">{debitor.kreditlimit} €</span>
                              </div>
                            )}
                          </div>
                          {debitor.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {debitor.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "sachkonto" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50 text-cyan-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteSachkonten.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50 text-cyan-600" />
                      <p className="font-medium">Keine Sachkonten vorhanden</p>
                      <p className="text-sm">Legen Sie ein neues Sachkonto an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteSachkonten.map((sachkonto) => (
                      <Card key={sachkonto.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                                <Calculator className="w-5 h-5 text-cyan-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base font-mono">{sachkonto.kontonummer}</CardTitle>
                                <CardDescription className="text-sm">
                                  {sachkonto.bezeichnung}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditSachkontoDialog(sachkonto)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteSachkonto(sachkonto.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {sachkonto.kategorie && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Kategorie:</span>
                                <span className="font-medium">{sachkonto.kategorie}</span>
                              </div>
                            )}
                            {sachkonto.kontotyp && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Typ:</span>
                                <span className="font-medium capitalize">{sachkonto.kontotyp}</span>
                              </div>
                            )}
                            {sachkonto.standardSteuersatz && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Steuersatz:</span>
                                <span className="font-medium">{sachkonto.standardSteuersatz}%</span>
                              </div>
                            )}
                          </div>
                          {sachkonto.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {sachkonto.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "anlagevermoegen" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Car className="w-12 h-12 mx-auto mb-4 opacity-50 text-orange-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteAnlagen.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Car className="w-12 h-12 mx-auto mb-4 opacity-50 text-orange-600" />
                      <p className="font-medium">Kein Anlagevermögen vorhanden</p>
                      <p className="text-sm">Legen Sie ein neues Anlagegut an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteAnlagen.map((anlage) => (
                      <Card key={anlage.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Car className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{anlage.bezeichnung}</CardTitle>
                                <CardDescription className="text-sm font-mono">
                                  {anlage.kontonummer}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditAnlageDialog(anlage)}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteAnlage(anlage.id)}
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {anlage.kategorie && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Kategorie:</span>
                                <span className="font-medium">{anlage.kategorie}</span>
                              </div>
                            )}
                            {anlage.anschaffungskosten && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">AK:</span>
                                <span className="font-medium">{parseFloat(anlage.anschaffungskosten).toLocaleString('de-DE', {minimumFractionDigits: 2})} €</span>
                              </div>
                            )}
                            {anlage.sachkonto && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sachkonto:</span>
                                <span className="font-medium font-mono">{anlage.sachkonto}</span>
                              </div>
                            )}
                          </div>
                          {anlage.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {anlage.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "bankkonto" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Landmark className="w-12 h-12 mx-auto mb-4 opacity-50 text-teal-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteBankkonten.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <Landmark className="w-12 h-12 mx-auto mb-4 opacity-50 text-teal-600" />
                      <p className="font-medium">Keine Bankkonten vorhanden</p>
                      <p className="text-sm">Legen Sie ein neues Bankkonto an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteBankkonten.map((konto) => (
                      <Card key={konto.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                                <Landmark className="w-5 h-5 text-teal-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{konto.bezeichnung}</CardTitle>
                                <CardDescription className="text-sm font-mono">
                                  {konto.kontonummer}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditBankkontoDialog(konto)}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteBankkonto(konto.id)}
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {konto.bankname && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Bank:</span>
                                <span className="font-medium">{konto.bankname}</span>
                              </div>
                            )}
                            {konto.iban && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">IBAN:</span>
                                <span className="font-medium font-mono text-xs">{konto.iban.substring(0, 10)}...</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Saldo:</span>
                              <span className={`font-medium font-mono ${konto.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {konto.saldo ? parseFloat(konto.saldo.toString()).toLocaleString('de-DE', {minimumFractionDigits: 2}) : '0,00'} €
                              </span>
                            </div>
                          </div>
                          {konto.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {konto.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "gesellschafter" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-indigo-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteGesellschafter.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-indigo-600" />
                      <p className="font-medium">Keine Gesellschafter vorhanden</p>
                      <p className="text-sm">Legen Sie einen neuen Gesellschafter an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteGesellschafter.map((ges) => (
                      <Card key={ges.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <UserCircle className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{ges.name}</CardTitle>
                                <CardDescription className="text-sm font-mono">
                                  {ges.kontonummer}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditItem({
                                    id: ges.id.toString(),
                                    typ: "gesellschafter",
                                    name: ges.name,
                                    kontonummer: ges.kontonummer,
                                    details: {
                                      name: ges.name,
                                      typ: ges.typ,
                                      anteil: ges.anteil,
                                      einlage: ges.einlage,
                                      eintrittsdatum: ges.eintrittsdatum,
                                      strasse: ges.strasse,
                                      plz: ges.plz,
                                      ort: ges.ort,
                                      steuerId: ges.steuerId,
                                    },
                                    notizen: ges.notizen || "",
                                    erstelltAm: "",
                                    aktualisiertAm: "",
                                  });
                                  setFormData({
                                    name: ges.name,
                                    typ: ges.typ,
                                    anteil: ges.anteil,
                                    einlage: ges.einlage,
                                    eintrittsdatum: ges.eintrittsdatum,
                                    strasse: ges.strasse,
                                    plz: ges.plz,
                                    ort: ges.ort,
                                    steuerId: ges.steuerId,
                                  });
                                  setFormKontonummer(ges.kontonummer);
                                  setFormNotizen(ges.notizen || "");
                                  setDialogOpen(true);
                                }}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteGesellschafter(ges.id)}
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {ges.typ && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Typ:</span>
                                <span className="font-medium">{ges.typ === "natuerlich" ? "Natürliche Person" : "Juristische Person"}</span>
                              </div>
                            )}
                            {ges.anteil && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Anteil:</span>
                                <span className="font-medium">{ges.anteil}%</span>
                              </div>
                            )}
                            {ges.ort && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ort:</span>
                                <span className="font-medium">{ges.plz} {ges.ort}</span>
                              </div>
                            )}
                          </div>
                          {ges.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {ges.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "kreditkarte" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50 text-pink-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteKreditkarten.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50 text-pink-600" />
                      <p className="font-medium">Keine Kreditkarten vorhanden</p>
                      <p className="text-sm">Legen Sie eine neue Kreditkarte an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteKreditkarten.map((kk) => (
                      <Card key={kk.finanzkonto.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-pink-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{kk.finanzkonto.name}</CardTitle>
                                <CardDescription className="text-sm font-mono">
                                  {kk.finanzkonto.kontonummer || "Kein Konto"}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditItem({
                                    id: kk.finanzkonto.id.toString(),
                                    finanzkonto: kk.finanzkonto,
                                    typ: "kreditkarte",
                                    name: kk.finanzkonto.name,
                                    kontonummer: kk.finanzkonto.kontonummer || "",
                                    details: {},
                                    notizen: kk.finanzkonto.notizen || "",
                                    erstelltAm: "",
                                    aktualisiertAm: "",
                                  });
                                  setFormData({
                                    name: kk.finanzkonto.name,
                                    kreditkartenNummer: kk.finanzkonto.kreditkartenNummer,
                                    kreditlimit: kk.finanzkonto.kreditlimit,
                                    abrechnungstag: kk.finanzkonto.abrechnungstag,
                                  });
                                  setFormKontonummer(kk.finanzkonto.kontonummer || "");
                                  setFormNotizen(kk.finanzkonto.notizen || "");
                                  setDialogOpen(true);
                                }}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteKreditkarte(kk.finanzkonto.id)}
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {kk.finanzkonto.kreditkartenNummer && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Letzte 4:</span>
                                <span className="font-medium font-mono">****{kk.finanzkonto.kreditkartenNummer}</span>
                              </div>
                            )}
                            {kk.finanzkonto.kreditlimit && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Limit:</span>
                                <span className="font-medium">{parseFloat(kk.finanzkonto.kreditlimit.toString()).toLocaleString('de-DE')} €</span>
                              </div>
                            )}
                            {kk.finanzkonto.abrechnungstag && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Abrechnungstag:</span>
                                <span className="font-medium">{kk.finanzkonto.abrechnungstag}.</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "zahlungsdienstleister" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-50 text-violet-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteZahlungsdienstleister.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-50 text-violet-600" />
                      <p className="font-medium">Keine Zahlungsdienstleister vorhanden</p>
                      <p className="text-sm">Legen Sie einen neuen Zahlungsdienstleister an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteZahlungsdienstleister.map((zdl) => (
                      <Card key={zdl.finanzkonto.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                <ArrowRightLeft className="w-5 h-5 text-violet-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{zdl.finanzkonto.name}</CardTitle>
                                <CardDescription className="text-sm">
                                  {zdl.finanzkonto.typ.toUpperCase()}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditItem({
                                    id: zdl.finanzkonto.id.toString(),
                                    finanzkonto: zdl.finanzkonto,
                                    typ: "zahlungsdienstleister",
                                    name: zdl.finanzkonto.name,
                                    kontonummer: zdl.finanzkonto.kontonummer || "",
                                    details: {},
                                    notizen: zdl.finanzkonto.notizen || "",
                                    erstelltAm: "",
                                    aktualisiertAm: "",
                                  });
                                  setFormData({
                                    name: zdl.finanzkonto.name,
                                    typ: zdl.finanzkonto.typ,
                                    email: zdl.finanzkonto.email,
                                    waehrung: zdl.finanzkonto.waehrung,
                                  });
                                  setFormKontonummer(zdl.finanzkonto.kontonummer || "");
                                  setFormNotizen(zdl.finanzkonto.notizen || "");
                                  setDialogOpen(true);
                                }}
                                title="Bearbeiten"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteZahlungsdienstleister(zdl.finanzkonto.id)}
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {zdl.finanzkonto.email && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">E-Mail:</span>
                                <span className="font-medium truncate max-w-[150px]">{zdl.finanzkonto.email}</span>
                              </div>
                            )}
                            {zdl.finanzkonto.waehrung && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Währung:</span>
                                <span className="font-medium">{zdl.finanzkonto.waehrung}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "brokerkonto" ? (
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <PiggyBank className="w-12 h-12 mx-auto mb-4 opacity-50 text-emerald-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteBrokerkonten.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <PiggyBank className="w-12 h-12 mx-auto mb-4 opacity-50 text-emerald-600" />
                      <p className="font-medium">Keine Brokerkonten vorhanden</p>
                      <p className="text-sm">Legen Sie ein neues Brokerkonto an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteBrokerkonten.map((broker) => (
                      <Card key={broker.finanzkonto.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <PiggyBank className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{broker.finanzkonto.name}</CardTitle>
                                <CardDescription className="text-sm font-mono">
                                  {broker.finanzkonto.depotNummer || "Kein Depot"}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {broker.finanzkonto.brokerName && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Broker:</span>
                                <span className="font-medium">{broker.finanzkonto.brokerName}</span>
                              </div>
                            )}
                            {broker.finanzkonto.waehrung && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Währung:</span>
                                <span className="font-medium">{broker.finanzkonto.waehrung}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : typ.value === "vertrag" ? (
                /* ── Verträge v2 – eigene Darstellung ────────────────── */
                !selectedUnternehmenId ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-rose-600" />
                      <p className="font-medium">Kein Unternehmen ausgewählt</p>
                      <p className="text-sm">Bitte wählen Sie zuerst ein Unternehmen aus</p>
                    </div>
                  </Card>
                ) : gefilterteVertraege.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50 text-rose-600" />
                      <p className="font-medium">Keine Verträge vorhanden</p>
                      <p className="text-sm">Legen Sie einen neuen Vertrag an</p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gefilterteVertraege.map((v) => {
                      const netto = parseFloat(v.nettoBetrag ?? v.monatlicheBetrag ?? "0");
                      const ust = parseFloat(v.ustBetrag ?? "0");
                      const brutto = netto + ust;
                      const rhytmusLabel: Record<string, string> = {
                        monatlich: "mtl.", quartalsweise: "quartl.", halbjaehrlich: "halbj.", jaehrlich: "jährl.",
                      };
                      return (
                        <Card key={v.id} className="flex flex-col">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-base line-clamp-1">{v.bezeichnung}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {VERTRAGSART_LABELS[v.vertragsart || "sonstig"] ?? v.vertragsart}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {v.aktiv ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" title="Aktiv" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground" title="Inaktiv" />
                                )}
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={() => openVertragDialog(v)} title="Bearbeiten"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteVertrag(v.id)} title="Löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 pt-0">
                            <div className="space-y-1 text-sm">
                              {v.vertragspartner && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Partner:</span>
                                  <span className="font-medium">{v.vertragspartner}</span>
                                </div>
                              )}
                              {v.vertragsnummer && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Nr.:</span>
                                  <span className="font-medium font-mono">{v.vertragsnummer}</span>
                                </div>
                              )}
                              {netto > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Netto {rhytmusLabel[v.zahlungsrhythmus || "monatlich"] ?? "mtl."}:
                                  </span>
                                  <span className="font-medium">
                                    {netto.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                                  </span>
                                </div>
                              )}
                              {v.ustSatz && parseFloat(v.ustSatz) > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">+ {v.ustSatz} % USt:</span>
                                  <span>{ust.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
                                </div>
                              )}
                              {brutto > 0 && v.ustSatz && parseFloat(v.ustSatz) > 0 && (
                                <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                                  <span>Brutto:</span>
                                  <span>{brutto.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
                                </div>
                              )}
                              {v.beginn && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Beginn:</span>
                                  <span>{new Date(v.beginn).toLocaleDateString("de-DE")}</span>
                                </div>
                              )}
                              {v.ende && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ende:</span>
                                  <span>{new Date(v.ende).toLocaleDateString("de-DE")}</span>
                                </div>
                              )}
                              {v.gegenkontoNr && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Gegenkonto:</span>
                                  <span className="font-mono">{v.gegenkontoNr}</span>
                                </div>
                              )}
                            </div>
                            {v.belegUrl && (
                              <>
                                <Separator className="my-2" />
                                <a
                                  href={v.belegUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary hover:underline truncate block"
                                >
                                  Beleg öffnen
                                </a>
                              </>
                            )}
                            {v.notizen && (
                              <>
                                <Separator className="my-2" />
                                <p className="text-xs text-muted-foreground line-clamp-2">{v.notizen}</p>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )
              ) : gefilterteDaten.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-muted-foreground">
                    <Icon className={`w-12 h-12 mx-auto mb-4 opacity-50 ${typ.color}`} />
                    <p className="font-medium">Keine {typ.label} vorhanden</p>
                    <p className="text-sm">Legen Sie einen neuen {typ.labelSingular} an</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gefilterteDaten.map((item) => {
                    const ItemIcon = typ.icon;
                    return (
                      <Card key={item.id} className="flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${typ.bgColor} flex items-center justify-center`}>
                                <ItemIcon className={`w-5 h-5 ${typ.color}`} />
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
                                {item.kontonummer && (
                                  <CardDescription className="font-mono text-xs">
                                    Konto: {item.kontonummer}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(item)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0">
                          <div className="space-y-1 text-sm">
                            {typ.felder.slice(1, 4).map((feld) => {
                              const value = item.details[feld.key];
                              if (!value) return null;
                              return (
                                <div key={feld.key} className="flex justify-between">
                                  <span className="text-muted-foreground">{feld.label}:</span>
                                  <span className="font-medium truncate ml-2 max-w-[150px]">{value}</span>
                                </div>
                              );
                            })}
                          </div>
                          {item.notizen && (
                            <>
                              <Separator className="my-3" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.notizen}
                              </p>
                            </>
                          )}
                        </CardContent>
                        <div className="px-6 pb-4">
                          <div className="text-xs text-muted-foreground">
                            Erstellt: {formatDate(item.erstelltAm)}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* ── Vertrag CRUD-Dialog (Verträge v2) ─────────────────────────── */}
        <Dialog open={vertragDialogOpen} onOpenChange={(open) => {
          setVertragDialogOpen(open);
          if (!open) {
            setEditingVertragId(null);
            setVertragForm(VERTRAG_FORM_DEFAULT);
            setVertragUploadFile(null);
          }
        }}>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                {editingVertragId ? "Vertrag bearbeiten" : "Neuen Vertrag anlegen"}
              </DialogTitle>
              <DialogDescription>
                Kontenrahmen: {currentKontenrahmen} | Land: {currentLandCode} – Konten & USt-Sätze vorbelegt
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Vertragsbezeichnung */}
              <div className="space-y-1">
                <Label htmlFor="v-bezeichnung">Vertragsbezeichnung <span className="text-destructive">*</span></Label>
                <Input
                  id="v-bezeichnung"
                  placeholder="z. B. Büromiete Hauptstraße 1"
                  value={vertragForm.bezeichnung}
                  onChange={(e) => setVertragForm(f => ({ ...f, bezeichnung: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Vertragsart */}
                <div className="space-y-1">
                  <Label>Vertragsart</Label>
                  <Select
                    value={vertragForm.vertragsart}
                    onValueChange={(v) => {
                      const kontoVorschlag = (VERTRAGS_KONTEN[currentKontenrahmen] ?? VERTRAGS_KONTEN["SKR04"])[v] ?? "";
                      setVertragForm(f => ({ ...f, vertragsart: v, gegenkontoNr: f.gegenkontoNr || kontoVorschlag }));
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(VERTRAGSART_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vertragspartner */}
                <div className="space-y-1">
                  <Label htmlFor="v-partner">Vertragspartner</Label>
                  <Input
                    id="v-partner"
                    placeholder="Name des Vertragspartners"
                    value={vertragForm.vertragspartner}
                    onChange={(e) => setVertragForm(f => ({ ...f, vertragspartner: e.target.value }))}
                  />
                </div>

                {/* Vertragsnummer */}
                <div className="space-y-1">
                  <Label htmlFor="v-nr">Vertragsnummer</Label>
                  <Input
                    id="v-nr"
                    placeholder="Interne oder externe Nr."
                    value={vertragForm.vertragsnummer}
                    onChange={(e) => setVertragForm(f => ({ ...f, vertragsnummer: e.target.value }))}
                  />
                </div>

                {/* Kündigungsfrist */}
                <div className="space-y-1">
                  <Label htmlFor="v-frist">Kündigungsfrist</Label>
                  <Input
                    id="v-frist"
                    placeholder="z. B. 3 Monate"
                    value={vertragForm.kuendigungsfrist}
                    onChange={(e) => setVertragForm(f => ({ ...f, kuendigungsfrist: e.target.value }))}
                  />
                </div>

                {/* Beginn */}
                <div className="space-y-1">
                  <Label htmlFor="v-beginn">Vertragsbeginn</Label>
                  <Input
                    id="v-beginn"
                    type="date"
                    value={vertragForm.beginn}
                    onChange={(e) => setVertragForm(f => ({ ...f, beginn: e.target.value }))}
                  />
                </div>

                {/* Ende */}
                <div className="space-y-1">
                  <Label htmlFor="v-ende">Vertragsende</Label>
                  <Input
                    id="v-ende"
                    type="date"
                    value={vertragForm.ende}
                    onChange={(e) => setVertragForm(f => ({ ...f, ende: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Netto / USt / Brutto */}
              <p className="text-sm font-medium text-muted-foreground">Betrag & Steuer</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="v-netto">Nettobetrag (mtl.)</Label>
                  <Input
                    id="v-netto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={vertragForm.nettoBetrag}
                    onChange={(e) => setVertragForm(f => ({ ...f, nettoBetrag: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>USt-Satz</Label>
                  <Select
                    value={vertragForm.ustSatz}
                    onValueChange={(v) => setVertragForm(f => ({ ...f, ustSatz: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ustSaetzeForLand.map(({ satz, label }) => (
                        <SelectItem key={satz} value={satz}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Bruttobetrag</Label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted text-sm font-semibold flex items-center">
                    {vertragBrutto > 0
                      ? vertragBrutto.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
                      : "–"}
                  </div>
                  {vertragUstBetrag > 0 && (
                    <p className="text-xs text-muted-foreground">
                      davon USt: {vertragUstBetrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </p>
                  )}
                </div>
              </div>

              {/* Zahlungsrhythmus */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Zahlungsrhythmus</Label>
                  <Select
                    value={vertragForm.zahlungsrhythmus}
                    onValueChange={(v) => setVertragForm(f => ({ ...f, zahlungsrhythmus: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monatlich">Monatlich</SelectItem>
                      <SelectItem value="quartalsweise">Quartalsweise</SelectItem>
                      <SelectItem value="halbjaehrlich">Halbjährlich</SelectItem>
                      <SelectItem value="jaehrlich">Jährlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gegenkonto */}
                <div className="space-y-1">
                  <Label htmlFor="v-gegenkonto">Gegenkonto (Aufwand)</Label>
                  <Input
                    id="v-gegenkonto"
                    placeholder={
                      (VERTRAGS_KONTEN[currentKontenrahmen] ?? VERTRAGS_KONTEN["SKR04"])[vertragForm.vertragsart] ?? ""
                    }
                    value={vertragForm.gegenkontoNr}
                    onChange={(e) => setVertragForm(f => ({ ...f, gegenkontoNr: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>

              <Separator />

              {/* Dokument Upload */}
              <div className="space-y-2">
                <Label>Vertragsdokument (PDF / Bild)</Label>
                {vertragForm.belegUrl && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                    <FileText className="w-4 h-4" />
                    <a href={vertragForm.belegUrl} target="_blank" rel="noopener noreferrer">
                      Aktuelles Dokument ansehen
                    </a>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setVertragUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                />
                {vertragUploadFile && (
                  <p className="text-xs text-muted-foreground">
                    Ausgewählt: {vertragUploadFile.name} ({(vertragUploadFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
                {/* Fallback: direkte URL-Eingabe */}
                <Input
                  type="url"
                  placeholder="Oder URL direkt eingeben: https://..."
                  value={vertragForm.belegUrl}
                  onChange={(e) => setVertragForm(f => ({ ...f, belegUrl: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Notizen */}
              <div className="space-y-1">
                <Label htmlFor="v-notizen">Notizen</Label>
                <Textarea
                  id="v-notizen"
                  placeholder="Zusätzliche Informationen..."
                  value={vertragForm.notizen}
                  onChange={(e) => setVertragForm(f => ({ ...f, notizen: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Aktiv */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="v-aktiv"
                  checked={vertragForm.aktiv}
                  onCheckedChange={(checked) => setVertragForm(f => ({ ...f, aktiv: !!checked }))}
                />
                <Label htmlFor="v-aktiv" className="cursor-pointer">Vertrag aktiv</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setVertragDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleVertragSpeichern}
                disabled={
                  createVertragMutation.isPending ||
                  updateVertragMutation.isPending ||
                  uploadBelegVertragMutation.isPending
                }
              >
                <Save className="w-4 h-4 mr-2" />
                {uploadBelegVertragMutation.isPending ? "Lädt hoch..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog für Neu/Bearbeiten */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${activeTypConfig.color}`} />
                {editItem ? `${activeTypConfig.labelSingular} bearbeiten` : `Neuen ${activeTypConfig.labelSingular} anlegen`}
              </DialogTitle>
              <DialogDescription>
                Kontobereich: {activeTypConfig.kontobereich}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Kontonummer */}
              <div className="space-y-2">
                <Label htmlFor="kontonummer">Kontonummer</Label>
                <Input
                  id="kontonummer"
                  placeholder={activeTypConfig.kontobereich}
                  value={formKontonummer}
                  onChange={(e) => setFormKontonummer(e.target.value)}
                  className="font-mono"
                />
              </div>

              <Separator />

              {/* Dynamische Felder basierend auf Typ */}
              <div className="grid grid-cols-2 gap-4">
                {activeTypConfig.felder.map((feld) => (
                  <div key={feld.key} className={feld.key === "notizen" ? "col-span-2" : ""}>
                    <Label htmlFor={feld.key}>
                      {feld.label}
                      {feld.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {/* Spezielle Behandlung für Kontotyp bei Bankkonten */}
                    {feld.key === "kontotyp" && activeTab === "bankkonto" ? (
                      <Select
                        value={formData[feld.key] || "girokonto"}
                        onValueChange={(v) => setFormData({ ...formData, [feld.key]: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="girokonto">Girokonto</SelectItem>
                          <SelectItem value="sparkonto">Sparkonto</SelectItem>
                          <SelectItem value="festgeld">Festgeld</SelectItem>
                          <SelectItem value="kreditkarte">Kreditkarte</SelectItem>
                          <SelectItem value="sonstig">Sonstig</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : feld.key === "waehrung" && activeTab === "bankkonto" ? (
                      <Select
                        value={formData[feld.key] || "EUR"}
                        onValueChange={(v) => setFormData({ ...formData, [feld.key]: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="CHF">CHF (Fr.)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={feld.key}
                        value={formData[feld.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [feld.key]: e.target.value })}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Notizen */}
              <div className="space-y-2">
                <Label htmlFor="notizen">Notizen / Anmerkungen</Label>
                <Textarea
                  id="notizen"
                  placeholder="Zusätzliche Informationen..."
                  value={formNotizen}
                  onChange={(e) => setFormNotizen(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Kontierungsregeln Section */}
        {selectedUnternehmenId && (
          <div className="mt-12">
            <Kontierungsregeln unternehmenId={selectedUnternehmenId} />
          </div>
        )}

        {/* Vorschläge Dialog */}
        <Dialog open={suggestionsDialogOpen} onOpenChange={setSuggestionsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                {activeTab === "kreditor" ? "Kreditoren" : "Debitoren"} aus Buchungen vorschlagen
              </DialogTitle>
              <DialogDescription>
                Diese Geschäftspartner kommen in Ihren Buchungen vor, sind aber noch nicht als {activeTab === "kreditor" ? "Kreditor" : "Debitor"} angelegt.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {activeTab === "kreditor" && kreditorenSuggestions?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Keine neuen Kreditoren gefunden</p>
                  <p className="text-sm">Alle Geschäftspartner aus den Buchungen sind bereits angelegt.</p>
                </div>
              )}
              {activeTab === "debitor" && debitorenSuggestions?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Keine neuen Debitoren gefunden</p>
                  <p className="text-sm">Alle Geschäftspartner aus den Buchungen sind bereits angelegt.</p>
                </div>
              )}
              {activeTab === "kreditor" && kreditorenSuggestions?.map((suggestion: any) => (
                <Card key={suggestion.kontonummer} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{suggestion.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Konto: <span className="font-mono">{suggestion.kontonummer}</span>
                        {" • "}
                        {suggestion.buchungenCount} Buchung(en)
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Öffne neues Kreditor-Formular mit vorausgefüllten Daten
                        openNewDialog();
                        setSuggestionsDialogOpen(false);
                        // Fülle das Formular vor
                        setTimeout(() => {
                          const nameInput = document.querySelector('input[placeholder*="Firma"]') as HTMLInputElement;
                          const kontoInput = document.querySelector('input[placeholder*="70000"]') as HTMLInputElement;
                          if (nameInput) nameInput.value = suggestion.name;
                          if (kontoInput) kontoInput.value = suggestion.kontonummer;
                        }, 100);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Anlegen
                    </Button>
                  </div>
                </Card>
              ))}
              {activeTab === "debitor" && debitorenSuggestions?.map((suggestion: any) => (
                <Card key={suggestion.kontonummer} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{suggestion.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Konto: <span className="font-mono">{suggestion.kontonummer}</span>
                        {" • "}
                        {suggestion.buchungenCount} Buchung(en)
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        // Öffne neues Debitor-Formular mit vorausgefüllten Daten
                        openNewDialog();
                        setSuggestionsDialogOpen(false);
                        // Fülle das Formular vor
                        setTimeout(() => {
                          const nameInput = document.querySelector('input[placeholder*="Firma"]') as HTMLInputElement;
                          const kontoInput = document.querySelector('input[placeholder*="1800"]') as HTMLInputElement;
                          if (nameInput) nameInput.value = suggestion.name;
                          if (kontoInput) kontoInput.value = suggestion.kontonummer;
                        }, 100);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Anlegen
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuggestionsDialogOpen(false)}>
                Schließen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
