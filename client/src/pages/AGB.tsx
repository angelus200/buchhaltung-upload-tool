import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AGB() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="text-slate-500 mb-8">für die SaaS-Buchhaltungsplattform buchhaltung-ki.app</p>

        <div className="prose prose-slate max-w-none space-y-6">

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 1 Geltungsbereich und Vertragsparteien</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Diese AGB gelten für die Nutzung der cloudbasierten Buchhaltungssoftware
              «buchhaltung-ki.app» (nachfolgend «Plattform»), betrieben von der
              Marketplace24-7 GmbH, Kantonsstrasse 1, 8807 Freienbach SZ, Schweiz
              (nachfolgend «Anbieter»).
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Die Plattform richtet sich ausschliesslich an Unternehmer im Sinne des
              jeweiligen nationalen Rechts (Deutschland, Österreich, Schweiz). Die Nutzung
              durch Verbraucher ist ausgeschlossen.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Abweichende oder ergänzende AGB des Kunden werden nicht Vertragsbestandteil,
              auch wenn der Anbieter ihnen nicht ausdrücklich widerspricht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 2 Vertragsgegenstand</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Anbieter stellt dem Kunden eine webbasierte Buchhaltungsplattform
              als Software-as-a-Service (SaaS) zur Verfügung. Die Plattform umfasst je nach
              gebuchtem Plan folgende Funktionen:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Buchhaltung mit länderspezifischen Kontenplänen (SKR03/SKR04 für DE, ÖKR für AT, KMU/OR für CH)</li>
              <li>CSV-Bankimport (12 Formate) und DATEV-Import/Export</li>
              <li>Automatische Belegerkennung (KI/OCR) via Claude Vision API</li>
              <li>Unterstützung von EUR und CHF mit Währungsumrechnung</li>
              <li>REST-API-Zugang für externe Integrationen (Manus-Schnittstelle)</li>
              <li>Multi-Firmen-Verwaltung innerhalb eines Mandanten</li>
            </ul>
            <p className="text-slate-700 leading-relaxed">
              (2) Der genaue Funktionsumfang richtet sich nach dem jeweils gebuchten Plan
              gemäss der aktuellen Preisliste auf der Plattform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 3 Vertragsschluss und Registrierung</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Vertrag kommt durch die Registrierung des Kunden auf der Plattform
              und die Auswahl eines Abonnementplans zustande.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Der Kunde versichert, dass die bei der Registrierung angegebenen Daten
              korrekt und vollständig sind und verpflichtet sich, Änderungen unverzüglich
              zu aktualisieren.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Der Anbieter behält sich das Recht vor, Registrierungen ohne Angabe von
              Gründen abzulehnen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 4 Leistungsumfang und Verfügbarkeit</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Anbieter stellt die Plattform mit einer angestrebten Verfügbarkeit
              von 99,5 % im Jahresmittel zur Verfügung. Geplante Wartungsarbeiten werden
              mindestens 24 Stunden im Voraus angekündigt.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Die Daten des Kunden werden in einer physisch isolierten Datenbank
              (Database-per-Tenant) gespeichert. Der Kunde hat keinen Zugriff auf Daten
              anderer Mandanten.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Der Anbieter ist berechtigt, die Plattform technisch weiterzuentwickeln
              und den Funktionsumfang zu erweitern. Eine Reduzierung wesentlicher Funktionen
              des gebuchten Plans erfolgt nur mit angemessener Vorankündigung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 5 Preise und Zahlung</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Die Nutzung der Plattform ist kostenpflichtig. Die aktuellen Preise ergeben
              sich aus der Preisliste auf der Plattform. Alle Preise verstehen sich
              zuzüglich der jeweils geltenden Mehrwertsteuer.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Die Abrechnung erfolgt monatlich im Voraus. Die Zahlung wird über den
              Zahlungsdienstleister Stripe abgewickelt.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Zusatzoptionen (z. B. Manus-API-Schnittstelle, 119 €/Monat zzgl. MwSt.)
              werden separat zum gewählten Plan abgerechnet und können jederzeit hinzu-
              oder abgebucht werden.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (4) Der Anbieter ist berechtigt, die Preise mit einer Ankündigungsfrist von
              30 Tagen zum Ende der laufenden Abrechnungsperiode anzupassen. Der Kunde hat
              in diesem Fall ein Sonderkündigungsrecht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 6 Laufzeit und Kündigung</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden
              Seiten jederzeit zum Ende des laufenden Abrechnungsmonats gekündigt werden.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Die Kündigung erfolgt über die Plattform (Kontoeinstellungen) oder
              per E-Mail an info@non-dom.group.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt unberührt.
              Ein wichtiger Grund liegt insbesondere vor bei Zahlungsverzug von mehr als
              30 Tagen oder bei Verstoss gegen § 7 dieser AGB.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (4) Nach Vertragsende stehen dem Kunden 30 Tage zur Verfügung, um seine Daten
              zu exportieren (DATEV-Export, CSV-Export). Danach wird die mandantenspezifische
              Datenbank unwiderruflich gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 7 Pflichten des Kunden</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Kunde ist für die Richtigkeit und Vollständigkeit der eingegebenen
              Buchhaltungsdaten selbst verantwortlich. Die Plattform ersetzt keine
              steuerliche oder rechtliche Beratung.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Der Kunde ist verpflichtet, seine Zugangsdaten vertraulich zu behandeln
              und den Anbieter unverzüglich zu informieren, wenn er Kenntnis von einem
              Missbrauch seiner Zugangsdaten erlangt.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Der Kunde darf die Plattform nicht für rechtswidrige Zwecke nutzen und
              keine Inhalte hochladen, die gegen geltendes Recht verstossen.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (4) API-Keys sind vertraulich zu behandeln. Bei Verdacht auf Kompromittierung
              ist der Anbieter unverzüglich zu informieren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 8 Datenschutz und Datensicherheit</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Anbieter verarbeitet personenbezogene Daten gemäss seiner
              Datenschutzerklärung und den Bestimmungen des Schweizer DSG und — soweit
              anwendbar — der DSGVO.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Die Buchhaltungsdaten jedes Mandanten werden in einer physisch isolierten
              Datenbank gespeichert. Eine mandantenübergreifende Einsichtnahme ist technisch
              ausgeschlossen.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Auf Wunsch des Kunden schliesst der Anbieter einen
              Auftragsverarbeitungsvertrag (AVV/DPA) gemäss Art. 28 DSGVO ab.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 9 Haftung</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens,
              des Körpers oder der Gesundheit sowie für vorsätzlich oder grob fahrlässig
              verursachte Schäden.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Für leicht fahrlässig verursachte Schäden haftet der Anbieter nur bei
              Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und begrenzt
              auf den vertragstypisch vorhersehbaren Schaden, maximal jedoch den
              Jahresabonnementpreis.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Die Plattform unterstützt die Buchhaltung, ersetzt aber nicht die
              fachkundige Prüfung durch einen Steuerberater oder Wirtschaftsprüfer.
              Der Anbieter haftet nicht für steuerliche oder buchhalterische Fehler, die
              auf fehlerhafte Eingaben des Kunden zurückzuführen sind.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (4) KI-gestützte Funktionen (OCR-Belegerkennung, Buchungsvorschläge) sind
              Hilfsmittel und können fehlerhafte Ergebnisse liefern. Der Kunde ist
              verpflichtet, die Ergebnisse zu prüfen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 10 Geistiges Eigentum</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Alle Rechte an der Plattform, einschliesslich Quellcode, Design und
              Dokumentation, verbleiben beim Anbieter.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Der Kunde erhält ein nicht übertragbares, nicht unterlizenzierbares Recht
              zur Nutzung der Plattform für die Dauer des Vertrags.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Die vom Kunden eingegebenen Daten verbleiben im Eigentum des Kunden.
              Der Anbieter erwirbt daran keine Rechte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 11 Änderung der AGB</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Der Anbieter kann diese AGB mit einer Ankündigungsfrist von 30 Tagen
              ändern. Die Änderungen werden dem Kunden per E-Mail mitgeteilt.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Widerspricht der Kunde nicht innerhalb von 30 Tagen nach Zugang der
              Änderungsmitteilung, gelten die geänderten AGB als akzeptiert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-3">§ 12 Schlussbestimmungen</h2>
            <p className="text-slate-700 leading-relaxed">
              (1) Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts (CISG).
            </p>
            <p className="text-slate-700 leading-relaxed">
              (2) Gerichtsstand ist Freienbach SZ, Schweiz. Für Kunden mit Sitz in der EU
              gelten zusätzlich die zwingenden Gerichtsstandsregeln der EuGVVO.
            </p>
            <p className="text-slate-700 leading-relaxed">
              (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden,
              bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 text-sm text-slate-400">
          Stand: März 2026 · Marketplace24-7 GmbH, Freienbach SZ
        </div>
      </main>
    </div>
  );
}
