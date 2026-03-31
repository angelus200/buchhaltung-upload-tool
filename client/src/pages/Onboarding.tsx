// client/src/pages/Onboarding.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useOrganizationList } from '@clerk/clerk-react';
import { Building2, Globe, BookOpen, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

type Step = 'loading' | 'setup' | 'creating' | 'done' | 'error';

interface CheckoutData {
  customerId: string;
  customerEmail: string;
  plan: string;
  status: string;
}

const KONTENRAHMEN: Record<string, { value: string; label: string }[]> = {
  DE: [{ value: 'SKR04', label: 'SKR04 (Standard)' }, { value: 'SKR03', label: 'SKR03' }],
  AT: [{ value: 'OeKR', label: 'Österr. Kontenrahmen (ÖKR)' }, { value: 'RLG', label: 'RLG' }],
  CH: [{ value: 'KMU', label: 'KMU (Standard)' }, { value: 'OR', label: 'OR' }],
};

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { createOrganization } = useOrganizationList();

  const [step, setStep] = useState<Step>('loading');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState('');
  const [firmenName, setFirmenName] = useState('');
  const [land, setLand] = useState('DE');
  const [kontenrahmen, setKontenrahmen] = useState('SKR04');

  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStep('error');
      setError('Keine Checkout-Session gefunden.');
      return;
    }
    fetch(`/api/stripe/checkout-session/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStep('error'); setError(data.error); }
        else { setCheckoutData(data); setStep('setup'); }
      })
      .catch(() => { setStep('error'); setError('Checkout-Daten konnten nicht geladen werden.'); });
  }, [sessionId]);

  useEffect(() => {
    const opts = KONTENRAHMEN[land];
    if (opts?.length) setKontenrahmen(opts[0].value);
  }, [land]);

  const handleSubmit = async () => {
    if (!firmenName.trim() || !checkoutData?.customerId || !createOrganization) return;
    setStep('creating');

    try {
      const org = await createOrganization({ name: firmenName.trim() });
      if (!org?.id) throw new Error('Organisation konnte nicht erstellt werden.');

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeCustId: checkoutData.customerId,
          clerkOrgId: org.id,
          firmenName: firmenName.trim(),
          land,
          kontenrahmen,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Onboarding fehlgeschlagen.');

      setStep('done');
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (err: any) {
      setStep('error');
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">buchhaltung-ki.app</h1>
          <p className="text-sm text-slate-500 mt-1">Willkommen! Richten Sie Ihre Firma ein.</p>
        </div>

        {step === 'loading' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-600">Checkout-Daten werden geladen...</p>
          </div>
        )}

        {step === 'setup' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Firma einrichten</h2>
            <p className="text-sm text-slate-500 mb-6">
              Plan: <span className="font-medium capitalize">{checkoutData?.plan}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-4 h-4" /> Firmenname
              </label>
              <input
                type="text"
                value={firmenName}
                onChange={e => setFirmenName(e.target.value)}
                placeholder="z.B. Muster GmbH"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Globe className="w-4 h-4" /> Land
              </label>
              <select
                value={land}
                onChange={e => setLand(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> Kontenrahmen
              </label>
              <select
                value={kontenrahmen}
                onChange={e => setKontenrahmen(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {KONTENRAHMEN[land]?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!firmenName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Firma anlegen &amp; loslegen <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'creating' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-600">Ihre Firma wird eingerichtet...</p>
            <p className="text-xs text-slate-400 mt-2">Datenbank wird erstellt, Kontenrahmen wird geladen...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Alles bereit!</h2>
            <p className="text-slate-600">Sie werden zum Dashboard weitergeleitet...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Fehler</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/#preise')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Zurück zur Startseite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
