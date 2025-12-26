import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { 
  FileText, 
  Shield,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Login() {
  const { user, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  // Wenn bereits eingeloggt, zum Dashboard weiterleiten
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Buchhaltung Upload Tool</h1>
              <p className="text-sm text-slate-500">Belege erfassen und DATEV-Export erstellen</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Linke Seite: Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Professionelle Buchhaltung für Ihr Unternehmen
              </h2>
              <p className="text-lg text-slate-600">
                Erfassen Sie Belege, erstellen Sie Buchungssätze und exportieren Sie Ihre Daten 
                direkt im DATEV-Format für Ihren Steuerberater.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Beleg-Upload & Buchungen</h3>
                  <p className="text-slate-600">
                    Laden Sie Belege per Drag & Drop hoch und erstellen Sie automatisch Buchungssätze 
                    nach SKR 03 oder SKR 04.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Mehrere Unternehmen</h3>
                  <p className="text-slate-600">
                    Verwalten Sie die Buchhaltung für mehrere Firmen in einer Anwendung – 
                    ideal für Unternehmensgruppen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Team-Zusammenarbeit</h3>
                  <p className="text-slate-600">
                    Arbeiten Sie mit Ihrem Team zusammen – mit Rollen und Berechtigungen 
                    für jeden Mitarbeiter.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">GoBD-konform</h3>
                  <p className="text-slate-600">
                    Alle Buchungen werden revisionssicher protokolliert – 
                    bereit für jede Betriebsprüfung.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rechte Seite: Login-Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Anmelden</CardTitle>
                <CardDescription>
                  Melden Sie sich an, um auf das Buchhaltungs-Dashboard zuzugreifen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 text-base" 
                    onClick={() => login()}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Mit Google anmelden
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base"
                    onClick={() => login()}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13zM5.5 5a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13z"/>
                      <path fill="currentColor" d="M11 8h5v2h-5v5H9v-5H4V8h5V3h2v5z"/>
                    </svg>
                    Mit Microsoft anmelden
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base"
                    onClick={() => login()}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Mit Apple anmelden
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Vorteile</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Kostenlose Registrierung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Sichere Anmeldung über OAuth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Kein separates Passwort nötig</span>
                  </div>
                </div>

                <p className="text-xs text-center text-slate-500">
                  Mit der Anmeldung akzeptieren Sie unsere Nutzungsbedingungen und Datenschutzrichtlinie.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-12">
        <div className="container py-6 text-center text-sm text-slate-500">
          © 2025 Buchhaltung Upload Tool. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
