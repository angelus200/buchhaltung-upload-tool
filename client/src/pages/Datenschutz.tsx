import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-white">
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
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-slate max-w-none space-y-6">

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">1. Verantwortliche Stelle</h2>
            <p className="text-slate-700 leading-relaxed">
              <strong>Marketplace24-7 GmbH</strong><br />
              Kantonsstrasse 1, 8807 Freienbach SZ, Schweiz<br />
              E-Mail: info@non-dom.group
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">2. Geltungsbereich</h2>
            <p className="text-slate-700 leading-relaxed">
              Diese Datenschutzerklärung gilt für die Nutzung der SaaS-Anwendung
              buchhaltung-ki.app (nachfolgend «Plattform») und informiert über Art, Umfang
              und Zweck der Erhebung und Verwendung personenbezogener Daten. Die Plattform
              richtet sich an Unternehmen in Deutschland, Österreich und der Schweiz.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend dem
              Schweizer Datenschutzgesetz (DSG), der EU-Datenschutz-Grundverordnung
              (DSGVO) — soweit anwendbar — sowie dieser Datenschutzerklärung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">3. Erhobene Daten</h2>
            <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">3.1 Registrierungsdaten</h3>
            <p className="text-slate-700 leading-relaxed">
              Bei der Registrierung erheben wir: Name, E-Mail-Adresse, Firmenname, Land.
              Die Authentifizierung erfolgt über den Dienst Clerk (clerk.com). Clerk verarbeitet
              Login-Daten gemäss eigener Datenschutzrichtlinie.
            </p>
            <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">3.2 Buchhaltungsdaten</h3>
            <p className="text-slate-700 leading-relaxed">
              Zur Erbringung der Dienstleistung verarbeiten wir die von Ihnen eingegebenen
              Buchhaltungsdaten: Buchungen, Belege, Kontenpläne, Stammdaten (Kreditoren,
              Debitoren), Kontoauszüge, Finanzberichte. Diese Daten werden in einer eigenen,
              physisch isolierten Datenbank pro Mandant gespeichert (Database-per-Tenant).
            </p>
            <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">3.3 Belege und OCR</h3>
            <p className="text-slate-700 leading-relaxed">
              Hochgeladene Belege (PDF, JPG, PNG) werden zur automatischen Texterkennung
              an die Anthropic API (Claude Vision) übermittelt. Anthropic verarbeitet diese
              Daten gemäss eigener Datenschutzrichtlinie und speichert keine Kundendaten
              für eigene Trainingszwecke. Die extrahierten Daten werden ausschliesslich in
              Ihrer mandantenspezifischen Datenbank gespeichert.
            </p>
            <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">3.4 Zahlungsdaten</h3>
            <p className="text-slate-700 leading-relaxed">
              Zahlungen werden über Stripe (stripe.com) abgewickelt. Kreditkartendaten werden
              ausschliesslich von Stripe verarbeitet und nie auf unseren Servern gespeichert.
            </p>
            <h3 className="text-lg font-medium text-slate-700 mt-4 mb-2">3.5 Server-Logdaten</h3>
            <p className="text-slate-700 leading-relaxed">
              Beim Zugriff auf die Plattform werden automatisch technische Daten erhoben:
              IP-Adresse, Zugriffszeit, Browsertyp, Betriebssystem. Diese Daten werden
              ausschliesslich zur Sicherstellung des Betriebs und zur Fehlerbehebung
              verwendet und nach 30 Tagen gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">4. Zweck der Datenverarbeitung</h2>
            <p className="text-slate-700 leading-relaxed">
              Wir verarbeiten Ihre Daten ausschliesslich für folgende Zwecke:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Bereitstellung und Betrieb der Buchhaltungsplattform</li>
              <li>Automatische Belegerkennung (OCR) und Buchungsvorschläge</li>
              <li>Abrechnung und Zahlungsabwicklung</li>
              <li>Technischer Support und Fehlerbehebung</li>
              <li>Einhaltung gesetzlicher Aufbewahrungspflichten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">5. Datenweitergabe an Dritte</h2>
            <p className="text-slate-700 leading-relaxed">
              Wir geben Ihre Daten nur an folgende Auftragsverarbeiter weiter:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li><strong>Railway</strong> (Hosting) — Serverstandort: USA / EU</li>
              <li><strong>Clerk</strong> (Authentifizierung) — clerk.com</li>
              <li><strong>Stripe</strong> (Zahlungsabwicklung) — stripe.com</li>
              <li><strong>Anthropic</strong> (KI/OCR-Belegerkennung) — anthropic.com</li>
              <li><strong>Resend</strong> (E-Mail-Versand) — resend.com</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              Eine Weitergabe an sonstige Dritte erfolgt nicht, es sei denn, wir sind
              gesetzlich dazu verpflichtet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">6. Datensicherheit</h2>
            <p className="text-slate-700 leading-relaxed">
              Wir setzen technische und organisatorische Sicherheitsmassnahmen ein:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Verschlüsselte Datenübertragung (TLS/SSL)</li>
              <li>Physische Datenisolation pro Mandant (eigene Datenbank)</li>
              <li>Rollenbasierte Zugriffssteuerung</li>
              <li>API-Keys mit SHA-256 Hashing</li>
              <li>Regelmässige Sicherheitsupdates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">7. Aufbewahrung und Löschung</h2>
            <p className="text-slate-700 leading-relaxed">
              Buchhaltungsdaten werden gemäss den gesetzlichen Aufbewahrungsfristen
              gespeichert (10 Jahre in DE/AT gemäss AO/BAO, 10 Jahre in CH gemäss Art. 958f OR).
              Nach Vertragsende und Ablauf der Aufbewahrungsfrist werden Ihre Daten
              einschliesslich der mandantenspezifischen Datenbank vollständig gelöscht.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Sie können jederzeit die Löschung Ihres Accounts und Ihrer Daten verlangen.
              Wir werden dem innerhalb von 30 Tagen nachkommen, sofern keine gesetzlichen
              Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">8. Ihre Rechte</h2>
            <p className="text-slate-700 leading-relaxed">
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Recht auf Auskunft über die gespeicherten Daten</li>
              <li>Recht auf Berichtigung unrichtiger Daten</li>
              <li>Recht auf Löschung (unter Berücksichtigung gesetzlicher Aufbewahrungspflichten)</li>
              <li>Recht auf Datenexport (DATEV-Export, CSV-Export)</li>
              <li>Recht auf Widerspruch gegen die Datenverarbeitung</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich an: info@non-dom.group
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">9. Cookies</h2>
            <p className="text-slate-700 leading-relaxed">
              Die Plattform verwendet ausschliesslich technisch notwendige Cookies
              für die Authentifizierung (Session-Management via Clerk). Es werden keine
              Tracking-Cookies oder Analyse-Tools von Drittanbietern eingesetzt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">10. Änderungen</h2>
            <p className="text-slate-700 leading-relaxed">
              Wir können diese Datenschutzerklärung jederzeit anpassen. Die aktuelle Version
              ist jeweils auf dieser Seite abrufbar. Bei wesentlichen Änderungen werden
              registrierte Nutzer per E-Mail informiert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">11. Anwendbares Recht</h2>
            <p className="text-slate-700 leading-relaxed">
              Es gilt Schweizer Recht. Gerichtsstand ist Freienbach SZ, Schweiz.
              Für Kunden mit Sitz in der EU gelten ergänzend die Bestimmungen der DSGVO,
              soweit diese zwingend anwendbar sind.
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
