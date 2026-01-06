import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield,
  FileText,
  Database,
  BarChart3,
  Users,
  Eye,
  Edit,
  Download,
  UserPlus,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Berechtigungen {
  buchungenLesen: boolean;
  buchungenSchreiben: boolean;
  stammdatenLesen: boolean;
  stammdatenSchreiben: boolean;
  berichteLesen: boolean;
  berichteExportieren: boolean;
  einladungenVerwalten: boolean;
}

interface BerechtigungenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zuordnungId: number;
  unternehmenId: number;
  benutzerName: string;
  benutzerEmail: string;
  aktuelleRolle: "admin" | "buchhalter" | "viewer";
  onSuccess?: () => void;
}

const ROLLEN_VORLAGEN = {
  admin: {
    name: "Administrator",
    beschreibung: "Voller Zugriff auf alle Funktionen",
    berechtigungen: {
      buchungenLesen: true,
      buchungenSchreiben: true,
      stammdatenLesen: true,
      stammdatenSchreiben: true,
      berichteLesen: true,
      berichteExportieren: true,
      einladungenVerwalten: true,
    },
  },
  buchhalter: {
    name: "Buchhalter",
    beschreibung: "Kann Buchungen und Stammdaten bearbeiten",
    berechtigungen: {
      buchungenLesen: true,
      buchungenSchreiben: true,
      stammdatenLesen: true,
      stammdatenSchreiben: true,
      berichteLesen: true,
      berichteExportieren: true,
      einladungenVerwalten: false,
    },
  },
  viewer: {
    name: "Nur Lesen",
    beschreibung: "Kann nur Daten einsehen",
    berechtigungen: {
      buchungenLesen: true,
      buchungenSchreiben: false,
      stammdatenLesen: true,
      stammdatenSchreiben: false,
      berichteLesen: true,
      berichteExportieren: false,
      einladungenVerwalten: false,
    },
  },
};

export default function BerechtigungenDialog({
  open,
  onOpenChange,
  zuordnungId,
  unternehmenId,
  benutzerName,
  benutzerEmail,
  aktuelleRolle,
  onSuccess,
}: BerechtigungenDialogProps) {
  const [berechtigungen, setBerechtigungen] = useState<Berechtigungen>(
    ROLLEN_VORLAGEN[aktuelleRolle].berechtigungen
  );
  const [selectedRolle, setSelectedRolle] = useState<"admin" | "buchhalter" | "viewer">(aktuelleRolle);

  // Query für aktuelle Berechtigungen
  const detailedPermissionsQuery = trpc.benutzer.getDetailedPermissions.useQuery(
    { zuordnungId, unternehmenId },
    { enabled: open }
  );

  // Mutations
  const updatePermissionsMutation = trpc.benutzer.updateDetailedPermissions.useMutation({
    onSuccess: () => {
      toast.success("Berechtigungen erfolgreich aktualisiert");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Fehler beim Aktualisieren", { description: error.message });
    },
  });

  const applyTemplateMutation = trpc.benutzer.applyRoleTemplate.useMutation({
    onSuccess: (data) => {
      setBerechtigungen(data.berechtigungen);
      toast.success(`Vorlage "${ROLLEN_VORLAGEN[selectedRolle].name}" angewendet`);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Fehler beim Anwenden der Vorlage", { description: error.message });
    },
  });

  // Berechtigungen laden wenn Dialog geöffnet wird
  useEffect(() => {
    if (detailedPermissionsQuery.data) {
      setBerechtigungen(detailedPermissionsQuery.data.berechtigungen);
      setSelectedRolle(detailedPermissionsQuery.data.rolle as "admin" | "buchhalter" | "viewer");
    }
  }, [detailedPermissionsQuery.data]);

  const handleToggle = (key: keyof Berechtigungen) => {
    setBerechtigungen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate({
      zuordnungId,
      unternehmenId,
      berechtigungen,
    });
  };

  const handleApplyTemplate = () => {
    applyTemplateMutation.mutate({
      zuordnungId,
      unternehmenId,
      rolle: selectedRolle,
    });
  };

  const isLoading = detailedPermissionsQuery.isLoading;
  const isSaving = updatePermissionsMutation.isPending || applyTemplateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-500" />
            Berechtigungen verwalten
          </DialogTitle>
          <DialogDescription>
            Detaillierte Berechtigungen für{" "}
            <span className="font-medium">{benutzerName || benutzerEmail}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Rollen-Vorlage */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <Label className="text-sm font-medium mb-3 block">Rollen-Vorlage anwenden</Label>
              <div className="flex gap-3">
                <Select
                  value={selectedRolle}
                  onValueChange={(value: "admin" | "buchhalter" | "viewer") => setSelectedRolle(value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLLEN_VORLAGEN).map(([key, rolle]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col">
                          <span>{rolle.name}</span>
                          <span className="text-xs text-muted-foreground">{rolle.beschreibung}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleApplyTemplate}
                  disabled={isSaving}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Anwenden
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Setzt alle Berechtigungen auf die Standard-Werte der gewählten Rolle zurück.
              </p>
            </div>

            <Separator />

            {/* Buchungen */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Buchungen</h3>
              </div>
              <div className="grid gap-4 pl-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="buchungenLesen" className="cursor-pointer">
                      Buchungen anzeigen
                    </Label>
                  </div>
                  <Switch
                    id="buchungenLesen"
                    checked={berechtigungen.buchungenLesen}
                    onCheckedChange={() => handleToggle("buchungenLesen")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="buchungenSchreiben" className="cursor-pointer">
                      Buchungen erstellen & bearbeiten
                    </Label>
                  </div>
                  <Switch
                    id="buchungenSchreiben"
                    checked={berechtigungen.buchungenSchreiben}
                    onCheckedChange={() => handleToggle("buchungenSchreiben")}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Stammdaten */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Stammdaten</h3>
              </div>
              <div className="grid gap-4 pl-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="stammdatenLesen" className="cursor-pointer">
                      Stammdaten anzeigen
                    </Label>
                  </div>
                  <Switch
                    id="stammdatenLesen"
                    checked={berechtigungen.stammdatenLesen}
                    onCheckedChange={() => handleToggle("stammdatenLesen")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="stammdatenSchreiben" className="cursor-pointer">
                      Stammdaten erstellen & bearbeiten
                    </Label>
                  </div>
                  <Switch
                    id="stammdatenSchreiben"
                    checked={berechtigungen.stammdatenSchreiben}
                    onCheckedChange={() => handleToggle("stammdatenSchreiben")}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Berichte */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Berichte & Auswertungen</h3>
              </div>
              <div className="grid gap-4 pl-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="berichteLesen" className="cursor-pointer">
                      Berichte anzeigen
                    </Label>
                  </div>
                  <Switch
                    id="berichteLesen"
                    checked={berechtigungen.berichteLesen}
                    onCheckedChange={() => handleToggle("berichteLesen")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="berichteExportieren" className="cursor-pointer">
                      Berichte exportieren (PDF, Excel)
                    </Label>
                  </div>
                  <Switch
                    id="berichteExportieren"
                    checked={berechtigungen.berichteExportieren}
                    onCheckedChange={() => handleToggle("berichteExportieren")}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Administration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold">Administration</h3>
              </div>
              <div className="grid gap-4 pl-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-slate-400" />
                    <Label htmlFor="einladungenVerwalten" className="cursor-pointer">
                      Mitarbeiter einladen & verwalten
                    </Label>
                  </div>
                  <Switch
                    id="einladungenVerwalten"
                    checked={berechtigungen.einladungenVerwalten}
                    onCheckedChange={() => handleToggle("einladungenVerwalten")}
                  />
                </div>
              </div>
            </div>

            {/* Zusammenfassung */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-medium mb-3">Aktive Berechtigungen</h4>
              <div className="flex flex-wrap gap-2">
                {berechtigungen.buchungenLesen && (
                  <Badge variant="secondary">Buchungen lesen</Badge>
                )}
                {berechtigungen.buchungenSchreiben && (
                  <Badge variant="secondary">Buchungen schreiben</Badge>
                )}
                {berechtigungen.stammdatenLesen && (
                  <Badge variant="secondary">Stammdaten lesen</Badge>
                )}
                {berechtigungen.stammdatenSchreiben && (
                  <Badge variant="secondary">Stammdaten schreiben</Badge>
                )}
                {berechtigungen.berichteLesen && (
                  <Badge variant="secondary">Berichte lesen</Badge>
                )}
                {berechtigungen.berichteExportieren && (
                  <Badge variant="secondary">Berichte exportieren</Badge>
                )}
                {berechtigungen.einladungenVerwalten && (
                  <Badge variant="secondary">Einladungen verwalten</Badge>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Speichern...
              </>
            ) : (
              "Berechtigungen speichern"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
