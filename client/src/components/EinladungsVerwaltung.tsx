import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  UserPlus,
  Copy,
  RotateCw,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface EinladungsVerwaltungProps {
  unternehmenId: number;
  unternehmensname: string;
  isAdmin: boolean;
}

export default function EinladungsVerwaltung({
  unternehmenId,
  unternehmensname,
  isAdmin,
}: EinladungsVerwaltungProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [rolle, setRolle] = useState<"admin" | "buchhalter" | "viewer">("buchhalter");
  const [nachricht, setNachricht] = useState("");

  // Query für Einladungen
  const { data: einladungen = [], refetch } = trpc.einladungen.listByUnternehmen.useQuery(
    { unternehmenId },
    { enabled: !!unternehmenId }
  );

  // Mutation für neue Einladung
  const createMutation = trpc.einladungen.create.useMutation({
    onSuccess: (data) => {
      toast.success("Einladung versendet!", {
        description: data.emailSent
          ? `Eine E-Mail wurde an ${data.email} gesendet.`
          : `Einladungslink wurde erstellt. ${data.emailSent === false ? "E-Mail-Versand fehlgeschlagen." : ""}`,
        action: {
          label: "Link kopieren",
          onClick: () => {
            navigator.clipboard.writeText(data.fullInviteUrl);
            toast.success("Link kopiert!");
          },
        },
      });
      setDialogOpen(false);
      setEmail("");
      setNachricht("");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  // Mutation für Stornierung
  const cancelMutation = trpc.einladungen.cancel.useMutation({
    onSuccess: () => {
      toast.success("Einladung storniert");
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  // Mutation für erneutes Versenden
  const resendMutation = trpc.einladungen.resend.useMutation({
    onSuccess: (data) => {
      toast.success("Einladung erneuert!", {
        description: "Ein neuer Einladungslink wurde erstellt.",
        action: {
          label: "Link kopieren",
          onClick: () => {
            navigator.clipboard.writeText(`${window.location.origin}${data.inviteUrl}`);
            toast.success("Link kopiert!");
          },
        },
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const handleCreate = () => {
    if (!email) {
      toast.error("Bitte E-Mail-Adresse eingeben");
      return;
    }
    createMutation.mutate({
      email,
      unternehmenId,
      rolle,
      nachricht: nachricht || undefined,
    });
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/einladung/${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Einladungslink kopiert!");
  };

  const getRoleName = (rolle: string) => {
    switch (rolle) {
      case "admin":
        return "Administrator";
      case "buchhalter":
        return "Buchhalter";
      case "viewer":
        return "Nur Lesen";
      default:
        return rolle;
    }
  };

  const getStatusBadge = (status: string, expiresAt: Date) => {
    const isExpired = new Date() > new Date(expiresAt);
    const effectiveStatus = isExpired && status === "pending" ? "expired" : status;

    switch (effectiveStatus) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Ausstehend
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Angenommen
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Abgelaufen
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Storniert
          </Badge>
        );
      default:
        return <Badge variant="outline">{effectiveStatus}</Badge>;
    }
  };

  const pendingCount = einladungen.filter((e) => {
    const isExpired = new Date() > new Date(e.expiresAt);
    return e.status === "pending" && !isExpired;
  }).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Einladungen
            </CardTitle>
            <CardDescription>
              Laden Sie Benutzer ein, {unternehmensname} beizutreten
              {pendingCount > 0 && ` • ${pendingCount} ausstehend`}
            </CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Neuer Benutzer einladen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Benutzer einladen</DialogTitle>
                  <DialogDescription>
                    Senden Sie eine Einladung an einen neuen Benutzer für {unternehmensname}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail-Adresse *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="benutzer@beispiel.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rolle">Rolle *</Label>
                    <Select value={rolle} onValueChange={(v: any) => setRolle(v)}>
                      <SelectTrigger id="rolle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="buchhalter">Buchhalter</SelectItem>
                        <SelectItem value="viewer">Nur Lesen</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {rolle === "admin" && "Voller Zugriff auf alle Funktionen"}
                      {rolle === "buchhalter" && "Kann Buchungen erstellen und bearbeiten"}
                      {rolle === "viewer" && "Kann nur Daten einsehen"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nachricht">Persönliche Nachricht (optional)</Label>
                    <Textarea
                      id="nachricht"
                      placeholder="Fügen Sie eine persönliche Nachricht hinzu..."
                      value={nachricht}
                      onChange={(e) => setNachricht(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Wird gesendet..." : "Einladung senden"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {einladungen.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Einladungen versendet</p>
            {isAdmin && (
              <p className="text-sm mt-1">Klicken Sie auf "Einladen", um loszulegen</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eingeladen von</TableHead>
                <TableHead>Gültig bis</TableHead>
                {isAdmin && <TableHead className="text-right">Aktionen</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {einladungen.map((einladung) => {
                const isExpired = new Date() > new Date(einladung.expiresAt);
                const isPending = einladung.status === "pending" && !isExpired;

                return (
                  <TableRow key={einladung.id}>
                    <TableCell className="font-medium">{einladung.email}</TableCell>
                    <TableCell>{getRoleName(einladung.rolle)}</TableCell>
                    <TableCell>{getStatusBadge(einladung.status, einladung.expiresAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {einladung.eingeladenVonName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(einladung.expiresAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyLink(einladung.code)}
                                title="Link kopieren"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => resendMutation.mutate({ id: einladung.id })}
                                disabled={resendMutation.isPending}
                                title="Erneut senden"
                              >
                                <RotateCw className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelMutation.mutate({ id: einladung.id })}
                                disabled={cancelMutation.isPending}
                                title="Stornieren"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              window.open(`/einladung/${einladung.code}`, "_blank")
                            }
                            title="Vorschau"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
