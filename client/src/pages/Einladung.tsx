import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { 
  Mail, 
  Building2, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  LogIn
} from "lucide-react";
import { toast } from "sonner";

export default function Einladung() {
  const [, params] = useRoute("/einladung/:code");
  const [, setLocation] = useLocation();
  const code = params?.code || "";
  const { user, isLoading: authLoading } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  // Einladung abrufen
  const { data: invite, isLoading, error } = trpc.einladungen.getByCode.useQuery(
    { code },
    { enabled: !!code }
  );

  // Einladung annehmen
  const acceptMutation = trpc.einladungen.accept.useMutation({
    onSuccess: (data) => {
      toast.success(`Willkommen bei ${data.unternehmensname}!`, {
        description: `Sie wurden als ${getRoleName(data.rolle)} hinzugefügt.`,
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error("Fehler beim Annehmen der Einladung", {
        description: error.message,
      });
    },
  });

  const handleAccept = async () => {
    if (!user) {
      // Direkt zum OAuth-Login weiterleiten mit Einladungs-URL als Rücksprung
      window.location.href = getLoginUrl(`/einladung/${code}`);
      return;
    }
    setIsAccepting(true);
    await acceptMutation.mutateAsync({ code });
    setIsAccepting(false);
  };

  const getRoleName = (rolle: string) => {
    switch (rolle) {
      case "admin": return "Administrator";
      case "buchhalter": return "Buchhalter";
      case "viewer": return "Nur Lesen";
      default: return rolle;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ausstehend</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Angenommen</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Abgelaufen</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Storniert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Einladung wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Einladung nicht gefunden</CardTitle>
            <CardDescription>
              Diese Einladung existiert nicht oder der Link ist ungültig.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/")} variant="outline">
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = invite.status === "expired";
  const isAccepted = invite.status === "accepted";
  const isCancelled = invite.status === "cancelled";
  const canAccept = invite.status === "pending" && !isExpired;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, ${invite.unternehmensfarbe}10 0%, white 100%)` 
      }}
    >
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center pb-2">
          {/* Firmenfarbe-Akzent */}
          <div 
            className="h-2 -mt-6 -mx-6 mb-6 rounded-t-lg"
            style={{ backgroundColor: invite.unternehmensfarbe }}
          />
          
          {/* Status-Icon */}
          <div 
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${invite.unternehmensfarbe}20` }}
          >
            {isAccepted ? (
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            ) : isExpired || isCancelled ? (
              <AlertCircle className="h-10 w-10 text-red-600" />
            ) : (
              <Mail className="h-10 w-10" style={{ color: invite.unternehmensfarbe }} />
            )}
          </div>

          <CardTitle className="text-2xl">
            {isAccepted ? "Einladung angenommen" : 
             isExpired ? "Einladung abgelaufen" :
             isCancelled ? "Einladung storniert" :
             "Sie wurden eingeladen!"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {canAccept ? (
              <>
                <span className="font-medium">{invite.eingeladenVonName}</span> hat Sie eingeladen, 
                dem Unternehmen <span className="font-medium">{invite.unternehmensname}</span> beizutreten.
              </>
            ) : isAccepted ? (
              "Sie sind bereits Mitglied dieses Unternehmens."
            ) : (
              "Diese Einladung ist nicht mehr gültig."
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Einladungsdetails */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Unternehmen</p>
                <p className="font-medium">{invite.unternehmensname}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Ihre Rolle</p>
                <p className="font-medium">{getRoleName(invite.rolle)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Eingeladen als</p>
                <p className="font-medium">{invite.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Gültig bis</p>
                <p className="font-medium">
                  {new Date(invite.expiresAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-5 w-5" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(invite.status)}
              </div>
            </div>
          </div>

          {/* Nachricht */}
          {invite.nachricht && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-1">Nachricht:</p>
              <p className="text-blue-700">{invite.nachricht}</p>
            </div>
          )}

          {/* E-Mail-Hinweis */}
          {canAccept && user && user.email?.toLowerCase() !== invite.email.toLowerCase() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Hinweis:</strong> Sie sind mit <strong>{user.email}</strong> angemeldet, 
                aber die Einladung wurde an <strong>{invite.email}</strong> gesendet. 
                Sie können die Einladung trotzdem annehmen.
              </p>
            </div>
          )}

          {/* Aktions-Buttons */}
          <div className="flex flex-col gap-3">
            {canAccept && (
              <>
                {user ? (
                  <Button 
                    size="lg" 
                    className="w-full"
                    style={{ backgroundColor: invite.unternehmensfarbe }}
                    onClick={handleAccept}
                    disabled={isAccepting || acceptMutation.isPending}
                  >
                    {isAccepting || acceptMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Einladung annehmen
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full"
                    style={{ backgroundColor: invite.unternehmensfarbe }}
                    onClick={handleAccept}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Anmelden oder Registrieren
                  </Button>
                )}
              </>
            )}

            {isAccepted && (
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => setLocation("/dashboard")}
              >
                Zum Dashboard
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
            >
              Zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
