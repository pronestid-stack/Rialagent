'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#05050B' }}>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,5,11,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(30,30,48,0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" fill="white"/></svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Rial<span className="text-gradient-gold">Agent</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Funzionalità</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">Come Funziona</a>
              <a href="#stats" className="text-sm text-gray-400 hover:text-white transition-colors">Dati</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Prezzi</a>
              <Link href="/due-diligence" className="text-sm text-gray-400 hover:text-white transition-colors">Due Diligence</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/due-diligence" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(76,139,245,0.4)', color: '#4C8BF5' }}>
                🔍 DD
              </Link>
              <Link href="/analyze" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
                Analizza un Deal
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t" style={{ borderColor: '#1E1E30' }}>
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Funzionalità</a>
                <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Come Funziona</a>
                <a href="#pricing" className="text-sm text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Prezzi</a>
                <Link href="/due-diligence" className="text-sm text-blue-400 hover:text-blue-300" onClick={() => setMobileMenuOpen(false)}>🔍 Due Diligence</Link>
                <Link href="/analyze" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-fit"
                  style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
                  Analizza un Deal
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(245,166,35,0.12) 0%, transparent 60%)' }} />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(76,139,245,0.05)' }} />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5A623' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                AI Immobiliare Next-Gen
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Analizza qualsiasi<br />
                <span className="text-gradient-gold">deal immobiliare</span><br />
                in pochi secondi
              </h1>
              <p className="text-lg text-gray-400 max-w-xl mb-8 leading-relaxed">
                Modelli finanziari professionali, analisi di mercato e scenari value-add &mdash;
                generati dall&apos;AI in un click. Sostituisci settimane di lavoro in Excel con minuti.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/analyze" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold transition-all hover:opacity-90 hover:scale-105 glow-gold"
                  style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
                  Analizza Gratis
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium transition-all hover:bg-white/5"
                  style={{ border: '1px solid #1E1E30', color: '#ccc' }}>
                  Come Funziona
                </a>
              </div>
              <p className="mt-4 text-xs text-gray-500">Nessuna carta di credito richiesta · Analisi illimitata in demo</p>
            </div>
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="py-10 px-4" style={{ borderTop: '1px solid #1E1E30', borderBottom: '1px solid #1E1E30' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-6">Usato dai migliori team immobiliari</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {['Savills', 'JLL', 'CBRE', 'Colliers', 'BNP Paribas RE', 'Cushman & Wakefield'].map(name => (
              <span key={name} className="text-sm font-semibold text-gray-600 hover:text-gray-400 transition-colors cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(76,139,245,0.1)', border: '1px solid rgba(76,139,245,0.25)', color: '#4C8BF5' }}>
              Funzionalità Core
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Tutto quello che serve per<br />
              <span className="text-gradient-blue">decidere con sicurezza</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">RialAgent elabora dati grezzi del deal e restituisce analisi complete pronte per presentazioni di investimento.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl transition-all hover:-translate-y-1 group cursor-default"
                style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform" style={{ background: f.bg }}>{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4" style={{ background: '#07070F' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5A623' }}>
              Come Funziona
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Da dati grezzi a report professionale<br />
              <span className="text-gradient-gold">in 3 step</span>
            </h2>
          </div>
          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-6 p-6 rounded-2xl transition-all hover:-translate-x-1" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-black text-lg" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)', color: '#000' }}>{i + 1}</div>
                <div>
                  <h3 className="font-bold text-white mb-1 text-lg">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
                <div className="ml-auto text-3xl hidden sm:block">{step.emoji}</div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/analyze" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all hover:opacity-90 hover:scale-105 glow-gold"
              style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
              Inizia Subito — È Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-6 rounded-2xl" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <div className="text-3xl sm:text-4xl font-black text-gradient-gold mb-2">{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-24 px-4" style={{ background: '#07070F' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ogni analisi include</h2>
            <p className="text-gray-400">Un report strutturato pronto per comitati di investimento e presentazioni LP</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {outputs.map((o, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(245,166,35,0.15)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm mb-1">{o.title}</div>
                  <div className="text-xs text-gray-500">{o.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.25)', color: '#A78BFA' }}>
              Piani & Prezzi
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Scegli il piano giusto<br /><span className="text-gradient-blue">per il tuo team</span>
            </h2>
            <p className="text-gray-400">Prezzi trasparenti, nessun costo nascosto. Inizia gratis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`p-7 rounded-2xl flex flex-col relative ${plan.popular ? 'glow-gold' : ''}`}
                style={{
                  background: plan.popular ? 'linear-gradient(180deg, rgba(245,166,35,0.08) 0%, #0D0D1A 40%)' : '#0D0D1A',
                  border: plan.popular ? '1px solid rgba(245,166,35,0.4)' : '1px solid #1E1E30',
                }}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)', color: '#000' }}>Più Popolare</div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-white text-xl mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.tagline}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 text-sm ml-1">{plan.period}</span>}
                </div>
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                        <path d="M2.5 7l2.5 2.5L11.5 3.5" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/analyze"
                  className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all hover:opacity-90`}
                  style={plan.popular
                    ? { background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }
                    : { background: 'transparent', border: '1px solid #2A2A42', color: '#ccc' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="py-24 px-4" style={{ background: '#07070F' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 rounded-3xl overflow-hidden" style={{ background: '#0D0D1A', border: '1px solid rgba(245,166,35,0.2)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(245,166,35,0.1) 0%, transparent 70%)' }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Pronto a trasformare<br /><span className="text-gradient-gold">il tuo processo di investimento?</span>
              </h2>
              <p className="text-gray-400 mb-8">Unisciti a centinaia di team che usano RialAgent per prendere decisioni più rapide e accurate.</p>
              <Link href="/analyze" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all hover:opacity-90 hover:scale-105 glow-gold"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
                Analizza il Tuo Primo Deal — Gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4" style={{ borderTop: '1px solid #1E1E30' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)' }}>
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" fill="white"/></svg>
                </div>
                <span className="font-bold text-white">Rial<span className="text-gradient-gold">Agent</span></span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">AI per il mercato immobiliare professionale. Analisi complete in pochi secondi.</p>
            </div>
            <div className="flex flex-wrap gap-12">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Prodotto</p>
                <div className="flex flex-col gap-2">
                  {['Funzionalità', 'Come Funziona', 'Prezzi', 'Demo'].map(l => (
                    <a key={l} href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Azienda</p>
                <div className="flex flex-col gap-2">
                  {['Chi Siamo', 'Blog', 'Privacy', 'Termini'].map(l => (
                    <a key={l} href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{l}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2" style={{ borderTop: '1px solid #1E1E30' }}>
            <p className="text-xs text-gray-600">© 2025 RialAgent. Tutti i diritti riservati.</p>
            <p className="text-xs text-gray-600">Powered by Claude AI · Made in Italy 🇮🇹</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  { icon: '🤖', bg: 'rgba(245,166,35,0.12)', title: 'Analisi AI Istantanea', desc: "Inserisci i dati del deal e ottieni un'analisi professionale completa in meno di 60 secondi." },
  { icon: '📊', bg: 'rgba(76,139,245,0.12)', title: 'Report Excel Professionale', desc: 'Genera modelli finanziari strutturati pronti per presentazioni LP e comitati di investimento.' },
  { icon: '🔍', bg: 'rgba(34,197,94,0.12)', title: 'Due Diligence Italia', desc: '8 aree di verifica (legale, urbanistica, sismica, ambientale, ESG...) con checklist e database ufficiali.' },
  { icon: '📈', bg: 'rgba(124,77,255,0.12)', title: 'Scenari Value-Add', desc: 'Esplora scenari conservativi, moderati e aggressivi con ROI proiettato e piano operativo.' },
]

const steps = [
  { title: 'Inserisci i dati del deal', desc: 'Compila il form con indirizzo, tipo di proprietà, prezzo, affitti, spese operative e parametri di finanziamento. Bastano 2 minuti.', emoji: '📋' },
  { title: "L'AI elabora l'analisi completa", desc: 'Il motore AI analizza valutazione, comparabili di mercato, scenari value-add, fattori di rischio e formula una raccomandazione di investimento.', emoji: '⚡' },
  { title: 'Scarica il report Excel professionale', desc: 'Ottieni un modello finanziario strutturato con tutte le metriche, le proiezioni a 10 anni e gli scenari. Pronto da condividere.', emoji: '📥' },
]

const stats = [
  { value: '5.300+', label: 'Fonti dati immobiliari' },
  { value: '207', label: 'Mercati coperti' },
  { value: '< 2min', label: 'Tempo medio di analisi' },
  { value: '€294T', label: 'Patrimonio analizzato' },
]

const outputs = [
  { title: 'Sommario Esecutivo', desc: 'Sintesi chiara e concisa del deal per decisori e LP' },
  { title: 'Metriche Finanziarie Chiave', desc: 'Cap Rate, NOI, Cash-on-Cash, DCR, GRM, rendimento lordo' },
  { title: 'Analisi di Valutazione', desc: 'Stima del valore corrente e posizionamento di mercato' },
  { title: 'Comparabili di Mercato', desc: 'Analisi di 3-5 proprietà simili con prezzi al mq e cap rate' },
  { title: 'Scenari Value-Add', desc: 'Tre scenari (conservativo, moderato, aggressivo) con ROI proiettato' },
  { title: 'Assessment dei Rischi', desc: '5 fattori di rischio chiave con strategie di mitigazione' },
  { title: 'Raccomandazione di Investimento', desc: 'Rating ACQUISTA / MANTIENI / PASSA con punteggio e motivazione' },
  { title: 'Proiezioni a 10 Anni', desc: 'Cash flow dettagliato anno per anno con IRR e equity multiple' },
  { title: 'Report Excel Scaricabile', desc: 'Modello professionale pronto per presentazioni e due diligence' },
]

const plans = [
  {
    name: 'Starter', tagline: 'Per analisti e investitori privati', price: '€49', period: '/mese', popular: false, cta: 'Inizia Gratis',
    features: ['10 analisi al mese', 'Report Excel standard', 'Metriche finanziarie complete', 'Scenari value-add', 'Supporto email'],
  },
  {
    name: 'Pro', tagline: 'Per team e fondi immobiliari', price: '€149', period: '/mese', popular: true, cta: 'Prova 14 Giorni Gratis',
    features: ['50 analisi al mese', 'Report Excel avanzato', 'Comparabili di mercato AI', 'Proiezioni a 10 anni', '5 utenti inclusi', 'Supporto prioritario', 'Export PDF & PowerPoint'],
  },
  {
    name: 'Enterprise', tagline: 'Per grandi organizzazioni RE', price: 'Custom', period: '', popular: false, cta: 'Contattaci',
    features: ['Analisi illimitate', 'Data isolation privata', 'API access', 'SSO & SAML', 'SLA garantito', 'Onboarding dedicato', 'Integrazioni custom'],
  },
]

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-2xl blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.3) 0%, rgba(76,139,245,0.2) 100%)' }} />
      <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0D0D1A', border: '1px solid rgba(30,30,48,0.8)' }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#111121', borderBottom: '1px solid #1E1E30' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
          </div>
          <div className="flex-1 mx-4 h-6 rounded-md flex items-center px-3 text-xs text-gray-500" style={{ background: '#1A1A2A' }}>rialagent.ai/analyze</div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-white font-semibold text-sm">Via Roma 15, Milano</div>
              <div className="text-xs text-gray-500 mt-0.5">Commerciale · 850 mq</div>
            </div>
            <div className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(39,201,63,0.15)', color: '#27C93F' }}>ACQUISTA</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[{ label: 'Cap Rate', value: '6.8%', color: '#F5A623' }, { label: 'NOI', value: '€89.4K', color: '#4C8BF5' }, { label: 'Cash-on-Cash', value: '9.2%', color: '#A78BFA' }].map((m, i) => (
              <div key={i} className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
                <div className="text-lg font-black" style={{ color: m.color }}>{m.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-3 font-medium">Scenari Value-Add</div>
            {[{ name: 'Conservativo', pct: 55, value: '+12%', color: '#4C8BF5' }, { name: 'Moderato', pct: 72, value: '+23%', color: '#F5A623' }, { name: 'Aggressivo', pct: 90, value: '+38%', color: '#27C93F' }].map((s, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <div className="text-xs text-gray-400 w-20 flex-shrink-0">{s.name}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1E1E30' }}><div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} /></div>
                <div className="text-xs font-bold w-10 text-right" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mb-4 p-3 rounded-xl" style={{ background: '#151525' }}>
            <div className="text-xs text-gray-400 mb-2 font-medium">Fattori di Rischio</div>
            {[{ risk: 'Rischio tasso', level: 'Medio' }, { risk: 'Vacancy rate', level: 'Basso' }].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-300">{r.risk}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.level === 'Basso' ? 'rgba(39,201,63,0.15)' : 'rgba(255,189,46,0.15)', color: r.level === 'Basso' ? '#27C93F' : '#FFBD2E' }}>{r.level}</span>
              </div>
            ))}
          </div>
          <button className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)', color: '#000' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 3 3-3M1 9v1a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Scarica Report Excel
          </button>
        </div>
      </div>
    </div>
  )
}
