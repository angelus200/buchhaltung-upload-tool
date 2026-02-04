import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import {
  FileSpreadsheet,
  Upload,
  BarChart3,
  StickyNote,
  Briefcase,
  Building2,
  Bell,
  Users,
  Shield,
  LogOut,
  Menu,
  User,
  Home,
  ChevronDown,
  Receipt,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

// Hauptnavigation Links - Wichtigste Seiten direkt sichtbar
const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Buchungen", icon: <Upload className="w-4 h-4" /> },
  { href: "/auszuege", label: "Kontoauszüge", icon: <Receipt className="w-4 h-4" /> },
  { href: "/uebersicht", label: "Übersicht", icon: <BarChart3 className="w-4 h-4" /> },
  { href: "/stammdaten", label: "Stammdaten", icon: <Briefcase className="w-4 h-4" /> },
];

// Weitere Seiten im "Mehr" Dropdown
const MORE_NAV_ITEMS: NavItem[] = [
  { href: "/notizen", label: "Notizen", icon: <StickyNote className="w-4 h-4" /> },
  { href: "/unternehmen", label: "Unternehmen", icon: <Building2 className="w-4 h-4" /> },
];

// Für Kompatibilität und Debug
const NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin", label: "Admin-Board", icon: <Shield className="w-4 h-4" />, adminOnly: true },
  { href: "/benutzerverwaltung", label: "Benutzer", icon: <Users className="w-4 h-4" />, adminOnly: true },
  { href: "/benachrichtigungen", label: "Benachrichtigungen", icon: <Bell className="w-4 h-4" /> },
];

export default function MainNavigation() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // Debug: Navigation geladen - BUILD TIMESTAMP
  const buildTimestamp = "2026-02-03T22:30:00Z";
  console.log(`MainNavigation loaded - BUILD: ${buildTimestamp} - Items: ${NAV_ITEMS.length}`);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Primäre Navigation - immer sichtbar */}
      {PRIMARY_NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={isActive(item.href) ? "default" : "ghost"}
            size={mobile ? "default" : "sm"}
            className={`${mobile ? "w-full justify-start" : ""} ${
              isActive(item.href) ? "bg-teal-600 text-white hover:bg-teal-700" : ""
            }`}
            onClick={() => mobile && setMobileMenuOpen(false)}
          >
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Button>
        </Link>
      ))}

      {/* "Mehr" Dropdown (Desktop) */}
      {!mobile && MORE_NAV_ITEMS.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
              <span className="ml-2">Mehr</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MORE_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                <DropdownMenuItem className="cursor-pointer">
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* "Mehr" Items direkt sichtbar (Mobile) */}
      {mobile && MORE_NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={isActive(item.href) ? "default" : "ghost"}
            size="default"
            className={`w-full justify-start ${
              isActive(item.href) ? "bg-teal-600 text-white hover:bg-teal-700" : ""
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Button>
        </Link>
      ))}

      {/* Admin-Bereich Dropdown (Desktop) */}
      {!mobile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Shield className="w-4 h-4" />
              <span className="ml-2">Verwaltung</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ADMIN_ITEMS.map((item) => (
              (!item.adminOnly || isAdmin) && (
                <Link key={item.href} href={item.href}>
                  <DropdownMenuItem className="cursor-pointer">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </DropdownMenuItem>
                </Link>
              )
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Admin-Bereich (Mobile) */}
      {mobile && (
        <>
          <div className="border-t my-2 pt-2">
            <p className="text-xs text-muted-foreground px-2 mb-2">Verwaltung</p>
            {ADMIN_ITEMS.map((item) => (
              (!item.adminOnly || isAdmin) && (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="default"
                    className={`w-full justify-start ${
                      isActive(item.href) ? "bg-teal-600 text-white hover:bg-teal-700" : ""
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Button>
                </Link>
              )
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container py-3">
        <div className="flex items-center justify-between">
          {/* Logo und Titel */}
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">Buchhaltung</h1>
                <p className="text-xs text-muted-foreground">Upload Tool</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLinks />
          </nav>

          {/* Benutzer-Bereich */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                {/* Dashboard Link */}
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    <Home className="w-4 h-4" />
                    <span className="ml-2">Dashboard</span>
                  </Button>
                </Link>

                {/* Benutzer Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <span className="hidden sm:inline max-w-[120px] truncate">
                        {user.name || user.email || "Benutzer"}
                      </span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name || "Benutzer"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Administrator
                        </span>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer">
                        <Home className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin-Board
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600"
                      onClick={() => logout()}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">Anmelden</Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-2 mt-6">
                  <NavLinks mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
