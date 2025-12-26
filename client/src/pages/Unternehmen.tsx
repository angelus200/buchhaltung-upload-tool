import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Building2, 
  Plus, 
  Settings, 
  ChevronRight,
  FileSpreadsheet,
  BarChart3,
  StickyNote,
  Briefcase,
  Upload,
  Check,
  MapPin,
  Phone,
  Mail,
  Globe,
  Hash,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

interface UnternehmenFormData {
  name: string;
  rechtsform: string;
  steuernummer: string;
  ustIdNr: string;
  handelsregister: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  telefon: string;
  email: string;
  website: string;
  kontenrahmen: "SKR03" | "SKR04";
  wirtschaftsjahrBeginn: number;
  beraternummer: string;
  mandantennummer: string;
}

const RECHTSFORMEN = [
  "Einzelunternehmen",
  "GbR",
  "OHG",
  "KG",
  "GmbH",
  "GmbH & Co. KG",
  "UG (haftungsbeschränkt)",
  "AG",
  "eG",
  "Stiftung",
  "Verein",
];

const MONATE = [
  { value: 1, label: "Januar" },
  { value: 2, label: "Februar" },
  { value: 3, label: "März" },
  { value: 4, label: "April" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Dezember" },
];

function createEmptyFormData(): UnternehmenFormData {
  return {
    name: "",
    rechtsform: "",
    steuernummer: "",
    ustIdNr: "",
    handelsregister: "",
    strasse: "",
    plz: "",
    ort: "",
    land: "Deutschland",
    telefon: "",
    email: "",
    website: "",
    kontenrahmen: "SKR03",
    wirtschaftsjahrBeginn: 1,
    beraternummer: "",
    mandantennummer: "",
  };
}

export default function Unternehmen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UnternehmenFormData>(createEmptyFormData());
  const [selectedUnternehmen, setSelectedUnternehmen] = useState<number | null>(null);
  
  // LocalStorage für ausgewähltes Unternehmen
  useEffect(() => {
    const saved = localStorage.getItem("selectedUnternehmenId");
    if (saved) {
      setSelectedUnternehmen(parseInt(saved));
    }
  }, []);

  // TRPC Queries
  const { data: unternehmenList, refetch } = trpc.unternehmen.list.useQuery();
  const createMutation = trpc.unternehmen.create.useMutation({
    onSuccess: () => {
      toast.success("Unternehmen erfolgreich angelegt");
      setDialogOpen(false);
      setFormData(createEmptyFormData());
      refetch();
    },
    onError: (error: { message: string }) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Bitte geben Sie einen Firmennamen ein");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSelectUnternehmen = (id: number) => {
    setSelectedUnternehmen(id);
    localStorage.setItem("selectedUnternehmenId", id.toString());
    toast.success("Unternehmen ausgewählt");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Unternehmensverwaltung</h1>
                <p className="text-sm text-slate-500">Mandanten und Firmen verwalten</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Buchungen
                </Button>
              </Link>
              <Link href="/uebersicht">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Übersicht
                </Button>
              </Link>
              <Link href="/stammdaten">
                <Button variant="outline" size="sm" className="gap-2">
                  <Briefcase className="w-4 h-4" />
                  Stammdaten
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Aktionen */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Ihre Unternehmen</h2>
            <p className="text-sm text-slate-500">Wählen Sie ein Unternehmen aus oder legen Sie ein neues an</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4" />
                Neues Unternehmen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neues Unternehmen anlegen</DialogTitle>
                <DialogDescription>
                  Erfassen Sie die Stammdaten des Unternehmens. Diese werden für den DATEV-Export benötigt.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Grunddaten */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    Grunddaten
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Firmenname *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Muster GmbH"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rechtsform">Rechtsform</Label>
                      <Select
                        value={formData.rechtsform}
                        onValueChange={(value) => setFormData({ ...formData, rechtsform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {RECHTSFORMEN.map((rf) => (
                            <SelectItem key={rf} value={rf}>{rf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="handelsregister">Handelsregister</Label>
                      <Input
                        id="handelsregister"
                        value={formData.handelsregister}
                        onChange={(e) => setFormData({ ...formData, handelsregister: e.target.value })}
                        placeholder="HRB 12345"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Steuerdaten */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-teal-600" />
                    Steuerdaten
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="steuernummer">Steuernummer</Label>
                      <Input
                        id="steuernummer"
                        value={formData.steuernummer}
                        onChange={(e) => setFormData({ ...formData, steuernummer: e.target.value })}
                        placeholder="123/456/78901"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ustIdNr">USt-IdNr.</Label>
                      <Input
                        id="ustIdNr"
                        value={formData.ustIdNr}
                        onChange={(e) => setFormData({ ...formData, ustIdNr: e.target.value })}
                        placeholder="DE123456789"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Adresse */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    Adresse
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="strasse">Straße, Hausnummer</Label>
                      <Input
                        id="strasse"
                        value={formData.strasse}
                        onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
                        placeholder="Musterstraße 123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plz">PLZ</Label>
                      <Input
                        id="plz"
                        value={formData.plz}
                        onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ort">Ort</Label>
                      <Input
                        id="ort"
                        value={formData.ort}
                        onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                        placeholder="Musterstadt"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Kontakt */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-600" />
                    Kontakt
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefon">Telefon</Label>
                      <Input
                        id="telefon"
                        value={formData.telefon}
                        onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                        placeholder="+49 123 456789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="info@muster.de"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="www.muster.de"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Buchhaltung */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                    Buchhaltungseinstellungen
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="kontenrahmen">Kontenrahmen *</Label>
                      <Select
                        value={formData.kontenrahmen}
                        onValueChange={(value: "SKR03" | "SKR04") => setFormData({ ...formData, kontenrahmen: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SKR03">SKR 03 (Prozessgliederung)</SelectItem>
                          <SelectItem value="SKR04">SKR 04 (Abschlussgliederung)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="wirtschaftsjahrBeginn">Wirtschaftsjahr beginnt</Label>
                      <Select
                        value={formData.wirtschaftsjahrBeginn.toString()}
                        onValueChange={(value) => setFormData({ ...formData, wirtschaftsjahrBeginn: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONATE.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="beraternummer">DATEV Beraternummer</Label>
                      <Input
                        id="beraternummer"
                        value={formData.beraternummer}
                        onChange={(e) => setFormData({ ...formData, beraternummer: e.target.value })}
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mandantennummer">DATEV Mandantennummer</Label>
                      <Input
                        id="mandantennummer"
                        value={formData.mandantennummer}
                        onChange={(e) => setFormData({ ...formData, mandantennummer: e.target.value })}
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreate} className="bg-teal-600 hover:bg-teal-700">
                  Unternehmen anlegen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Unternehmensliste */}
        <div className="grid gap-4">
          {unternehmenList && unternehmenList.length > 0 ? (
            unternehmenList.map((item: { unternehmen: { id: number; name: string; rechtsform: string | null; steuernummer: string | null; ustIdNr: string | null; plz: string | null; ort: string | null; kontenrahmen: string; mandantennummer: string | null }; rolle: string }) => (
              <Card 
                key={item.unternehmen.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedUnternehmen === item.unternehmen.id 
                    ? "ring-2 ring-teal-500 bg-teal-50/50" 
                    : ""
                }`}
                onClick={() => handleSelectUnternehmen(item.unternehmen.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        selectedUnternehmen === item.unternehmen.id 
                          ? "bg-teal-600" 
                          : "bg-slate-100"
                      }`}>
                        <Building2 className={`w-6 h-6 ${
                          selectedUnternehmen === item.unternehmen.id 
                            ? "text-white" 
                            : "text-slate-600"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{item.unternehmen.name}</h3>
                          {item.unternehmen.rechtsform && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {item.unternehmen.rechtsform}
                            </span>
                          )}
                          {selectedUnternehmen === item.unternehmen.id && (
                            <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Aktiv
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          {item.unternehmen.ort && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.unternehmen.plz} {item.unternehmen.ort}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileSpreadsheet className="w-3 h-3" />
                            {item.unternehmen.kontenrahmen}
                          </span>
                          {item.unternehmen.mandantennummer && (
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              Mandant {item.unternehmen.mandantennummer}
                            </span>
                          )}
                        </div>
                        {item.unternehmen.steuernummer && (
                          <p className="text-xs text-slate-400 mt-1">
                            St.-Nr.: {item.unternehmen.steuernummer}
                            {item.unternehmen.ustIdNr && ` | USt-IdNr.: ${item.unternehmen.ustIdNr}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.rolle === "admin" 
                          ? "bg-amber-100 text-amber-700" 
                          : item.rolle === "buchhalter"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {item.rolle === "admin" ? "Administrator" : item.rolle === "buchhalter" ? "Buchhalter" : "Nur Lesen"}
                      </span>
                      <Button variant="ghost" size="icon">
                        <Settings className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">Noch keine Unternehmen</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Legen Sie Ihr erstes Unternehmen an, um mit der Buchhaltung zu beginnen.
                </p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4" />
                  Erstes Unternehmen anlegen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info-Box */}
        <Card className="mt-8 bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Kontenrahmen SKR 03 vs. SKR 04</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>SKR 03</strong> (Prozessgliederungsprinzip) ist der am häufigsten verwendete Kontenrahmen 
                  für kleine und mittlere Unternehmen. Die Konten sind nach betrieblichen Prozessen gegliedert.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mt-2">
                  <strong>SKR 04</strong> (Abschlussgliederungsprinzip) orientiert sich an der Bilanz- und GuV-Struktur 
                  und wird häufiger von größeren Unternehmen verwendet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
