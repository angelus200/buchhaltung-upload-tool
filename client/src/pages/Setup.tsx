import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

export default function Setup() {
  const [, setLocation] = useLocation();
  const [linking, setLinking] = useState(true);
  const [success, setSuccess] = useState(false);

  // Session ID aus URL holen
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  const linkMutation = trpc.stripe.linkUserToSubscription.useMutation({
    onSuccess: () => {
      console.log("🔵 User successfully linked to subscription");
      setSuccess(true);
      setLinking(false);

      // Nach 2 Sekunden zum Dashboard weiterleiten
      setTimeout(() => {
        setLocation("/app");
      }, 2000);
    },
    onError: (error) => {
      console.error("🔵 Linking failed:", error);
      toast.error(`Verknüpfung fehlgeschlagen: ${error.message}`);
      setLinking(false);

      // Nach Fehler auch zum Dashboard (User kann später verknüpfen)
      setTimeout(() => {
        setLocation("/app");
      }, 3000);
    },
  });

  useEffect(() => {
    if (!sessionId) {
      // Keine Session ID → direkt zum Dashboard
      setLocation("/app");
      return;
    }

    // Verknüpfung starten
    linkMutation.mutate({ sessionId });
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12 text-cyan-600" />
          </div>
          <CardTitle className="text-2xl">
            {success ? "Account eingerichtet!" : "Ihr Account wird eingerichtet..."}
          </CardTitle>
          <CardDescription>
            {success
              ? "Sie werden zum Dashboard weitergeleitet"
              : "Einen Moment bitte, wir verknüpfen Ihr Abonnement"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {linking && !success && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
              <p className="text-sm text-gray-600">Verknüpfung läuft...</p>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-cyan-600" />
              </div>
              <p className="text-sm text-gray-600">Erfolgreich! Weiterleitung...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
