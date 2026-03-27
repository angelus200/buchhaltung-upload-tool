import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <a className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Zurück zur Startseite
            </a>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Impressum</h1>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">Angaben gemäss Art. 3 UWG / Art. 127 IPRG</h2>
            <p className="text-slate-700 leading-relaxed">
              <strong>Marketplace24-7 GmbH</strong><br />
              Kantonsstrasse 1<br />
              8807 Freienbach SZ<br />
              Schweiz
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">Kontakt</h2>
            <p className="text-slate-700 leading-relaxed">
              E-Mail: info@non-dom.group
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">Handelsregister</h2>
            <p className="text-slate-700 leading-relaxed">
              Eingetragen im Handelsregister des Kantons Schwyz<br />
              Firmennummer: CH-130.4.033.363-2
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">Vertretungsberechtigte Person</h2>
            <p className="text-slate-700 leading-relaxed">
              Thomas Gross, Geschäftsführer
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">Haftungsausschluss</h2>
            <p className="text-slate-700 leading-relaxed">
              Der Autor übernimmt keine Gewähr für die Richtigkeit, Genauigkeit, Aktualität,
              Zuverlässigkeit und Vollständigkeit der Informationen.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art,
              die aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten
              Informationen, durch Missbrauch der Verbindung oder durch technische Störungen
              entstanden sind, werden ausgeschlossen.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Alle Angebote sind freibleibend. Der Autor behält es sich ausdrücklich vor,
              Teile der Seiten oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern,
              zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">Haftung für Links</h2>
            <p className="text-slate-700 leading-relaxed">
              Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
              Verantwortungsbereichs. Es wird jegliche Verantwortung für solche Webseiten
              abgelehnt. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene
              Gefahr der jeweiligen Nutzer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">Urheberrechte</h2>
            <p className="text-slate-700 leading-relaxed">
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen
              Dateien auf dieser Website gehören ausschliesslich der Marketplace24-7 GmbH
              oder den speziell genannten Rechteinhabern. Für die Reproduktion jeglicher
              Elemente ist die schriftliche Zustimmung des Urheberrechtsträgers im Voraus
              einzuholen.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-sm text-slate-400">
          Stand: März 2026
        </div>
      </main>
    </div>
  );
}
