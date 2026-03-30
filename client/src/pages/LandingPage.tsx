import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO = "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/0beKz0TSeMQXqUf2fDg7/media/677e9ccb22d869d0c966e2fb.png";

type OnboardingPackage = "basis" | "komplett" | "schulung_einzel" | "schulung_team" | "schulung_intensiv" | null;

// ─── Icons ──────────────────────────────────────────────────────────────────
const I = {
  brain: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /></svg>,
  zap: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>,
  scan: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /><path d="M7 8h6" /><path d="M7 16h8" /></svg>,
  file: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>,
  bank: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg>,
  shield: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>,
  chart: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
  users: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  building: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>,
  receipt: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></svg>,
  upload: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>,
  db: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></svg>,
  settings: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
  mail: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  lock: (s = 28) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  check: (s = 18) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
  chevron: (s = 20) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>,
  arrow: (s = 18) => <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>,
};

const C = { cyan: '#00B4D8', dark: '#0077B6', deep: '#005F8A', light: '#90E0EF', pale: '#CAF0F8', gold: '#C9A84C', goldDark: '#A8862A' };

// ─── Small components ───────────────────────────────────────────────────────

const faqs = [
  { q: "Ersetzt Buchhaltung-KI meinen Steuerberater?", a: "Nicht komplett — aber sie übernimmt 80% der laufenden Arbeit. Ihr Steuerberater bekommt fertige DATEV-Dateien und prüft nur noch." },
  { q: "Wie funktioniert die KI-Belegerkennung?", a: "Foto oder PDF hochladen — KI erkennt Rechnungsnummer, Datum, Betrag, Steuersatz, Partner und schlägt die Buchung vor. Bestätigen mit einem Klick." },
  { q: "Welche Kontenrahmen?", a: "SKR03/SKR04 (Deutschland), ÖKR (Österreich), KMU und OR (Schweiz). Bei Einrichtung wählen, alle Konten werden automatisch angelegt." },
  { q: "Steuerberater-Zugang?", a: "Ja — eigener Zugang mit Leserechten plus DATEV-Export jederzeit." },
  { q: "Datensicherheit?", a: "Verschlüsselt, EU-Server, DSGVO-konform (EU), DSG-konform (CH), GoBD-konform (DE), Audit-Trail." },
  { q: "Mehrere Firmen?", a: "Business bis 5 Firmen, Enterprise unbegrenzt — ein Login, strikte Datentrennung. Auch länderübergreifend (z.B. DE + CH in einem Account)." },
  { q: "Unterstützt die Software mehrere Währungen?", a: "Ja — jede Firma wird in ihrer Landeswährung geführt (EUR oder CHF). Bei Buchungen in Fremdwährung erfolgt automatische Umrechnung zum Tageskurs." },
  { q: "Welche Banken?", a: "Sparkasse, VR Bank, Deutsche Bank, Commerzbank, PayPal, SumUp, Amex, Soldo und mehr." },
  { q: "Vertragslaufzeit?", a: "Keine. Monatlich kündbar." },
  { q: "Was passiert mit meinen bisherigen Daten?", a: "Unsere Onboarding-Pakete importieren DATEV-Daten, Geschäftspartner und Kontoauszüge. Oder Sie nutzen den integrierten DATEV-Import selbst." },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left font-medium text-slate-900 hover:text-cyan-700 transition-colors">
        <span className="text-base pr-4">{q}</span>
        <span className={`shrink-0 transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`}>{I.chevron()}</span>
      </button>
      {open && <p className="text-slate-500 leading-relaxed text-sm pb-5">{a}</p>}
    </div>
  );
}

function Feat({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:border-cyan-100 hover:shadow-xl hover:-translate-y-1">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${C.pale}, ${C.light})`, color: C.dark }}>{icon}</div>
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}

function SRow({ label, stb, ki }: { label: string; stb: string; ki: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-4 border-b border-slate-100 last:border-0 items-center">
      <span className="text-sm text-slate-600 font-medium">{label}</span>
      <span className="text-center text-sm text-slate-400 line-through">{stb}</span>
      <span className="text-center text-sm font-semibold" style={{ color: C.dark }}>{ki}</span>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "business" | null>(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingPackage>(null);

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(`Checkout fehlgeschlagen: ${error.message}`);
      setLoading(false);
    },
  });

  const handleCheckout = (plan: "starter" | "business", onboarding?: OnboardingPackage) => {
    setLoading(true);
    createCheckoutMutation.mutate({
      plan,
      onboarding: onboarding || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <style>{`
        .fd { font-family: 'Instrument Serif', Georgia, serif; }
        @keyframes fu { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        .a0{animation:fu .8s cubic-bezier(.16,1,.3,1) forwards}
        .a1{animation:fu .8s .08s cubic-bezier(.16,1,.3,1) forwards;opacity:0}
        .a2{animation:fu .8s .16s cubic-bezier(.16,1,.3,1) forwards;opacity:0}
        .a3{animation:fu .8s .24s cubic-bezier(.16,1,.3,1) forwards;opacity:0}
        .a4{animation:fu .8s .32s cubic-bezier(.16,1,.3,1) forwards;opacity:0}
        .gt{background:linear-gradient(135deg,${C.dark},${C.cyan},#48CAE4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .bp{background:linear-gradient(135deg,${C.dark},${C.cyan})}
        .bp:hover{background:linear-gradient(135deg,${C.deep},#0096B7)}
      `}</style>

      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <img src={LOGO} alt="Non Dom Group" className="h-9 object-contain" />
            <div className="hidden sm:block w-px h-7 bg-slate-200" />
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-slate-900 tracking-tight block leading-none">Buchhaltung-KI</span>
              <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: C.cyan }}>Deutschland · Österreich · Schweiz</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 font-medium">
            <a href="#funktionen" className="hover:text-cyan-600 transition-colors">Funktionen</a>
            <a href="#preise" className="hover:text-cyan-600 transition-colors">Preise</a>
            <a href="#onboarding" className="hover:text-cyan-600 transition-colors">Onboarding</a>
            <a href="#faq" className="hover:text-cyan-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <span className="hidden sm:inline-flex text-sm font-medium text-slate-600 cursor-pointer hover:text-cyan-700 transition-colors">Anmelden</span>
            </Link>
            <button onClick={() => handleCheckout("starter")} disabled={loading} className="bp inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
              {loading ? "Lädt..." : "Jetzt buchen"}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${C.pale}30, white 50%, white)` }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: C.light }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Text links */}
            <div>
              <div className="a0 mb-8 inline-flex items-center gap-2.5 rounded-full border bg-white px-5 py-2 text-sm font-medium shadow-sm" style={{ borderColor: `${C.cyan}30`, color: C.dark }}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: C.pale }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.dark} strokeWidth="3"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
                </span>
                Das einzige Buchhaltungstool für DE, AT und CH
              </div>
              <h1 className="a1 fd text-5xl leading-[1.1] text-slate-900 sm:text-6xl md:text-6xl">Ihre Buchhaltung<br /><span className="gt">erledigt sich selbst.</span></h1>
              <p className="a2 mt-6 text-lg leading-relaxed text-slate-500">Ein Account. Alle Kontenrahmen. Alle Währungen. Von Berlin bis Zürich.</p>
              <div className="a3 mt-10 flex flex-col sm:flex-row items-start gap-4">
                <button onClick={() => handleCheckout("starter")} disabled={loading} className="bp inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5" style={{ boxShadow: `0 8px 30px ${C.cyan}25` }}>
                  {loading ? "Lädt..." : <>Jetzt buchen — ab 299 €/Monat {I.arrow()}</>}
                </button>
                <a href="#funktionen" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:shadow-lg">Alle Funktionen</a>
              </div>
              <div className="a4 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
                {["GoBD-konform", "DSGVO-konform", "DATEV-Schnittstelle", "DE · AT · CH"].map((t, i) => (<span key={i} className="flex items-center gap-2"><span style={{ color: '#10b981' }}>{I.check()}</span>{t}</span>))}
              </div>
            </div>
            {/* Hero-Bild rechts */}
            <div className="hidden md:block relative">
              <img
                src="/images/hero-dashboard.jpeg"
                alt="Buchhaltungs-Dashboard mit Finanzübersicht"
                className="rounded-2xl shadow-2xl object-cover w-full"
                style={{ maxHeight: 480 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="border-y border-slate-100 py-8" style={{ background: `${C.pale}12` }}>
        <div className="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
          {[{ v: "40.000+", l: "Buchungen" }, { v: "~30 Mio €", l: "Volumen" }, { v: "12+", l: "Bank-Formate" }, { v: "DE · AT · CH", l: "3 Länder" }].map((s, i) => (
            <div key={i} className="flex items-center gap-4">{i > 0 && <div className="hidden sm:block w-px h-10 bg-slate-200" />}<div><span className="text-2xl font-bold text-slate-900">{s.v}</span><span className="block text-xs text-slate-400 mt-0.5">{s.l}</span></div></div>
          ))}
        </div>
      </section>

      {/* ─── DACH-Karte ─── */}
      <section style={{ background: C.pale + "30" }} className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white mb-4 inline-block" style={{ background: C.cyan }}>
              DACH-nativ
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mt-3 mb-3">Ein System für drei Länder</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              sevDesk und Lexware decken nur Deutschland ab. Wir sind die einzige Lösung
              die ein deutsches, österreichisches und Schweizer Unternehmen
              im gleichen Account führen kann — mit korrekten Kontenrahmen und Steuersätzen.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { land: "Deutschland", flag: "🇩🇪", konten: "SKR03 / SKR04", steuer: "0% · 7% · 19%", waehrung: "EUR", compliance: "GoBD · DSGVO", farbe: "#1B4FD8" },
              { land: "Österreich",  flag: "🇦🇹", konten: "ÖKR / RLG",    steuer: "0% · 10% · 13% · 20%", waehrung: "EUR", compliance: "BAO · DSGVO",   farbe: "#C0392B" },
              { land: "Schweiz",     flag: "🇨🇭", konten: "KMU / OR",     steuer: "0% · 2.6% · 3.8% · 8.1%", waehrung: "CHF", compliance: "OR · DSG · MWSTG", farbe: "#E74C3C" },
            ].map((l) => (
              <div key={l.land} className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderTopWidth: 4, borderTopColor: l.farbe }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{l.flag}</span>
                  <div>
                    <div className="font-bold text-slate-900">{l.land}</div>
                    <div className="text-xs text-slate-400">{l.waehrung}</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Kontenrahmen</span><span className="font-medium text-slate-700">{l.konten}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">MwSt.-Sätze</span><span className="font-medium text-slate-700">{l.steuer}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Compliance</span><span className="font-medium text-slate-700">{l.compliance}</span></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-6">
            Alle Kontenrahmen werden automatisch beim Anlegen der Firma als Seed-Daten importiert.
          </p>
        </div>
      </section>

      {/* ─── 3-Schritte-Block ─── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">In drei Schritten startklar</h2>
            <p className="text-slate-500">Keine Installation. Kein IT-Aufwand. Sofort loslegen.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { nr: "01", titel: "Firma anlegen", text: "Land und Kontenrahmen wählen — SKR04 für Deutschland, ÖKR für Österreich, KMU für die Schweiz. Alle Konten werden automatisch importiert." },
              { nr: "02", titel: "Belege hochladen", text: "PDF oder Foto hochladen. Claude Vision erkennt automatisch: Datum, Betrag, IBAN, Geschäftspartner und schlägt das passende Sachkonto vor." },
              { nr: "03", titel: "DATEV-Export", text: "Buchungen prüfen und mit einem Klick als DATEV-kompatible Datei exportieren. Ihr Steuerberater erhält strukturierte Daten ohne Medienbruch." },
            ].map((s) => (
              <div key={s.nr}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-4" style={{ background: `linear-gradient(135deg, ${C.dark}, ${C.cyan})` }}>
                  {s.nr}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.titel}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: C.cyan }}>So funktioniert's</div>
            <h2 className="fd text-3xl text-slate-900 md:text-5xl">In drei Schritten zur<br />automatisierten Buchhaltung</h2>
          </div>
          <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-3">
            {[
              { s: "01", t: "Beleg hochladen", d: "Foto, Scan oder PDF. Die KI erkennt sofort alle Daten.", g: `linear-gradient(135deg,${C.dark},${C.cyan})` },
              { s: "02", t: "KI kontiert", d: "Betrag, Datum, Steuersatz und Konto vorgeschlagen. Bestätigen mit einem Klick.", g: `linear-gradient(135deg,${C.cyan},#48CAE4)` },
              { s: "03", t: "DATEV exportieren", d: "Fertige DATEV-Dateien auf Knopfdruck. Steuerberater importiert direkt.", g: `linear-gradient(135deg,#48CAE4,${C.light})` },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-2xl border border-slate-100 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white text-xl font-bold mb-6 shadow-lg" style={{ background: item.g }}>{item.s}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{item.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="funktionen" className="border-t border-slate-100 py-24 md:py-32" style={{ background: `linear-gradient(180deg,${C.pale}08,white)` }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: C.cyan }}>Alle Funktionen</div>
            <h2 className="fd text-3xl text-slate-900 md:text-5xl">Komplette Buchhaltung.<br />Alles in einer App.</h2>
          </div>
          {[
            { cat: "KI & Automatisierung", items: [[I.brain(), "KI-Belegerkennung", "Claude Vision AI erkennt Betrag, Datum, Steuersatz, Partner aus Fotos/PDFs."], [I.zap(), "Auto-Kontierung", "KI schlägt Konto vor, lernt aus Korrekturen."], [I.scan(), "Beleg-Upload", "Drag & Drop, Foto, PDF. Alle Formate."], [I.receipt(), "E-Rechnung", "ZUGFeRD und XRechnung. Vollautomatisch."]] },
            { cat: "Buchhaltung & Finanzen", items: [[I.file(), "DATEV-Export", "Buchungsstapel, Sachkonten, Personenkonten."], [I.file(), "DATEV-Import", "Bestehende Daten importieren. Migration in Minuten."], [I.chart(), "BWA auf Knopfdruck", "Umsatz, Kosten, Ergebnis — Monat, Quartal, Jahr."], [I.receipt(), "EUR & CHF", "Automatische Währungsumrechnung zwischen EUR und CHF. Firmen in eigener Währung führen."]] },
            { cat: "Bank & Zahlungsverkehr", items: [[I.bank(), "12+ Bank-Parser", "Sparkasse, VR Bank, Deutsche Bank, Commerzbank, ING."], [I.bank(), "Payment-Provider", "PayPal, SumUp, Amex, Soldo."], [I.upload(), "CSV-Import", "Universell mit intelligenter Spaltenerkennung."], [I.db(), "Finanzkonten", "Bankkonten, Kreditkarten, Kassen — zentral."]] },
            { cat: "Stammdaten & Verwaltung", items: [[I.building(), "Multi-Firma", "Mehrere Firmen, ein Account, strikte Trennung."], [I.db(), "Kontenrahmen", "SKR03/04 (DE), ÖKR (AT), KMU/OR (CH). Alle Länder."], [I.users(), "Geschäftspartner", "Kunden/Lieferanten zentral. Auto-Zuordnung."], [I.settings(), "STB-Positionen", "Strukturierte Übergabe an Steuerberater."]] },
            { cat: "Team & Sicherheit", items: [[I.users(), "Team-Rollen", "GF, Buchhalter, STB — jeder sieht nur was er soll."], [I.mail(), "Einladungssystem", "Per E-Mail einladen. Auto-Rollenzuweisung."], [I.shield(), "GoBD-konform", "Revisionssicher, Audit-Trail."], [I.lock(), "DSGVO & DSG konform", "EU-Server, verschlüsselt, Multi-Tenant. CH-DSG + EU-DSGVO."]] },
          ].map((sec, si) => (
            <div key={si} className="mb-12">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-3" style={{ color: C.dark }}>
                <span className="w-8 h-px" style={{ background: C.cyan }} />{sec.cat}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {sec.items.map(([ic, t, d], fi) => <Feat key={fi} icon={ic} title={t as string} desc={d as string} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Zielgruppen ─── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Für wen ist buchhaltung-ki.app?</h2>
            <p className="text-slate-500">Wir sind nicht für jeden. Aber für diese drei Gruppen die beste Wahl.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🏪", titel: "KMU in DACH",
                beschreibung: "Kleine und mittlere Unternehmen in Deutschland, Österreich oder der Schweiz, die eine moderne Cloud-Lösung suchen — ohne teure Lizenzkosten.",
                highlights: ["Alle Kontenrahmen enthalten", "KI-Belegerkennung ab Business", "DATEV-Export für den Steuerberater"],
                cta: "Starter ab 299 €/Monat", ctaLink: "#preise", highlight: false,
              },
              {
                icon: "🏢", titel: "Firmengruppen",
                beschreibung: "Holding-Strukturen mit Firmen in mehreren DACH-Ländern — ein Login, alle Firmen, strikte Datentrennung.",
                highlights: ["Unbegrenzte Firmen (Enterprise)", "DE + AT + CH im gleichen Account", "Physisch isolierte Datenbanken"],
                cta: "Enterprise-Plan ansehen", ctaLink: "#preise", highlight: true,
              },
              {
                icon: "📋", titel: "Steuerberater",
                beschreibung: "Kanzleien die ihren Mandanten eine moderne Cloud-Lösung empfehlen und DATEV-kompatible Daten erhalten wollen.",
                highlights: ["DATEV-Export out-of-the-box", "Übersicht über alle Mandanten", "Provision-Modell für Partner"],
                cta: "Partner werden", ctaLink: "mailto:info@buchhaltung-ki.app?subject=Steuerberater-Partner", highlight: false,
              },
            ].map((z) => (
              <div key={z.titel} className={`rounded-2xl p-8 border ${z.highlight ? "border-2 shadow-lg" : "border bg-white shadow-sm"}`} style={z.highlight ? { borderColor: C.cyan, background: `${C.pale}15` } : {}}>
                <div className="text-4xl mb-4">{z.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{z.titel}</h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">{z.beschreibung}</p>
                <ul className="space-y-2 mb-6">
                  {z.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-slate-600">
                      <span style={{ color: C.cyan }} className="mt-0.5 shrink-0">{I.check(14)}</span>{h}
                    </li>
                  ))}
                </ul>
                <a href={z.ctaLink} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: C.cyan }}>
                  {z.cta} {I.arrow()}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cost Comparison ─── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: C.cyan }}>Kostenvergleich</div>
            <h2 className="fd text-3xl text-slate-900 md:text-5xl">Was kostet Ihr<br />Steuerberater wirklich?</h2>
          </div>
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-lg">
            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-900">Aufgabe</span>
              <span className="text-center text-sm font-semibold text-slate-400">Steuerberater</span>
              <span className="text-center text-sm font-semibold" style={{ color: C.dark }}>Buchhaltung-KI</span>
            </div>
            <div className="px-6">
              <SRow label="Belege erfassen" stb="manuell" ki="KI-automatisch" />
              <SRow label="Kontierung" stb="150–300 €/Mo" ki="KI-Vorschlag" />
              <SRow label="USt-Voranmeldung" stb="50–150 €/Mo" ki="Inklusive" />
              <SRow label="BWA erstellen" stb="100–200 €/Mo" ki="Auf Knopfdruck" />
              <SRow label="Bank-Abstimmung" stb="50–100 €/Mo" ki="Automatisch" />
              <SRow label="DATEV-Übergabe" stb="Doppelarbeit" ki="1-Klick Export" />
            </div>
            <div className="grid grid-cols-3 gap-4 px-6 py-5 border-t border-slate-200" style={{ background: `${C.pale}20` }}>
              <span className="text-sm font-bold text-slate-900">Typisch gesamt</span>
              <span className="text-center text-sm font-bold text-red-500 line-through">500–1.500 €/Mo</span>
              <span className="text-center text-sm font-bold" style={{ color: C.dark }}>ab 299 €/Monat</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="preise" className="border-t border-slate-100 py-24 md:py-32" style={{ background: `${C.pale}08` }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: C.cyan }}>Preise</div>
            <h2 className="fd text-3xl text-slate-900 md:text-5xl">Sofort loslegen</h2>
            <p className="mt-5 text-slate-500">Monatlich kündbar. Alle Pläne inkl. KI-Belegerkennung, DATEV, 12+ Bank-Parser.</p>
          </div>
          <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:shadow-xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Starter</h3>
              <div className="mt-3 flex items-baseline gap-1"><span className="text-4xl font-bold text-slate-900">299 €</span><span className="text-sm text-slate-400">/ Monat</span></div>
              <p className="mt-2 text-sm text-slate-500 mb-6">1 Firma · 2 Benutzer · DE/AT/CH</p>
              <ul className="mb-8 flex-1 space-y-3">
                {["KI-Belegerkennung", "Auto-Kontierung", "SKR03/04 · ÖKR · KMU/OR", "DATEV-Import & Export", "12+ Bank-Parser", "BWA-Berichte", "USt-Voranmeldung", "E-Rechnung (ZUGFeRD/XRechnung)", "GoBD-konform", "E-Mail Support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600"><span className="mt-0.5 shrink-0" style={{ color: C.cyan }}>{I.check()}</span>{f}</li>
                ))}
              </ul>
              <button onClick={() => handleCheckout("starter")} disabled={loading} className="bp w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5">
                {loading ? "Lädt..." : "Jetzt buchen"}
              </button>
            </div>
            <div className="relative flex flex-col rounded-2xl bg-white p-8 shadow-xl" style={{ border: `2px solid ${C.gold}` }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-white" style={{ background: `linear-gradient(135deg,${C.goldDark},${C.gold})` }}>Empfohlen</div>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: C.gold }}>Business</h3>
              <div className="mt-3 flex items-baseline gap-1"><span className="text-4xl font-bold text-slate-900">499 €</span><span className="text-sm text-slate-400">/ Monat</span></div>
              <p className="mt-2 text-sm text-slate-500 mb-6">Bis 5 Firmen · 5 Benutzer · DE/AT/CH</p>
              <ul className="mb-8 flex-1 space-y-3">
                {["Alles aus Starter, plus:", "Multi-Firma Dashboard", "Team-Rollen & Berechtigungen", "Steuerberater-Zugang", "Geschäftspartner-Verwaltung", "Einladungssystem", "Finanzkonten-Übersicht", "Priority Support", "Audit-Trail & Protokoll"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600"><span className="mt-0.5 shrink-0" style={{ color: C.cyan }}>{I.check()}</span>{f}</li>
                ))}
              </ul>
              <button onClick={() => handleCheckout("business")} disabled={loading} className="bp w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                {loading ? "Lädt..." : "Jetzt buchen"}
              </button>
            </div>
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:shadow-xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Enterprise</h3>
              <div className="mt-3"><span className="text-4xl font-bold text-slate-900">Individuell</span></div>
              <p className="mt-2 text-sm text-slate-500 mb-6">Unbegrenzt Firmen & Benutzer</p>
              <ul className="mb-8 flex-1 space-y-3">
                {["Alles aus Business, plus:", "Dedizierter Ansprechpartner", "Custom Onboarding", "SLA & Telefon-Support", "Individuelle Kontenrahmen", "Konzern-BWA", "API-Zugang (Manus-Schnittstelle)", "Schulungen", "Vorrang bei Features"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600"><span className="mt-0.5 shrink-0" style={{ color: C.cyan }}>{I.check()}</span>{f}</li>
                ))}
              </ul>
              <a href="mailto:info@non-dom.group" className="w-full rounded-xl py-3.5 text-sm font-semibold border-2 border-slate-200 text-slate-700 transition-all hover:border-cyan-400 hover:text-cyan-700 text-center block">Kontakt aufnehmen</a>
            </div>
          </div>

          {/* Manus-API Add-on */}
          <div className="mx-auto max-w-4xl mt-12 rounded-2xl border border-dashed border-cyan-300 bg-white p-8 relative overflow-hidden" style={{ background: `linear-gradient(135deg, white, ${C.pale}15)` }}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${C.dark}, ${C.cyan})` }}>
                    <span className="text-white text-lg">⚡</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: C.cyan }}>Add-on</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Manus-API Schnittstelle</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Verbinden Sie Ihre Buchhaltung mit dem Manus-Agenten für vollautomatische Datenverarbeitung.
                  18 REST-API-Endpoints für Buchungen, Belege, Debitoren, Kreditoren und Sachkonten.
                  Inkl. OCR-Upload und automatische Kontierung über die API.
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {["18 REST-API Endpoints", "SHA-256 API-Key Auth", "Automatischer OCR-Upload", "Cross-Tenant Isolation", "DATEV-kompatibel", "Unbegrenzte Requests"].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span style={{ color: C.cyan }}>{I.check(14)}</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center md:text-right shrink-0">
                <div className="flex items-baseline justify-center md:justify-end gap-1 mb-1">
                  <span className="text-3xl font-bold text-slate-900">+119 €</span>
                  <span className="text-sm text-slate-400">/ Monat</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">zzgl. MwSt. · Zu jedem Plan buchbar</p>
                <a href="mailto:info@non-dom.group?subject=Manus-API%20Schnittstelle" className="bp inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
                  API-Zugang anfragen {I.arrow()}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Onboarding Packages ─── */}
      <section id="onboarding" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: C.cyan }}>Onboarding</div>
            <h2 className="fd text-3xl text-slate-900 md:text-5xl">Schnell produktiv —<br />wir richten alles ein</h2>
            <p className="mt-5 text-slate-500 leading-relaxed">Sie entscheiden: selbst einrichten oder von uns machen lassen. Wir importieren Ihre bestehende Buchhaltung, richten Kontenrahmen und Finanzkonten ein, und schulen Ihr Team.</p>
          </div>

          <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Selbststarter */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Selbststarter</h3>
              <div className="flex items-baseline gap-1 mb-3"><span className="text-2xl font-bold text-slate-900">0 €</span></div>
              <p className="text-sm text-slate-500 mb-5 flex-1">Für technisch versierte Unternehmer, die es selbst machen wollen.</p>
              <ul className="space-y-2 mb-6">
                {["Video-Tutorials & Anleitungen", "Self-Service Kontenrahmen-Setup", "Integrierter DATEV-Import", "CSV-Bank-Import Assistent", "Community Support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="mt-0.5 shrink-0" style={{ color: C.cyan }}>{I.check(14)}</span>{f}</li>
                ))}
              </ul>
              <button className="w-full rounded-lg py-3 text-sm font-semibold border border-slate-200 text-slate-700 transition-all hover:border-cyan-400">Im Plan enthalten</button>
            </div>

            {/* Basis */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Basis-Onboarding</h3>
              <div className="flex items-baseline gap-1 mb-3"><span className="text-2xl font-bold text-slate-900">499 €</span><span className="text-xs text-slate-400">einmalig</span></div>
              <p className="text-sm text-slate-500 mb-5 flex-1">Wir richten Ihre Firma ein und importieren Ihre DATEV-Daten.</p>
              <ul className="space-y-2 mb-6">
                {["DATEV-Daten Import (aktuelles Jahr)", "Kontenrahmen einrichten (SKR03/04)", "Finanzkonten konfigurieren", "Bank-Parser einrichten", "1 Stunde Video-Schulung", "Geschäftspartner-Import (bis 100)"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="mt-0.5 shrink-0" style={{ color: C.cyan }}>{I.check(14)}</span>{f}</li>
                ))}
              </ul>
              <button onClick={() => handleCheckout("starter", "basis")} disabled={loading} className="bp w-full rounded-lg py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shadow-md">
                {loading ? "Lädt..." : "Jetzt buchen"}
              </button>
            </div>

            {/* Komplett */}
            <div className="rounded-2xl bg-white p-6 flex flex-col shadow-xl" style={{ border: `2px solid ${C.gold}` }}>
              <div className="text-3xl mb-4">⭐</div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-slate-900">Komplett-Onboarding</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: C.gold }}>Beliebt</span>
              </div>
              <div className="flex items-baseline gap-1 mb-3"><span className="text-2xl font-bold text-slate-900">1.499 €</span><span className="text-xs text-slate-400">einmalig</span></div>
              <p className="text-sm text-slate-500 mb-5 flex-1">Komplett-Migration inkl. historischer Daten und Team-Schulung.</p>
              <ul className="space-y-2 mb-6">
                {["Alles aus Basis, plus:", "Historische Daten (bis 3 Jahre)", "Geschäftspartner-Import (unbegrenzt)", "Kontoauszüge der letzten 12 Monate", "Team-Accounts einrichten", "Steuerberater-Zugang konfigurieren", "3 Stunden Video-Schulung", "30 Tage Priority E-Mail Support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="mt-0.5 shrink-0" style={{ color: C.gold }}>{I.check(14)}</span>{f}</li>
                ))}
              </ul>
              <button onClick={() => handleCheckout("starter", "komplett")} disabled={loading} className="bp w-full rounded-lg py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shadow-lg">
                {loading ? "Lädt..." : "Jetzt buchen"}
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Enterprise-Onboarding</h3>
              <div className="flex items-baseline gap-1 mb-3"><span className="text-2xl font-bold text-slate-900">Individuell</span></div>
              <p className="text-sm text-slate-500 mb-5 flex-1">Für Unternehmensgruppen mit mehreren Firmen und komplexen Anforderungen.</p>
              <ul className="space-y-2 mb-6">
                {["Alles aus Komplett, plus:", "Multi-Firma Setup (alle Firmen)", "Individuelle Kontenrahmen-Anpassung", "Steuerberater-Koordination", "Unbegrenzte Schulungen (vor Ort/remote)", "Dedizierter Projektmanager", "Daten-Validierung & Qualitätsprüfung", "90 Tage Premium Support"].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><span className="mt-0.5 shrink-0" style={{ color: C.cyan }}>{I.check(14)}</span>{f}</li>
                ))}
              </ul>
              <a href="mailto:info@non-dom.group" className="w-full rounded-lg py-3 text-sm font-semibold border border-slate-200 text-slate-700 transition-all hover:border-cyan-400 hover:text-cyan-700 text-center block">Kontakt aufnehmen</a>
            </div>
          </div>

          {/* Schulungs-Add-Ons */}
          <div className="mx-auto max-w-3xl mt-16 rounded-2xl border border-slate-200 bg-white p-8">
            <h3 className="text-center text-lg font-semibold text-slate-900 mb-2">Zusätzliche Schulungen</h3>
            <p className="text-center text-sm text-slate-500 mb-8">Buchen Sie zusätzliche Schulungsstunden für Ihr Team — jederzeit.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { t: "Einzelschulung", p: "149 €", d: "1 Stunde Video-Call. Individuelle Fragen, Tipps & Tricks.", type: "schulung_einzel" as const },
                { t: "Team-Workshop", p: "349 €", d: "3 Stunden für bis zu 5 Personen. Komplett-Einführung.", type: "schulung_team" as const },
                { t: "Intensiv-Paket", p: "799 €", d: "5×2 Stunden über 4 Wochen. Begleitung bis zur Routine.", type: "schulung_intensiv" as const },
              ].map((s, i) => (
                <button key={i} onClick={() => handleCheckout("starter", s.type)} disabled={loading} className="rounded-xl border border-slate-100 p-5 text-center hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <div className="text-xl font-bold text-slate-900 mb-1">{s.p}</div>
                  <div className="text-sm font-semibold text-slate-700 mb-2">{s.t}</div>
                  <p className="text-xs text-slate-500">{s.d}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Steuerberater-Section ─── */}
      <section className="py-20" style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #1a2744 100%)` }}>
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block text-white" style={{ background: C.cyan + "40", border: `1px solid ${C.cyan}` }}>
                Steuerberater-Partnerprogramm
              </span>
              <h2 className="text-3xl font-bold text-white mt-3 mb-4">
                Empfehlen Sie Ihren Mandanten die beste DACH-Lösung
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                DATEV-kompatibel, alle Kontenrahmen, physisch isolierte Mandantendatenbanken.
                Ihre Mandanten buchen selbst — Sie erhalten strukturierte, prüfungsfähige Daten.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "DATEV-Export out-of-the-box — funktioniert sofort",
                  "Übersicht über alle Mandanten in einem Dashboard",
                  "Provision oder Rabattmodell für Partner",
                  "Alle DACH-Kontenrahmen — ein Tool für alle Länder",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-200">
                    <span style={{ color: C.cyan }} className="mt-0.5 shrink-0">{I.check(14)}</span>{p}
                  </li>
                ))}
              </ul>
              <a href="mailto:info@buchhaltung-ki.app?subject=Steuerberater-Partnerschaft" className="bp inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-md">
                Partner werden {I.arrow()}
              </a>
            </div>
            <div className="relative">
              <img
                src="/images/steuerberater.jpeg"
                alt="Steuerberater mit Mandanten"
                className="rounded-2xl shadow-2xl object-cover w-full"
                style={{ maxHeight: 420 }}
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <div className="grid grid-cols-2 gap-4 text-center">
                  {[{ v: "40.000+", l: "Buchungen" }, { v: "~30 Mio €", l: "Volumen" }, { v: "6", l: "Kontenrahmen" }, { v: "12+", l: "Bank-Formate" }].map((s) => (
                    <div key={s.l}>
                      <div className="text-lg font-bold text-white">{s.v}</div>
                      <div className="text-xs text-slate-300">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <p className="text-sm text-slate-400 uppercase tracking-widest font-medium">Was unsere Nutzer sagen</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                zitat: "Endlich eine Lösung die sowohl unsere österreichische GmbH als auch die Schweizer AG im gleichen Account führt. Das hat vorher kein Tool gekonnt.",
                name: "Thomas G.", rolle: "CEO, Unternehmensgruppe (DE/AT/CH)", foto: null,
              },
              {
                zitat: "Die KI-Belegerkennung ist beeindruckend. Ich lade die PDF hoch und 90% der Felder werden automatisch ausgefüllt. Das spart mir täglich Zeit.",
                name: "Franziska S.", rolle: "Buchhaltung, E-Commerce", foto: "/images/social-proof-1.jpeg",
              },
              {
                zitat: "Der DATEV-Export funktioniert einwandfrei. Mein Steuerberater bekommt strukturierte Daten und muss nichts mehr nachbereiten.",
                name: "Isabel A.", rolle: "Geschäftsführerin, Handelsunternehmen", foto: null,
              },
            ].map((z) => (
              <div key={z.name} className="rounded-2xl border bg-slate-50 p-6">
                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">"{z.zitat}"</p>
                <div className="flex items-center gap-3">
                  {z.foto ? (
                    <img src={z.foto} alt={z.name} className="w-10 h-10 rounded-full object-cover object-top" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: C.cyan }}>
                      {z.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{z.name}</div>
                    <div className="text-xs text-slate-400">{z.rolle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Story ─── */}
      <section className="border-t border-slate-100 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl rounded-3xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0a2540,#0d3b66)' }}>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 2px 2px,rgba(255,255,255,.3) 1px,transparent 0)`, backgroundSize: '24px 24px' }} />
            <div className="relative">
              <img src={LOGO} alt="Non Dom Group" className="h-10 mx-auto mb-8 opacity-80" style={{ filter: 'brightness(2)' }} />
              <h2 className="fd text-2xl text-white md:text-3xl mb-6 leading-snug">„32 Firmen, keine Software konnte alles.<br />Also habe ich sie selbst gebaut."</h2>
              <p className="text-slate-400 leading-relaxed mb-8 max-w-xl mx-auto">Buchhaltung-KI entstand aus echter Frustration. Heute verwalten wir damit über 40.000 Buchungen — und jetzt können Sie das auch.</p>
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
                {[{ v: "40.000+", l: "Buchungen" }, { v: "~30 Mio €", l: "Volumen" }, { v: "Seit 2024", l: "In Produktion" }].map((s, i) => (
                  <div key={i} className="text-center"><div className="text-2xl font-bold text-white">{s.v}</div><div className="text-slate-500">{s.l}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: C.cyan }}>FAQ</div>
            <h2 className="fd text-3xl text-slate-900 md:text-5xl">Häufige Fragen</h2>
          </div>
          <div className="mx-auto max-w-2xl">{faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}</div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl rounded-3xl p-12 md:p-16 text-center relative overflow-hidden bp">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px,rgba(255,255,255,.4) 1px,transparent 0)`, backgroundSize: '20px 20px' }} />
            <div className="relative">
              <h2 className="fd text-3xl text-white md:text-4xl mb-5">Bereit, Ihre Buchhaltung zu automatisieren?</h2>
              <p className="mb-10 max-w-lg mx-auto" style={{ color: `${C.pale}cc` }}>Buchen Sie jetzt Ihren Plan und starten Sie sofort. Optionales Onboarding dazu — wir kümmern uns um den Rest.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => handleCheckout("starter")} disabled={loading} className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-10 py-5 text-base font-semibold shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5" style={{ color: C.dark }}>
                  {loading ? "Lädt..." : <>Jetzt buchen — ab 299 €/Monat {I.arrow()}</>}
                </button>
              </div>
              <p className="mt-6 text-sm" style={{ color: `${C.light}88` }}>Monatlich kündbar · Keine Setup-Gebühr · Sofort produktiv</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={LOGO} alt="Non Dom Group" className="h-7 object-contain" style={{ filter: 'brightness(1.8)' }} />
              <div className="w-px h-5 bg-slate-700" />
              <span className="text-sm font-semibold text-white">Buchhaltung-KI</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <Link href="/impressum"><a className="hover:text-white transition-colors">Impressum</a></Link>
              <Link href="/datenschutz"><a className="hover:text-white transition-colors">Datenschutz</a></Link>
              <Link href="/agb"><a className="hover:text-white transition-colors">AGB</a></Link>
              <a href="mailto:info@non-dom.group" className="hover:text-white transition-colors">Kontakt</a>
            </div>
            <div className="text-sm">© 2026 Non Dom Group</div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-8 text-center">
          <p className="text-xs text-slate-500">
            Marketplace24-7 GmbH, Kantonsstrasse 1, 8807 Freienbach SZ, Schweiz
          </p>
        </div>
      </footer>
    </div>
  );
}
