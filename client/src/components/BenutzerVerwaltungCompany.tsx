import { useState } from "react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Shield,
  Edit,
  Trash2,
  User,
  Clock,
  UserCog,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BenutzerVerwaltungCompanyProps {
  unternehmenId: number;
  unternehmensname: string;
  isAdmin: boolean;
  currentUserId: number;
}

export default function BenutzerVerwaltungCompany({
  unternehmenId,
  unternehmensname,
  isAdmin,
  currentUserId,
}: BenutzerVerwaltungCompanyProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBenutzer, setSelectedBenutzer] = useState<any>(null);
  const [neueRolle, setNeueRolle] = useState<"admin" | "buchhalter" | "viewer">("buchhalter");

  // Query für Benutzer
  const { data: benutzer = [], refetch } = trpc.benutzer.listByUnternehmen.useQuery(
    { unternehmenId },
    { enabled: !!unternehmenId }
  );

  // Mutation für Rollenänderung
  const updateRolleMutation = trpc.benutzer.updateRolle.useMutation({
    onSuccess: () => {
      toast.success("Rolle erfolgreich geändert");
      setEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  // Mutation für Benutzer entfernen
  const removeMutation = trpc.benutzer.removeFromUnternehmen.useMutation({
    onSuccess: () => {
      toast.success("Benutzer erfolgreich entfernt");
      setDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Fehler", { description: error.message });
    },
  });

  const handleEditClick = (benutzer: any) => {
    setSelectedBenutzer(benutzer);
    setNeueRolle(benutzer.rolle);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (benutzer: any) => {
    setSelectedBenutzer(benutzer);
    setDeleteDialogOpen(true);
  };

  const handleUpdateRolle = () => {
    if (!selectedBenutzer) return;
    updateRolleMutation.mutate({
      zuordnungId: selectedBenutzer.id,
      unternehmenId,
      rolle: neueRolle,
    });
  };

  const handleRemove = () => {
    if (!selectedBenutzer) return;
    removeMutation.mutate({
      zuordnungId: selectedBenutzer.id,
      unternehmenId,
    });
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

  const getRoleBadge = (rolle: string) => {
    switch (rolle) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        );
      case "buchhalter":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <UserCog className="w-3 h-3 mr-1" />
            Buchhalter
          </Badge>
        );
      case "viewer":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <User className="w-3 h-3 mr-1" />
            Nur Lesen
          </Badge>
        );
      default:
        return <Badge variant="outline">{rolle}</Badge>;
    }
  };

  const adminCount = benutzer.filter((b) => b.rolle === "admin").length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Benutzer
          </CardTitle>
          <CardDescription>
            {benutzer.length} Benutzer mit Zugriff auf {unternehmensname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {benutzer.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Benutzer zugewiesen</p>
              <p className="text-sm mt-1">Laden Sie Benutzer ein, um loszulegen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Letzte Anmeldung</TableHead>
                  {isAdmin && <TableHead className="text-right">Aktionen</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {benutzer.map((benutzer) => {
                  const isCurrentUser = benutzer.oderId === currentUserId;
                  const isLastAdmin = benutzer.rolle === "admin" && adminCount === 1;

                  return (
                    <TableRow key={benutzer.id}>
                      <TableCell className="font-medium">
                        {benutzer.name || "Unbekannt"}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="ml-2">
                            Sie
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {benutzer.email || "-"}
                      </TableCell>
                      <TableCell>{getRoleBadge(benutzer.rolle)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(benutzer.lastSignedIn).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditClick(benutzer)}
                              disabled={isCurrentUser}
                              title={isCurrentUser ? "Sie können Ihre eigene Rolle nicht ändern" : "Rolle ändern"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClick(benutzer)}
                              disabled={isCurrentUser || isLastAdmin}
                              title={
                                isCurrentUser
                                  ? "Sie können sich nicht selbst entfernen"
                                  : isLastAdmin
                                  ? "Das Unternehmen muss mindestens einen Admin haben"
                                  : "Benutzer entfernen"
                              }
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rolle ändern</DialogTitle>
            <DialogDescription>
              Ändern Sie die Rolle von {selectedBenutzer?.name || selectedBenutzer?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={neueRolle} onValueChange={(v: any) => setNeueRolle(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="buchhalter">Buchhalter</SelectItem>
                <SelectItem value="viewer">Nur Lesen</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Berechtigungen:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {neueRolle === "admin" && (
                  <>
                    <li>Voller Zugriff auf alle Funktionen</li>
                    <li>Kann Benutzer verwalten und einladen</li>
                    <li>Kann Unternehmenseinstellungen ändern</li>
                  </>
                )}
                {neueRolle === "buchhalter" && (
                  <>
                    <li>Kann Buchungen erstellen und bearbeiten</li>
                    <li>Kann Stammdaten verwalten</li>
                    <li>Kann Berichte exportieren</li>
                  </>
                )}
                {neueRolle === "viewer" && (
                  <>
                    <li>Kann alle Daten einsehen</li>
                    <li>Keine Bearbeitungsrechte</li>
                    <li>Keine Exportmöglichkeiten</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateRolle} disabled={updateRolleMutation.isPending}>
              {updateRolleMutation.isPending ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie {selectedBenutzer?.name || selectedBenutzer?.email} wirklich von{" "}
              {unternehmensname} entfernen? Diese Aktion kann nicht rückgängig gemacht werden.
              <br />
              <br />
              Der Benutzer verliert den Zugriff auf alle Daten und Funktionen dieses Unternehmens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMutation.isPending ? "Wird entfernt..." : "Entfernen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
