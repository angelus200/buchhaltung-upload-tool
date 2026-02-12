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
  ArrowRightLeft
} from "lucide-react";
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
  const [editItem, setEditItem] = useState<Stammdatum | null>(null);
  const [editingSachkontoId, setEditingSachkontoId] = useState<number | null>(null);
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);

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

  const deleteGesellschafterMutation = trpc.stammdaten.gesellschafter.delete.useMutation({
    onSuccess: () => {
      refetchGesellschafter();
      toast.info("Gesellschafter gelöscht");
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

  const openNewDialog = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

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
        notizen: formNotizen || undefined,
      };

      if (editItem) {
        updateBankkontoMutation.mutate({ id: parseInt(editItem.id), ...bankkontoData });
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
        // Update not implemented yet - needs mutation
        toast.error("Bearbeiten von Gesellschaftern ist noch nicht implementiert");
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
        // Update not implemented yet
        toast.error("Bearbeiten von Finanzkonten ist noch nicht implementiert");
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
  }, [activeTab, activeTypConfig, formData, formKontonummer, formNotizen, editItem, stammdaten, resetForm, selectedUnternehmenId, editingSachkontoId, createSachkontoMutation, updateSachkontoMutation, createKreditorMutation, updateKreditorMutation, createDebitorMutation, updateDebitorMutation, createGesellschafterMutation, createFinanzkontoMutation]);

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

  // Gefilterte Daten für aktiven Tab
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
