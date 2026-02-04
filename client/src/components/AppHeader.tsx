import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronDown,
  TrendingUp,
  CreditCard,
  Calendar,
  LogOut,
  User,
  Settings,
  Landmark,
  ListTodo,
  Send,
  FileSpreadsheet,
  BookTemplate,
  Lock,
  Package,
  Warehouse,
  ClipboardList,
  Calculator,
  HelpCircle,
  Receipt,
  FileText,
  Sparkles,
  Cloud,
  MoreHorizontal,
  Banknote,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

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
  const [location, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [firmenFarbe, setFirmenFarbe] = useState<string>("#0d9488");
  const [firmenName, setFirmenName] = useState<string>("");
  const [firmenLogo, setFirmenLogo] = useState<string>("");

  // Auth Hook für Benutzer und Logout
  const { user, isAuthenticated, logout, isLoading } = useAuth();

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
    const selected = unternehmenList?.find((item: UnternehmenData) => item.unternehmen.id === id);

    if (selected) {
      setSelectedId(id);
      setFirmenFarbe(selected.unternehmen.farbe || "#0d9488");
      setFirmenName(selected.unternehmen.name);
      setFirmenLogo(selected.unternehmen.logoUrl || "");

      localStorage.setItem("selectedUnternehmenId", id.toString());
      localStorage.setItem("selectedUnternehmenFarbe", selected.unternehmen.farbe || "#0d9488");
      localStorage.setItem("selectedUnternehmenName", selected.unternehmen.name);
      localStorage.setItem("selectedUnternehmenLogo", selected.unternehmen.logoUrl || "");

      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleLogout = async () => {
    await logout();
    // Nach Logout zur Login-Seite weiterleiten
    window.location.href = "/login";
  };

  const isActive = (path: string) => location === path;

  // Benutzer-Initialen für Avatar
  const getUserInitials = () => {
    if (!user?.name) return "?";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Firmenname truncaten
  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      {/* Farbiger Balken oben */}
      <div
        className="h-0.5 w-full transition-colors duration-300"
        style={{ backgroundColor: firmenFarbe }}
      />

      <div className="container py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Links: Logo + Firmenname + Firmenauswahl */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Firmenlogo oder Icon */}
            {firmenLogo ? (
              <img
                src={firmenLogo}
                alt={firmenName}
                className="w-8 h-8 object-contain rounded border border-slate-200 flex-shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded flex items-center justify-center shadow-sm transition-colors duration-300 flex-shrink-0"
                style={{ backgroundColor: firmenFarbe }}
              >
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Firmenname - truncated */}
            {firmenName && (
              <div className="min-w-0 flex-shrink">
                <h1
                  className="text-sm font-semibold text-slate-900 tracking-tight truncate"
                  title={firmenName}
                >
                  {truncateName(firmenName)}
                </h1>
              </div>
            )}

            {/* Unternehmensauswahl Dropdown - kompakt */}
            {unternehmenList && unternehmenList.length > 1 && (
              <Select
                value={selectedId?.toString() || ""}
                onValueChange={handleUnternehmenChange}
              >
                <SelectTrigger className="w-[140px] h-7 text-xs border-slate-300">
                  <SelectValue placeholder="Firma" />
                </SelectTrigger>
                <SelectContent>
                  {unternehmenList.map((item: UnternehmenData) => (
                    <SelectItem key={item.unternehmen.id} value={item.unternehmen.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.unternehmen.farbe || "#0d9488" }}
                        />
                        <span className="truncate">{item.unternehmen.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Mitte: Haupt-Navigation (wichtige Items) */}
          <nav className="flex items-center gap-0.5">
            <Link href="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-7 text-xs px-2"
                style={isActive("/") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Buchungen</span>
              </Button>
            </Link>

            <Link href="/uebersicht">
              <Button
                variant={isActive("/uebersicht") ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-7 text-xs px-2"
                style={isActive("/uebersicht") ? { backgroundColor: firmenFarbe } : {}}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Übersicht</span>
              </Button>
            </Link>

            <Link href="/kennzahlen">
              <Button
                variant={isActive("/kennzahlen") ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-7 text-xs px-2"
                style={isActive("/kennzahlen") ? { backgroundColor: firmenFarbe } : {}}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Kennzahlen</span>
              </Button>
            </Link>

            <Link href="/zahlungen">
              <Button
                variant={isActive("/zahlungen") ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-7 text-xs px-2"
                style={isActive("/zahlungen") ? { backgroundColor: firmenFarbe } : {}}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Zahlungen</span>
              </Button>
            </Link>

            <Link href="/stammdaten">
              <Button
                variant={isActive("/stammdaten") ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 h-7 text-xs px-2"
                style={isActive("/stammdaten") ? { backgroundColor: firmenFarbe } : {}}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Stammdaten</span>
              </Button>
            </Link>

            {/* "Mehr" Dropdown für sekundäre Items */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-7 text-xs px-2"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Mehr</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Weitere Module</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <Link href="/auszuege">
                  <DropdownMenuItem className="cursor-pointer">
                    <Receipt className="w-4 h-4 mr-2" />
                    Kontoauszüge
                  </DropdownMenuItem>
                </Link>

                <Link href="/finanzierungen">
                  <DropdownMenuItem className="cursor-pointer">
                    <Banknote className="w-4 h-4 mr-2" />
                    Kredite & Leasing
                  </DropdownMenuItem>
                </Link>

                <Link href="/buchungsvorschlaege">
                  <DropdownMenuItem className="cursor-pointer">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Buchungsvorschläge
                  </DropdownMenuItem>
                </Link>

                <Link href="/einstellungen/dropbox">
                  <DropdownMenuItem className="cursor-pointer">
                    <Cloud className="w-4 h-4 mr-2" />
                    Dropbox
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <Link href="/kalender">
                  <DropdownMenuItem className="cursor-pointer">
                    <Calendar className="w-4 h-4 mr-2" />
                    Kalender
                  </DropdownMenuItem>
                </Link>

                <Link href="/notizen">
                  <DropdownMenuItem className="cursor-pointer">
                    <StickyNote className="w-4 h-4 mr-2" />
                    Notizen
                  </DropdownMenuItem>
                </Link>

                <Link href="/artikel">
                  <DropdownMenuItem className="cursor-pointer">
                    <Package className="w-4 h-4 mr-2" />
                    Lager & Inventur
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />

                <Link href="/finanzamt">
                  <DropdownMenuItem className="cursor-pointer">
                    <Landmark className="w-4 h-4 mr-2" />
                    Finanzamt
                  </DropdownMenuItem>
                </Link>

                <Link href="/finanzamt/ustva">
                  <DropdownMenuItem className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    USt-Voranmeldung
                  </DropdownMenuItem>
                </Link>

                <Link href="/aufgaben">
                  <DropdownMenuItem className="cursor-pointer">
                    <ListTodo className="w-4 h-4 mr-2" />
                    Aufgaben
                  </DropdownMenuItem>
                </Link>

                <Link href="/steuerberater">
                  <DropdownMenuItem className="cursor-pointer">
                    <Send className="w-4 h-4 mr-2" />
                    Steuerberater
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Rechts: Benutzer-Menü */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-7 px-2"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: firmenFarbe }}
                  >
                    {getUserInitials()}
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name || "Benutzer"}</span>
                    <span className="text-xs text-slate-500">{user?.email || ""}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/unternehmen">
                  <DropdownMenuItem className="cursor-pointer">
                    <Building2 className="w-4 h-4 mr-2" />
                    Firmenverwaltung
                  </DropdownMenuItem>
                </Link>
                <Link href="/benutzerverwaltung">
                  <DropdownMenuItem className="cursor-pointer">
                    <Users className="w-4 h-4 mr-2" />
                    Benutzerverwaltung
                  </DropdownMenuItem>
                </Link>
                <Link href="/benachrichtigungen">
                  <DropdownMenuItem className="cursor-pointer">
                    <Bell className="w-4 h-4 mr-2" />
                    Benachrichtigungen
                  </DropdownMenuItem>
                </Link>
                <Link href="/hilfe">
                  <DropdownMenuItem className="cursor-pointer">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Hilfe
                  </DropdownMenuItem>
                </Link>

                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin-Panel
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
