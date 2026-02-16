import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  FileText,
  Shield,
  Users,
  Building2,
  CheckCircle2,
  LogIn,
  UserPlus
} from "lucide-react";

export default function Login() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Wenn bereits eingeloggt, zur App weiterleiten
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/app");
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

          {/* Rechte Seite: Clerk Auth mit Tabs */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signin" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Anmelden
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Registrieren
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-0">
                  <SignIn
                    routing="hash"
                    afterSignInUrl="/app"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-xl",
                        footer: "hidden", // Hide default footer to avoid duplicate "Sign up" links
                      }
                    }}
                  />
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <SignUp
                    routing="hash"
                    afterSignUpUrl="/app"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-xl",
                        footer: "hidden", // Hide default footer
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>

              <Card className="mt-4 shadow-xl">
                <CardContent className="pt-6">
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
                  <p className="text-xs text-center text-slate-500 mt-4">
                    Mit der {activeTab === "signin" ? "Anmeldung" : "Registrierung"} akzeptieren Sie unsere Nutzungsbedingungen und Datenschutzrichtlinie.
                  </p>
                </CardContent>
              </Card>
            </div>
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
