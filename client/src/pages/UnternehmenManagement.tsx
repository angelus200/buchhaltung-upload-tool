import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/AppHeader";
import { ChevronLeft, Users, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import EinladungsVerwaltung from "@/components/EinladungsVerwaltung";
import BenutzerVerwaltungCompany from "@/components/BenutzerVerwaltungCompany";
import { toast } from "sonner";

export default function UnternehmenManagement() {
  const [, params] = useRoute("/unternehmen/:id/management");
  const [, setLocation] = useLocation();
  const unternehmenId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();

  // Query für Unternehmensdaten
  const { data: unternehmenListe } = trpc.unternehmen.list.useQuery();
  const unternehmen = unternehmenListe?.find((u) => u.id === unternehmenId);

  // Query für Berechtigungen
  const { data: berechtigungen } = trpc.benutzer.meineBerechtigungen.useQuery(
    { unternehmenId: unternehmenId! },
    { enabled: !!unternehmenId }
  );

  useEffect(() => {
    if (!unternehmenId) {
      toast.error("Ungültiges Unternehmen");
      setLocation("/unternehmen");
    }
  }, [unternehmenId, setLocation]);

  if (!unternehmenId || !unternehmen || !user) {
    return null;
  }

  const isAdmin = berechtigungen?.rolle === "admin" || user.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/unternehmen")}
            className="gap-2 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück zu Unternehmen
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">{unternehmen.name}</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Benutzer und Einladungen für dieses Unternehmen
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Benutzer
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Mail className="w-4 h-4" />
              Einladungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <BenutzerVerwaltungCompany
              unternehmenId={unternehmenId}
              unternehmensname={unternehmen.name}
              isAdmin={isAdmin}
              currentUserId={user.id}
            />
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            <EinladungsVerwaltung
              unternehmenId={unternehmenId}
              unternehmensname={unternehmen.name}
              isAdmin={isAdmin}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
