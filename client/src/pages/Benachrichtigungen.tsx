import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { 
  Bell, 
  Plus, 
  Trash2,
  Settings,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Upload,
  BarChart3,
  Briefcase,
  Building2,
  FileText,
  Euro,
  Send
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

interface Benachrichtigung {
  id: string;
  titel: string;
  inhalt: string;
  typ: "info" | "warnung" | "erfolg" | "erinnerung";
  zeitpunkt: string;
  gelesen: boolean;
  aktiv: boolean;
  wiederholung: "einmalig" | "taeglich" | "woechentlich" | "monatlich";
  bezug?: string;
}

interface BenachrichtigungsRegel {
  id: string;
  name: string;
  beschreibung: string;
  trigger: string;
  aktiv: boolean;
}

const BENACHRICHTIGUNGS_TYPEN = [
  { value: "info", label: "Information", icon: Info, color: "text-blue-500 bg-blue-50" },
  { value: "warnung", label: "Warnung", icon: AlertTriangle, color: "text-amber-500 bg-amber-50" },
  { value: "erfolg", label: "Erfolg", icon: CheckCircle2, color: "text-green-500 bg-green-50" },
  { value: "erinnerung", label: "Erinnerung", icon: Clock, color: "text-purple-500 bg-purple-50" },
];

const WIEDERHOLUNGS_OPTIONEN = [
  { value: "einmalig", label: "Einmalig" },
  { value: "taeglich", label: "Täglich" },
  { value: "woechentlich", label: "Wöchentlich" },
  { value: "monatlich", label: "Monatlich" },
];

const STANDARD_REGELN: BenachrichtigungsRegel[] = [
  {
    id: "1",
    name: "Fehlende Belege",
    beschreibung: "Benachrichtigung wenn Buchungen ohne Beleg vorhanden sind",
    trigger: "buchung_ohne_beleg",
    aktiv: true,
  },
  {
    id: "2",
    name: "Monatsabschluss Erinnerung",
    beschreibung: "Erinnerung am 25. jeden Monats für den Monatsabschluss",
    trigger: "monatsabschluss",
    aktiv: true,
  },
  {
    id: "3",
    name: "USt-Voranmeldung",
    beschreibung: "Erinnerung an die USt-Voranmeldung (10. des Folgemonats)",
    trigger: "ust_voranmeldung",
    aktiv: true,
  },
  {
    id: "4",
    name: "DATEV-Export erfolgreich",
    beschreibung: "Bestätigung nach erfolgreichem DATEV-Export",
    trigger: "datev_export",
    aktiv: true,
  },
  {
    id: "5",
    name: "Neue Buchung erfasst",
    beschreibung: "Benachrichtigung bei jeder neuen Buchung",
    trigger: "neue_buchung",
    aktiv: false,
  },
];

function createEmptyBenachrichtigung(): Omit<Benachrichtigung, "id"> {
  return {
    titel: "",
    inhalt: "",
    typ: "info",
    zeitpunkt: new Date().toISOString().slice(0, 16),
    gelesen: false,
    aktiv: true,
    wiederholung: "einmalig",
    bezug: "",
  };
}

export default function Benachrichtigungen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(createEmptyBenachrichtigung());
  const [benachrichtigungen, setBenachrichtigungen] = useState<Benachrichtigung[]>([]);
  const [regeln, setRegeln] = useState<BenachrichtigungsRegel[]>(STANDARD_REGELN);
  const [activeTab, setActiveTab] = useState<"liste" | "regeln" | "senden">("liste");

  // Lade gespeicherte Benachrichtigungen aus LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("benachrichtigungen");
    if (saved) {
      setBenachrichtigungen(JSON.parse(saved));
    }
    const savedRegeln = localStorage.getItem("benachrichtigungsRegeln");
    if (savedRegeln) {
      setRegeln(JSON.parse(savedRegeln));
    }
  }, []);

  // Speichere Benachrichtigungen in LocalStorage
  useEffect(() => {
    localStorage.setItem("benachrichtigungen", JSON.stringify(benachrichtigungen));
  }, [benachrichtigungen]);

  useEffect(() => {
    localStorage.setItem("benachrichtigungsRegeln", JSON.stringify(regeln));
  }, [regeln]);

  // TRPC Mutation für System-Benachrichtigungen
  const sendNotificationMutation = trpc.system.notifyOwner.useMutation({
    onSuccess: () => {
      toast.success("Benachrichtigung erfolgreich gesendet");
    },
    onError: (error: { message: string }) => {
      toast.error(`Fehler beim Senden: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!formData.titel) {
      toast.error("Bitte geben Sie einen Titel ein");
      return;
    }
    
    const newBenachrichtigung: Benachrichtigung = {
      ...formData,
      id: Date.now().toString(),
    };
    
    setBenachrichtigungen([newBenachrichtigung, ...benachrichtigungen]);
    setDialogOpen(false);
    setFormData(createEmptyBenachrichtigung());
    toast.success("Benachrichtigung erstellt");
  };

  const handleDelete = (id: string) => {
    setBenachrichtigungen(benachrichtigungen.filter(b => b.id !== id));
    toast.success("Benachrichtigung gelöscht");
  };

  const handleMarkAsRead = (id: string) => {
    setBenachrichtigungen(benachrichtigungen.map(b => 
      b.id === id ? { ...b, gelesen: true } : b
    ));
  };

  const handleToggleRegel = (id: string) => {
    setRegeln(regeln.map(r => 
      r.id === id ? { ...r, aktiv: !r.aktiv } : r
    ));
    toast.success("Regel aktualisiert");
  };

  const handleSendSystemNotification = (titel: string, inhalt: string) => {
    sendNotificationMutation.mutate({ title: titel, content: inhalt });
  };

  const getTypInfo = (typ: string) => {
    return BENACHRICHTIGUNGS_TYPEN.find(t => t.value === typ) || BENACHRICHTIGUNGS_TYPEN[0];
  };

  const ungeleseneAnzahl = benachrichtigungen.filter(b => !b.gelesen).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Einheitlicher Header */}
      <AppHeader title="Benachrichtigungen" subtitle="Erinnerungen und Hinweise verwalten" />

      <main className="container py-8">
        {/* Tab-Navigation */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant={activeTab === "liste" ? "default" : "outline"}
            onClick={() => setActiveTab("liste")}
            className={activeTab === "liste" ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            <Bell className="w-4 h-4 mr-2" />
            Benachrichtigungen
            {ungeleseneAnzahl > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {ungeleseneAnzahl}
              </span>
            )}
          </Button>
          <Button 
            variant={activeTab === "regeln" ? "default" : "outline"}
            onClick={() => setActiveTab("regeln")}
            className={activeTab === "regeln" ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            <Settings className="w-4 h-4 mr-2" />
            Regeln
          </Button>
          <Button 
            variant={activeTab === "senden" ? "default" : "outline"}
            onClick={() => setActiveTab("senden")}
            className={activeTab === "senden" ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            <Send className="w-4 h-4 mr-2" />
            Senden
          </Button>
        </div>

        {/* Tab: Benachrichtigungen Liste */}
        {activeTab === "liste" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-medium text-slate-900">Ihre Benachrichtigungen</h2>
                <p className="text-sm text-slate-500">
                  {ungeleseneAnzahl > 0 
                    ? `${ungeleseneAnzahl} ungelesene Benachrichtigung${ungeleseneAnzahl > 1 ? "en" : ""}`
                    : "Alle Benachrichtigungen gelesen"
                  }
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-amber-500 hover:bg-amber-600">
                    <Plus className="w-4 h-4" />
                    Neue Benachrichtigung
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Neue Benachrichtigung erstellen</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie eine benutzerdefinierte Benachrichtigung oder Erinnerung.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="titel">Titel *</Label>
                      <Input
                        id="titel"
                        value={formData.titel}
                        onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                        placeholder="z.B. Monatsabschluss Dezember"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="inhalt">Inhalt</Label>
                      <Textarea
                        id="inhalt"
                        value={formData.inhalt}
                        onChange={(e) => setFormData({ ...formData, inhalt: e.target.value })}
                        placeholder="Detaillierte Beschreibung..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="typ">Typ</Label>
                        <Select
                          value={formData.typ}
                          onValueChange={(value: "info" | "warnung" | "erfolg" | "erinnerung") => 
                            setFormData({ ...formData, typ: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BENACHRICHTIGUNGS_TYPEN.map((typ) => (
                              <SelectItem key={typ.value} value={typ.value}>
                                <div className="flex items-center gap-2">
                                  <typ.icon className="w-4 h-4" />
                                  {typ.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="wiederholung">Wiederholung</Label>
                        <Select
                          value={formData.wiederholung}
                          onValueChange={(value: "einmalig" | "taeglich" | "woechentlich" | "monatlich") => 
                            setFormData({ ...formData, wiederholung: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WIEDERHOLUNGS_OPTIONEN.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="zeitpunkt">Zeitpunkt</Label>
                      <Input
                        id="zeitpunkt"
                        type="datetime-local"
                        value={formData.zeitpunkt}
                        onChange={(e) => setFormData({ ...formData, zeitpunkt: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bezug">Bezug (optional)</Label>
                      <Input
                        id="bezug"
                        value={formData.bezug}
                        onChange={(e) => setFormData({ ...formData, bezug: e.target.value })}
                        placeholder="z.B. Buchung #123, Kreditor XY"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Abbrechen
                    </Button>
                    <Button onClick={handleCreate} className="bg-amber-500 hover:bg-amber-600">
                      Erstellen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Benachrichtigungsliste */}
            <div className="space-y-3">
              {benachrichtigungen.length > 0 ? (
                benachrichtigungen.map((item) => {
                  const typInfo = getTypInfo(item.typ);
                  const IconComponent = typInfo.icon;
                  
                  return (
                    <Card 
                      key={item.id} 
                      className={`transition-all ${!item.gelesen ? "ring-2 ring-amber-200 bg-amber-50/30" : ""}`}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typInfo.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-slate-900">{item.titel}</h3>
                              {!item.gelesen && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                                  Neu
                                </span>
                              )}
                              {item.wiederholung !== "einmalig" && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                  {WIEDERHOLUNGS_OPTIONEN.find(o => o.value === item.wiederholung)?.label}
                                </span>
                              )}
                            </div>
                            {item.inhalt && (
                              <p className="text-sm text-slate-600 mt-1">{item.inhalt}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.zeitpunkt).toLocaleString("de-DE")}
                              </span>
                              {item.bezug && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {item.bezug}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Keine Benachrichtigungen</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Erstellen Sie Ihre erste Benachrichtigung oder aktivieren Sie automatische Regeln.
                    </p>
                    <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4" />
                      Erste Benachrichtigung erstellen
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Tab: Regeln */}
        {activeTab === "regeln" && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-slate-900">Automatische Benachrichtigungsregeln</h2>
              <p className="text-sm text-slate-500">
                Aktivieren oder deaktivieren Sie automatische Benachrichtigungen für verschiedene Ereignisse.
              </p>
            </div>

            <div className="space-y-3">
              {regeln.map((regel) => (
                <Card key={regel.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          regel.aktiv ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                        }`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{regel.name}</h3>
                          <p className="text-sm text-slate-500">{regel.beschreibung}</p>
                        </div>
                      </div>
                      <Switch
                        checked={regel.aktiv}
                        onCheckedChange={() => handleToggleRegel(regel.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-6 bg-slate-50 border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Über automatische Benachrichtigungen</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Automatische Benachrichtigungen werden basierend auf Ereignissen in Ihrer Buchhaltung 
                      ausgelöst. Sie können jede Regel individuell aktivieren oder deaktivieren. 
                      Die Benachrichtigungen erscheinen in der Liste und können auch per E-Mail versendet werden 
                      (wenn in den Einstellungen konfiguriert).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Tab: Senden */}
        {activeTab === "senden" && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-slate-900">System-Benachrichtigung senden</h2>
              <p className="text-sm text-slate-500">
                Senden Sie eine Benachrichtigung an den Projektinhaber (z.B. für wichtige Meldungen).
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="system-titel">Titel *</Label>
                    <Input
                      id="system-titel"
                      placeholder="z.B. Wichtige Buchhaltungsmeldung"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="system-inhalt">Inhalt *</Label>
                    <Textarea
                      id="system-inhalt"
                      placeholder="Detaillierte Nachricht..."
                      rows={5}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      className="gap-2 bg-amber-500 hover:bg-amber-600"
                      onClick={() => {
                        const titel = (document.getElementById("system-titel") as HTMLInputElement)?.value;
                        const inhalt = (document.getElementById("system-inhalt") as HTMLTextAreaElement)?.value;
                        if (titel && inhalt) {
                          handleSendSystemNotification(titel, inhalt);
                        } else {
                          toast.error("Bitte füllen Sie Titel und Inhalt aus");
                        }
                      }}
                      disabled={sendNotificationMutation.isPending}
                    >
                      <Send className="w-4 h-4" />
                      {sendNotificationMutation.isPending ? "Wird gesendet..." : "Benachrichtigung senden"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 mb-1">Hinweis</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      System-Benachrichtigungen werden direkt an den Projektinhaber gesendet und erscheinen 
                      in dessen Manus-Dashboard. Verwenden Sie diese Funktion nur für wichtige Meldungen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
