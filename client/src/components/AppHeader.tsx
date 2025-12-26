import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Upload, 
  BarChart3, 
  Briefcase, 
  StickyNote, 
  Bell, 
  Users, 
  LayoutDashboard, 
  Shield,
  ChevronDown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

interface UnternehmenData {
  unternehmen: {
    id: number;
    name: string;
    farbe: string | null;
    logoUrl: string | null;
    kontenrahmen: string;
  };
  rolle: string;
}

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  const [location] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [firmenFarbe, setFirmenFarbe] = useState<string>("#0d9488");
  const [firmenName, setFirmenName] = useState<string>("");
  const [firmenLogo, setFirmenLogo] = useState<string>("");

  // TRPC Query für Unternehmensliste
  const { data: unternehmenList } = trpc.unternehmen.list.useQuery();

  // Lade gespeicherte Auswahl aus LocalStorage
  useEffect(() => {
    const savedId = localStorage.getItem("selectedUnternehmenId");
    const savedFarbe = localStorage.getItem("selectedUnternehmenFarbe");
    const savedName = localStorage.getItem("selectedUnternehmenName");
    const savedLogo = localStorage.getItem("selectedUnternehmenLogo");
    
    if (savedId) setSelectedId(parseInt(savedId));
    if (savedFarbe) setFirmenFarbe(savedFarbe);
    if (savedName) setFirmenName(savedName);
    if (savedLogo) setFirmenLogo(savedLogo);
  }, []);

  // Aktualisiere bei Änderung der Unternehmensliste
  useEffect(() => {
    if (unternehmenList && selectedId) {
      const selected = unternehmenList.find((item: UnternehmenData) => item.unternehmen.id === selectedId);
      if (selected) {
        setFirmenFarbe(selected.unternehmen.farbe || "#0d9488");
        setFirmenName(selected.unternehmen.name);
        setFirmenLogo(selected.unternehmen.logoUrl || "");
      }
    }
  }, [unternehmenList, selectedId]);

  const handleUnternehmenChange = (value: string) => {
    const id = parseInt(value);
    setSelectedId(id);
    localStorage.setItem("selectedUnternehmenId", value);
    
    const selected = unternehmenList?.find((item: UnternehmenData) => item.unternehmen.id === id);
    if (selected) {
      const farbe = selected.unternehmen.farbe || "#0d9488";
      const name = selected.unternehmen.name;
      const logo = selected.unternehmen.logoUrl || "";
      
      setFirmenFarbe(farbe);
      setFirmenName(name);
      setFirmenLogo(logo);
      
      localStorage.setItem("selectedUnternehmenFarbe", farbe);
      localStorage.setItem("selectedUnternehmenName", name);
      if (logo) {
        localStorage.setItem("selectedUnternehmenLogo", logo);
      } else {
        localStorage.removeItem("selectedUnternehmenLogo");
      }
    }
  };

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      {/* Farbiger Balken oben */}
      <div 
        className="h-1 w-full transition-colors duration-300"
        style={{ backgroundColor: firmenFarbe }}
      />
      
      <div className="container py-3">
        <div className="flex items-center justify-between">
          {/* Links: Logo/Icon + Titel + Firmenauswahl */}
          <div className="flex items-center gap-4">
            {/* Firmenlogo oder Icon */}
            {firmenLogo ? (
              <img 
                src={firmenLogo} 
                alt={firmenName}
                className="w-10 h-10 object-contain rounded-lg border border-slate-200"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-colors duration-300"
                style={{ backgroundColor: firmenFarbe }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className="flex flex-col">
              {/* Firmenname prominent */}
              {firmenName ? (
                <>
                  <h1 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                    {firmenName}
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: firmenFarbe }}
                    />
                  </h1>
                  <p className="text-xs text-slate-500">{title || "Buchhaltung Upload Tool"}</p>
                </>
              ) : (
                <>
                  <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                    {title || "Buchhaltung Upload Tool"}
                  </h1>
                  <p className="text-xs text-slate-500">{subtitle || "Belege erfassen und DATEV-Export erstellen"}</p>
                </>
              )}
            </div>

            {/* Unternehmensauswahl Dropdown */}
            {unternehmenList && unternehmenList.length > 0 && (
              <div className="ml-4 pl-4 border-l border-slate-200">
                <Select 
                  value={selectedId?.toString() || ""} 
                  onValueChange={handleUnternehmenChange}
                >
                  <SelectTrigger className="w-[200px] h-8 text-sm">
                    <SelectValue placeholder="Firma auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {unternehmenList.map((item: UnternehmenData) => (
                      <SelectItem key={item.unternehmen.id} value={item.unternehmen.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.unternehmen.farbe || "#0d9488" }}
                          />
                          <span>{item.unternehmen.name}</span>
                          <span className="text-xs text-slate-400">({item.unternehmen.kontenrahmen})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Rechts: Navigation */}
          <div className="flex items-center gap-1">
            <Link href="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Upload className="w-3.5 h-3.5" />
                Buchungen
              </Button>
            </Link>
            <Link href="/uebersicht">
              <Button 
                variant={isActive("/uebersicht") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/uebersicht") ? { backgroundColor: firmenFarbe } : {}}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Übersicht
              </Button>
            </Link>
            <Link href="/stammdaten">
              <Button 
                variant={isActive("/stammdaten") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/stammdaten") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Stammdaten
              </Button>
            </Link>
            <Link href="/notizen">
              <Button 
                variant={isActive("/notizen") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/notizen") ? { backgroundColor: firmenFarbe } : {}}
              >
                <StickyNote className="w-3.5 h-3.5" />
                Notizen
              </Button>
            </Link>
            <Link href="/unternehmen">
              <Button 
                variant={isActive("/unternehmen") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/unternehmen") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Building2 className="w-3.5 h-3.5" />
                Unternehmen
              </Button>
            </Link>
            
            <div className="w-px h-6 bg-slate-200 mx-1" />
            
            <Link href="/benachrichtigungen">
              <Button 
                variant={isActive("/benachrichtigungen") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/benachrichtigungen") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Bell className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/benutzerverwaltung">
              <Button 
                variant={isActive("/benutzerverwaltung") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/benutzerverwaltung") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Users className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button 
                variant={isActive("/dashboard") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/dashboard") ? { backgroundColor: firmenFarbe } : {}}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button 
                variant={isActive("/admin") ? "default" : "ghost"} 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                style={isActive("/admin") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Shield className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
