'use client'

import { useState } from 'react'
import Link from 'next/link'

type AgentAnalysis = {
  sommarioEsecutivo: string
  raccomandazione: { decisione: string; punteggio: number; motivazione: string; urgenza: string }
  valutazione: {
    prezzoStimato: number; rangeMin: number; rangeMax: number; confidenza: number
    prezzoAlMq: number; prezzoMercatoMq: number; deltaMercato: number
    metodoComparativo: { valore: number; peso: number; descrizione: string }
    metodoReddituale: { valore: number; peso: number; descrizione: string }
    metodoCosto: { valore: number; peso: number; descrizione: string }
    fattoriPositivi: string[]; fattoriNegativi: string[]
  }
  analisiMercato: {
    trend: string; intensita: string; prezzoMedioZona: number
    velocitaVenditaGiorni: number; domandaOffertaRatio: number
    tendenza12Mesi: string; stagionalita: string
  }
  comparabili: Array<{ descrizione: string; prezzo: number; prezzoMq: number; metratura: number; caratteristiche: string; rettifica: number }>
  analisiInvestimento: {
    canoneStimato: { min: number; max: number; mediano: number }
    rendimentoLordo: number; rendimentoNetto: number; capRateStimato: number
    paybackAnni: number; opportunita: string; motivazioneInvestimento: string
    proiezione5Anni: { apprezzamento: number; rendimentoTotale: number }
  }
  strategiaNegoziazione: {
    prezzoListinoConsigliato: number; offertaIniziale: number; targetFinale: number
    margineNegoziazione: number; timelineConsigliata: string
    argomentazioni: string[]; puntiForza: string[]; puntiDebolezza: string[]; tattiche: string[]
  }
  dueDiligenceRischi: Array<{ area: string; emoji: string; rischio: string; descrizione: string; azione: string; priorita: string }>
  costiTransazione: { imposteRegistro: number; notarile: number; perizia: number; agenzia: number; totale: number; note: string }
  pianoAzione: Array<{ priorita: number; azione: string; timing: string; costo: number; perché: string }>
}

type FormData = {
  indirizzo: string; comune: string; tipoProprietà: string; superficieMq: string
  camere: string; bagni: string; piano: string; annoCostruzione: string
  statoManutenzione: string; classeEnergetica: string; accessori: string[]
  prezzoRichiesto: string; canoneLocazione: string; scopo: string; note: string
}

const initial: FormData = {
  indirizzo: '', comune: '', tipoProprietà: 'Residenziale', superficieMq: '',
  camere: '', bagni: '', piano: '', annoCostruzione: '',
  statoManutenzione: 'Buono', classeEnergetica: '', accessori: [],
  prezzoRichiesto: '', canoneLocazione: '', scopo: 'Acquisto', note: '',
}

const ACCESSORI_LIST = ['Garage', 'Posto Auto', 'Terrazza', 'Balcone', 'Giardino', 'Cantina', 'Ascensore', 'Portineria', 'Piscina']

const reccColors: Record<string, { bg: string; color: string; border: string }> = {
  'ACQUISTA': { bg: 'rgba(39,201,63,0.12)', color: '#27C93F', border: 'rgba(39,201,63,0.35)' },
  'VENDI ORA': { bg: 'rgba(76,139,245,0.12)', color: '#4C8BF5', border: 'rgba(76,139,245,0.35)' },
  'INVESTI': { bg: 'rgba(245,166,35,0.12)', color: '#F5A623', border: 'rgba(245,166,35,0.35)' },
  'ASPETTA': { bg: 'rgba(255,189,46,0.12)', color: '#FFBD2E', border: 'rgba(255,189,46,0.35)' },
  'TRATTA': { bg: 'rgba(162,139,250,0.12)', color: '#A78BFA', border: 'rgba(162,139,250,0.35)' },
}

const riskColors: Record<string, { bg: string; color: string }> = {
  'Basso': { bg: 'rgba(39,201,63,0.15)', color: '#27C93F' },
  'Medio': { bg: 'rgba(255,189,46,0.15)', color: '#FFBD2E' },
  'Alto': { bg: 'rgba(255,95,86,0.15)', color: '#FF5F56' },
}

const trendColors: Record<string, { color: string; icon: string }> = {
  'crescita': { color: '#27C93F', icon: '↑' },
  'stabile': { color: '#FFBD2E', icon: '→' },
  'calo': { color: '#FF5F56', icon: '↓' },
}

type TabId = 'overview' | 'valutazione' | 'mercato' | 'negoziazione' | 'investimento' | 'piano'

export default function AgentePage() {
  const [form, setForm] = useState<FormData>(initial)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')

  function set(k: keyof FormData, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function toggleAccessorio(a: string) {
    setForm(p => ({
      ...p,
      accessori: p.accessori.includes(a) ? p.accessori.filter(x => x !== a) : [...p.accessori, a],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.indirizzo || !form.comune || !form.superficieMq) {
      setError('Compila: Indirizzo, Comune e Superficie mq')
      return
    }
    setError(null)
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Errore ${res.status}`) }
      const data = await res.json()
      setAnalysis(data)
      setTab('overview')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  const rc = analysis ? (reccColors[analysis.raccomandazione.decisione] || reccColors['TRATTA']) : reccColors['TRATTA']
  const tv = analysis?.analisiMercato ? (trendColors[analysis.analisiMercato.trend] || trendColors['stabile']) : trendColors['stabile']

  return (
    <div className="min-h-screen" style={{ background: '#05050B' }}>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,5,11,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(30,30,48,0.7)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" fill="white"/></svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Rial<span className="text-gradient-gold">Agent</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/analyze" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Analisi Deal</Link>
            <Link href="/due-diligence" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Due Diligence</Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* HERO */}
          {!analysis && !loading && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623' }}>
                🤖 AI Agent Immobiliare — Powered by Claude
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
                La tua <span className="text-gradient-gold">valutazione completa</span><br />in 60 secondi
              </h1>
              <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
                Valutazione (3 metodi), analisi di mercato, strategia di negoziazione, due diligence, piano d&apos;azione.<br />
                <span className="text-gray-500">Quello che normalmente costa €2.000+ con un team di professionisti.</span>
              </p>
            </div>
          )}

          {/* FORM */}
          {!analysis && (
            <form onSubmit={handleSubmit} className="animate-in">
              <div className="rounded-2xl p-6 sm:p-8 mb-4" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                {/* SCOPO */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Qual è il tuo obiettivo?</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Acquisto', 'Vendita', 'Investimento', 'Valutazione'].map(s => (
                      <button key={s} type="button" onClick={() => set('scopo', s)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: form.scopo === s ? 'linear-gradient(135deg, #F5A623, #D4891C)' : '#151525',
                          color: form.scopo === s ? '#000' : '#888',
                          border: form.scopo === s ? 'none' : '1px solid #2A2A42',
                        }}>
                        {s === 'Acquisto' && '🏠 '}{s === 'Vendita' && '🔑 '}{s === 'Investimento' && '📈 '}{s === 'Valutazione' && '🔍 '}{s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CORE FIELDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="sm:col-span-2">
                    <FF label="Indirizzo completo *" placeholder="Via Roma 15" name="indirizzo" value={form.indirizzo} onChange={e => set('indirizzo', e.target.value)} />
                  </div>
                  <FF label="Comune / Città *" placeholder="Milano" name="comune" value={form.comune} onChange={e => set('comune', e.target.value)} />
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo di Proprietà</label>
                    <select value={form.tipoProprietà} onChange={e => set('tipoProprietà', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: '#151525', border: '1px solid #2A2A42' }}>
                      {['Residenziale', 'Commerciale', 'Uffici', 'Industriale / Logistica', 'Hotel', 'Misto', 'Terreno'].map(t => (
                        <option key={t} value={t} style={{ background: '#0D0D1A' }}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <FF label="Superficie (mq) *" placeholder="120" name="superficieMq" type="number" value={form.superficieMq} onChange={e => set('superficieMq', e.target.value)} suffix="mq" />
                  <FF label={form.scopo === 'Vendita' ? 'Prezzo richiesto (€)' : 'Budget / Prezzo (€)'} placeholder="450000" name="prezzoRichiesto" type="number" value={form.prezzoRichiesto} onChange={e => set('prezzoRichiesto', e.target.value)} prefix="€" />
                </div>

                {/* TOGGLE DETAILS */}
                <button type="button" onClick={() => setShowDetails(p => !p)}
                  className="flex items-center gap-2 text-sm transition-colors mb-4"
                  style={{ color: showDetails ? '#F5A623' : '#666' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}>
                    <path d="M2.5 5l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {showDetails ? 'Nascondi dettagli aggiuntivi' : '+ Aggiungi dettagli per un\'analisi più precisa'}
                </button>

                {showDetails && (
                  <div className="animate-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <FF label="N. Camere" placeholder="3" name="camere" type="number" value={form.camere} onChange={e => set('camere', e.target.value)} />
                      <FF label="N. Bagni" placeholder="2" name="bagni" type="number" value={form.bagni} onChange={e => set('bagni', e.target.value)} />
                      <FF label="Piano" placeholder="3" name="piano" value={form.piano} onChange={e => set('piano', e.target.value)} />
                      <FF label="Anno costruzione" placeholder="1990" name="annoCostruzione" type="number" value={form.annoCostruzione} onChange={e => set('annoCostruzione', e.target.value)} />
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Stato manutenzione</label>
                        <select value={form.statoManutenzione} onChange={e => set('statoManutenzione', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: '#151525', border: '1px solid #2A2A42' }}>
                          {['Nuovo / Appena ristrutturato', 'Ottimo', 'Buono', 'Discreto', 'Da ristrutturare'].map(s => (
                            <option key={s} value={s} style={{ background: '#0D0D1A' }}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Classe energetica</label>
                        <select value={form.classeEnergetica} onChange={e => set('classeEnergetica', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: '#151525', border: '1px solid #2A2A42' }}>
                          <option value="" style={{ background: '#0D0D1A' }}>Non specificata</option>
                          {['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => (
                            <option key={c} value={c} style={{ background: '#0D0D1A' }}>Classe {c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(form.scopo === 'Investimento') && (
                      <div className="mb-4">
                        <FF label="Canone locazione stimato (€/mese)" placeholder="1800" name="canoneLocazione" type="number" value={form.canoneLocazione} onChange={e => set('canoneLocazione', e.target.value)} prefix="€" suffix="/mese" />
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Accessori</label>
                      <div className="flex flex-wrap gap-2">
                        {ACCESSORI_LIST.map(a => (
                          <button key={a} type="button" onClick={() => toggleAccessorio(a)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: form.accessori.includes(a) ? 'rgba(76,139,245,0.2)' : '#151525',
                              color: form.accessori.includes(a) ? '#4C8BF5' : '#666',
                              border: form.accessori.includes(a) ? '1px solid rgba(76,139,245,0.4)' : '1px solid #2A2A42',
                            }}>
                            {form.accessori.includes(a) ? '✓ ' : ''}{a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Note aggiuntive</label>
                      <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
                        placeholder="Inquilino attuale, lavori previsti, contesto locale, motivazione vendita..."
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none placeholder-gray-600"
                        style={{ background: '#151525', border: '1px solid #2A2A42' }} />
                    </div>
                  </div>
                )}
              </div>

              {error && <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: 'rgba(255,95,86,0.1)', border: '1px solid rgba(255,95,86,0.3)', color: '#FF7B74' }}>⚠️ {error}</div>}

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-base font-bold transition-all hover:opacity-90 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed glow-gold"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
                🤖 Analizza con AI Agent
              </button>
              <p className="text-center text-xs text-gray-600 mt-2">
                Valutazione · Mercato · Negoziazione · Due Diligence · Piano d&apos;Azione — in 60 secondi
              </p>
            </form>
          )}

          {/* LOADING */}
          {loading && (
            <div className="max-w-lg mx-auto animate-in">
              <div className="p-10 rounded-2xl text-center" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(76,139,245,0.15))' }}>
                  <svg className="animate-spin" width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="17" stroke="rgba(245,166,35,0.25)" strokeWidth="3.5"/>
                    <path d="M20 3a17 17 0 0117 17" stroke="#F5A623" strokeWidth="3.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">AI Agent al lavoro...</h3>
                <p className="text-sm text-gray-500 mb-5">Analisi professionale completa in corso</p>
                <div className="flex flex-col gap-2.5 text-left max-w-xs mx-auto">
                  {['Ricerca comparabili di mercato...', 'Applicazione 3 metodologie di stima...', 'Analisi rischio sismica e ambientale...', 'Elaborazione strategia di negoziazione...', 'Generazione piano d\'azione prioritario...'].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="skeleton w-3.5 h-3.5 rounded-full flex-shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {analysis && !loading && (
            <div className="animate-in">
              {/* RECOMMENDATION BANNER */}
              <div className="mb-5 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{ background: rc.bg, border: `1px solid ${rc.border}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-0.5">Raccomandazione AI Agent</div>
                  <div className="font-black text-3xl mb-1" style={{ color: rc.color }}>{analysis.raccomandazione.decisione}</div>
                  <div className="text-sm text-gray-300 leading-relaxed">{analysis.raccomandazione.motivazione}</div>
                </div>
                <div className="flex gap-5 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-0.5">Score</div>
                    <div className="text-3xl font-black" style={{ color: rc.color }}>{analysis.raccomandazione.punteggio}<span className="text-base">/10</span></div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-0.5">Valore Stimato</div>
                    <div className="text-xl font-black text-white">€{(analysis.valutazione.prezzoStimato || 0).toLocaleString('it-IT')}</div>
                    <div className="text-xs text-gray-500">{(analysis.valutazione.prezzoAlMq || 0).toLocaleString('it-IT')} €/mq</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-0.5">Urgenza</div>
                    <div className="text-sm font-bold capitalize" style={{ color: rc.color }}>{analysis.raccomandazione.urgenza}</div>
                  </div>
                </div>
              </div>

              {/* TABS */}
              <div className="overflow-x-auto mb-5">
                <div className="inline-flex gap-1 rounded-xl p-1 min-w-full sm:min-w-0" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                  {([
                    ['overview', '🏆 Overview'],
                    ['valutazione', '💰 Valutazione'],
                    ['mercato', '📊 Mercato'],
                    ['negoziazione', '🤝 Negoziazione'],
                    ['investimento', '📈 Investimento'],
                    ['piano', '🎯 Piano'],
                  ] as [TabId, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                      style={tab === id ? { background: 'linear-gradient(135deg, #F5A623, #D4891C)', color: '#000' } : { color: '#666' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB CONTENT */}
              <div className="animate-in">

                {/* OVERVIEW */}
                {tab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      <Card title="📝 Sommario Esecutivo">
                        <p className="text-sm text-gray-300 leading-relaxed">{analysis.sommarioEsecutivo}</p>
                      </Card>
                      <Card title="💰 Riepilogo Valutazione">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <Metric label="Valore Stimato" value={`€${(analysis.valutazione.prezzoStimato||0).toLocaleString('it-IT')}`} color="#F5A623" />
                          <Metric label="Range Min" value={`€${(analysis.valutazione.rangeMin||0).toLocaleString('it-IT')}`} color="#4C8BF5" />
                          <Metric label="Range Max" value={`€${(analysis.valutazione.rangeMax||0).toLocaleString('it-IT')}`} color="#A78BFA" />
                          <Metric label="Confidenza" value={`${analysis.valutazione.confidenza||0}%`} color="#27C93F" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#151525' }}>
                          <span className="text-xs text-gray-400">Delta vs mercato zona</span>
                          <span className="text-sm font-bold" style={{ color: (analysis.valutazione.deltaMercato||0) >= 0 ? '#FF5F56' : '#27C93F' }}>
                            {(analysis.valutazione.deltaMercato||0) >= 0 ? '+' : ''}{(analysis.valutazione.deltaMercato||0).toFixed(1)}%
                            <span className="text-xs text-gray-500 ml-1 font-normal">vs €{(analysis.valutazione.prezzoMercatoMq||0).toLocaleString('it-IT')}/mq mercato</span>
                          </span>
                        </div>
                      </Card>
                      <Card title="📊 Mercato in Sintesi">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
                            <div className="text-2xl font-black" style={{ color: tv.color }}>{tv.icon}</div>
                            <div className="text-xs text-gray-400 mt-0.5 capitalize">{analysis.analisiMercato.trend} {analysis.analisiMercato.intensita}</div>
                          </div>
                          <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
                            <div className="text-xl font-black text-white">{analysis.analisiMercato.velocitaVenditaGiorni}gg</div>
                            <div className="text-xs text-gray-400 mt-0.5">Velocità vendita</div>
                          </div>
                          <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
                            <div className="text-xl font-black text-white">{(analysis.analisiMercato.domandaOffertaRatio||0).toFixed(1)}x</div>
                            <div className="text-xs text-gray-400 mt-0.5">Domanda/Offerta</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Card title="⚠️ DD Pre-screening">
                        <div className="flex flex-col gap-2">
                          {analysis.dueDiligenceRischi?.map((r, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: '#151525' }}>
                              <span className="text-xs text-gray-300">{r.emoji} {r.area}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: riskColors[r.rischio]?.bg || '#1E1E30', color: riskColors[r.rischio]?.color || '#888' }}>{r.rischio}</span>
                            </div>
                          ))}
                        </div>
                        <Link href="/due-diligence" className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-center block transition-all hover:bg-white/5" style={{ border: '1px solid rgba(76,139,245,0.3)', color: '#4C8BF5' }}>
                          → Analisi DD Completa
                        </Link>
                      </Card>
                      <Card title="💼 Costi Transazione">
                        <div className="flex flex-col gap-1.5 text-xs">
                          {[
                            ['Imposte registro', analysis.costiTransazione?.imposteRegistro],
                            ['Notarile', analysis.costiTransazione?.notarile],
                            ['Perizia', analysis.costiTransazione?.perizia],
                            ['Agenzia (3%)', analysis.costiTransazione?.agenzia],
                          ].map(([label, val], i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-gray-500">{label as string}</span>
                              <span className="text-gray-300">€{((val as number)||0).toLocaleString('it-IT')}</span>
                            </div>
                          ))}
                          <div className="pt-2 mt-1 flex justify-between font-bold" style={{ borderTop: '1px solid #1E1E30' }}>
                            <span className="text-gray-200">Totale stimato</span>
                            <span style={{ color: '#F5A623' }}>€{(analysis.costiTransazione?.totale||0).toLocaleString('it-IT')}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{analysis.costiTransazione?.note}</p>
                      </Card>
                      <button onClick={() => { setAnalysis(null); setForm(initial); setShowDetails(false) }}
                        className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5" style={{ border: '1px solid #1E1E30', color: '#888' }}>
                        ← Nuova Analisi
                      </button>
                    </div>
                  </div>
                )}

                {/* VALUTAZIONE */}
                {tab === 'valutazione' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                      <Card title="🏗️ Tre Metodologie di Stima">
                        {[
                          { key: 'metodoComparativo', label: 'Metodo Comparativo', color: '#F5A623', desc: 'Market Approach' },
                          { key: 'metodoReddituale', label: 'Metodo Reddituale', color: '#4C8BF5', desc: 'Income Approach' },
                          { key: 'metodoCosto', label: 'Metodo del Costo', color: '#A78BFA', desc: 'Cost Approach' },
                        ].map(({ key, label, color, desc }) => {
                          const m = analysis.valutazione[key as keyof typeof analysis.valutazione] as { valore: number; peso: number; descrizione: string }
                          return (
                            <div key={key} className="p-4 rounded-xl mb-3" style={{ background: '#151525' }}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="text-sm font-bold text-white">{label}</span>
                                  <span className="text-xs text-gray-600 ml-2">{desc}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-black" style={{ color }}>€{(m?.valore||0).toLocaleString('it-IT')}</div>
                                  <div className="text-xs text-gray-600">peso {m?.peso||0}%</div>
                                </div>
                              </div>
                              <div className="w-full h-1.5 rounded-full mb-2" style={{ background: '#1E1E30' }}>
                                <div className="h-full rounded-full" style={{ width: `${m?.peso||0}%`, background: color }} />
                              </div>
                              <p className="text-xs text-gray-500">{m?.descrizione}</p>
                            </div>
                          )
                        })}
                      </Card>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Card title="📊 Range di Valore">
                        <div className="relative py-6 px-4">
                          <div className="flex items-end justify-between mb-2 text-xs text-gray-500">
                            <span>Min: €{(analysis.valutazione.rangeMin||0).toLocaleString('it-IT')}</span>
                            <span>Max: €{(analysis.valutazione.rangeMax||0).toLocaleString('it-IT')}</span>
                          </div>
                          <div className="relative h-4 rounded-full overflow-hidden" style={{ background: '#1E1E30' }}>
                            <div className="absolute h-full rounded-full" style={{ left: '10%', right: '10%', background: 'linear-gradient(90deg, rgba(76,139,245,0.4), rgba(245,166,35,0.6), rgba(76,139,245,0.4))' }} />
                            <div className="absolute top-0 h-full w-0.5" style={{ left: '50%', background: '#F5A623' }} />
                          </div>
                          <div className="text-center mt-3">
                            <div className="text-2xl font-black text-white">€{(analysis.valutazione.prezzoStimato||0).toLocaleString('it-IT')}</div>
                            <div className="text-xs text-gray-400">Valore centrale — confidenza {analysis.valutazione.confidenza}%</div>
                          </div>
                        </div>
                      </Card>
                      <Card title="✅ Fattori Positivi">
                        <div className="flex flex-col gap-1.5">
                          {analysis.valutazione.fattoriPositivi?.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="flex-shrink-0 text-green-400">+</span>{f}
                            </div>
                          ))}
                        </div>
                      </Card>
                      <Card title="⚠️ Fattori Negativi">
                        <div className="flex flex-col gap-1.5">
                          {analysis.valutazione.fattoriNegativi?.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="flex-shrink-0 text-red-400">−</span>{f}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* MERCATO */}
                {tab === 'mercato' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                      <Card title="📈 Analisi di Mercato">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <Metric label="Prezz. Medio Zona" value={`€${(analysis.analisiMercato.prezzoMedioZona||0).toLocaleString('it-IT')}/mq`} color="#4C8BF5" />
                          <Metric label="Velocità Vendita" value={`${analysis.analisiMercato.velocitaVenditaGiorni} gg`} color="#F5A623" />
                          <Metric label="Domanda/Offerta" value={`${(analysis.analisiMercato.domandaOffertaRatio||0).toFixed(2)}x`} color="#A78BFA" />
                          <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
                            <div className="text-xl font-black" style={{ color: tv.color }}>{tv.icon} {analysis.analisiMercato.trend}</div>
                            <div className="text-xs text-gray-500 mt-0.5 capitalize">{analysis.analisiMercato.intensita}</div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl mb-3" style={{ background: '#151525' }}>
                          <div className="text-xs font-semibold text-gray-400 mb-1">Tendenza 12 Mesi</div>
                          <p className="text-sm text-gray-300">{analysis.analisiMercato.tendenza12Mesi}</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: '#151525' }}>
                          <div className="text-xs font-semibold text-gray-400 mb-1">💡 Stagionalità</div>
                          <p className="text-sm text-gray-300">{analysis.analisiMercato.stagionalita}</p>
                        </div>
                      </Card>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Card title="🔍 Comparabili di Mercato">
                        <div className="flex flex-col gap-3">
                          {analysis.comparabili?.map((c, i) => (
                            <div key={i} className="p-3 rounded-xl" style={{ background: '#151525' }}>
                              <div className="flex items-start justify-between mb-1">
                                <div className="font-medium text-sm text-white flex-1">{c.descrizione}</div>
                                <div className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: (c.rettifica||0) >= 0 ? '#FF5F56' : '#27C93F' }}>
                                  {(c.rettifica||0) >= 0 ? '+' : ''}{(c.rettifica||0).toFixed(1)}%
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span className="font-bold text-white">€{(c.prezzo||0).toLocaleString('it-IT')}</span>
                                <span>€{(c.prezzoMq||0).toLocaleString('it-IT')}/mq</span>
                                <span>{c.metratura||0} mq</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{c.caratteristiche}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* NEGOZIAZIONE */}
                {tab === 'negoziazione' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                      <Card title="🎯 Strategia di Prezzo">
                        <div className="flex flex-col gap-3 mb-4">
                          {[
                            { label: 'Prezzo Listino Consigliato', value: analysis.strategiaNegoziazione.prezzoListinoConsigliato, color: '#F5A623', icon: '📌' },
                            { label: 'Offerta Iniziale', value: analysis.strategiaNegoziazione.offertaIniziale, color: '#4C8BF5', icon: '🚀' },
                            { label: 'Target Accordo', value: analysis.strategiaNegoziazione.targetFinale, color: '#27C93F', icon: '✅' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#151525', border: `1px solid ${item.color}22` }}>
                              <div>
                                <div className="text-xs text-gray-400">{item.icon} {item.label}</div>
                                <div className="text-xl font-black text-white mt-0.5">€{(item.value||0).toLocaleString('it-IT')}</div>
                              </div>
                              <div className="w-2 h-8 rounded-full" style={{ background: item.color }} />
                            </div>
                          ))}
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: '#151525' }}>
                          <div className="text-xs font-semibold text-gray-400 mb-1">Margine di negoziazione</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full" style={{ background: '#1E1E30' }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min((analysis.strategiaNegoziazione.margineNegoziazione||0) * 5, 100)}%`, background: '#F5A623' }} />
                            </div>
                            <span className="text-sm font-bold text-white">{(analysis.strategiaNegoziazione.margineNegoziazione||0).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="mt-3 p-3 rounded-xl" style={{ background: '#151525' }}>
                          <div className="text-xs font-semibold text-gray-400 mb-1">⏰ Timeline</div>
                          <p className="text-sm text-gray-300">{analysis.strategiaNegoziazione.timelineConsigliata}</p>
                        </div>
                      </Card>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Card title="💪 Punti di Forza">
                        <div className="flex flex-col gap-1.5">
                          {analysis.strategiaNegoziazione.puntiForza?.map((p, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span style={{ color: '#27C93F' }} className="flex-shrink-0">✓</span>{p}
                            </div>
                          ))}
                        </div>
                      </Card>
                      <Card title="⚠️ Punti di Attenzione">
                        <div className="flex flex-col gap-1.5">
                          {analysis.strategiaNegoziazione.puntiDebolezza?.map((p, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span style={{ color: '#FFBD2E' }} className="flex-shrink-0">!</span>{p}
                            </div>
                          ))}
                        </div>
                      </Card>
                      <Card title="🧠 Argomentazioni & Tattiche">
                        <div className="flex flex-col gap-1.5 mb-3">
                          {analysis.strategiaNegoziazione.argomentazioni?.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="font-bold text-xs flex-shrink-0" style={{ color: '#4C8BF5' }}>A{i+1}</span>{a}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {analysis.strategiaNegoziazione.tattiche?.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="font-bold text-xs flex-shrink-0" style={{ color: '#A78BFA' }}>T{i+1}</span>{t}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* INVESTIMENTO */}
                {tab === 'investimento' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4">
                      <Card title="📈 Rendimento Stimato">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <Metric label="Rendimento Lordo" value={`${(analysis.analisiInvestimento.rendimentoLordo||0).toFixed(2)}%`} color="#F5A623" />
                          <Metric label="Rendimento Netto" value={`${(analysis.analisiInvestimento.rendimentoNetto||0).toFixed(2)}%`} color="#27C93F" />
                          <Metric label="Cap Rate" value={`${(analysis.analisiInvestimento.capRateStimato||0).toFixed(2)}%`} color="#4C8BF5" />
                          <Metric label="Payback" value={`${analysis.analisiInvestimento.paybackAnni||0} anni`} color="#A78BFA" />
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: '#151525', border: `1px solid ${analysis.analisiInvestimento.opportunita === 'eccellente' ? 'rgba(39,201,63,0.3)' : analysis.analisiInvestimento.opportunita === 'buona' ? 'rgba(245,166,35,0.3)' : '#2A2A42'}` }}>
                          <div className="text-xs text-gray-400 mb-1">Opportunità d&apos;Investimento</div>
                          <div className="text-lg font-black capitalize mb-1"
                            style={{ color: analysis.analisiInvestimento.opportunita === 'eccellente' ? '#27C93F' : analysis.analisiInvestimento.opportunita === 'buona' ? '#F5A623' : analysis.analisiInvestimento.opportunita === 'discreta' ? '#FFBD2E' : '#FF5F56' }}>
                            {analysis.analisiInvestimento.opportunita}
                          </div>
                          <p className="text-sm text-gray-300">{analysis.analisiInvestimento.motivazioneInvestimento}</p>
                        </div>
                      </Card>
                      <Card title="🏠 Canone di Locazione Stimato">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
                            <div className="text-lg font-black text-white">€{(analysis.analisiInvestimento.canoneStimato?.min||0).toLocaleString('it-IT')}</div>
                            <div className="text-xs text-gray-500">Min/mese</div>
                          </div>
                          <div className="p-3 rounded-xl text-center" style={{ background: '#151525', border: '1px solid rgba(245,166,35,0.3)' }}>
                            <div className="text-lg font-black" style={{ color: '#F5A623' }}>€{(analysis.analisiInvestimento.canoneStimato?.mediano||0).toLocaleString('it-IT')}</div>
                            <div className="text-xs text-gray-500">Mediano/mese</div>
                          </div>
                          <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
                            <div className="text-lg font-black text-white">€{(analysis.analisiInvestimento.canoneStimato?.max||0).toLocaleString('it-IT')}</div>
                            <div className="text-xs text-gray-500">Max/mese</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Card title="🚀 Proiezione 5 Anni">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <Metric label="Apprezzamento" value={`+${(analysis.analisiInvestimento.proiezione5Anni?.apprezzamento||0).toFixed(1)}%`} color="#27C93F" />
                          <Metric label="Rendimento Totale" value={`+${(analysis.analisiInvestimento.proiezione5Anni?.rendimentoTotale||0).toFixed(1)}%`} color="#F5A623" />
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: '#151525' }}>
                          <div className="text-xs text-gray-400 mb-2">Simulazione valore futuro</div>
                          {[1, 2, 3, 5].map(yr => {
                            const apprPct = analysis.analisiInvestimento.proiezione5Anni?.apprezzamento || 0
                            const annualRate = Math.pow(1 + apprPct / 100, 1/5) - 1
                            const futureVal = Math.round((analysis.valutazione.prezzoStimato || 0) * Math.pow(1 + annualRate, yr))
                            const pct = (yr / 5) * 100
                            return (
                              <div key={yr} className="flex items-center gap-3 mb-2">
                                <span className="text-xs text-gray-500 w-12">Anno {yr}</span>
                                <div className="flex-1 h-1.5 rounded-full" style={{ background: '#1E1E30' }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4C8BF5, #27C93F)' }} />
                                </div>
                                <span className="text-xs font-bold text-white w-24 text-right">€{futureVal.toLocaleString('it-IT')}</span>
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                      <Card title="⚠️ Due Diligence Rischi">
                        <div className="flex flex-col gap-2">
                          {analysis.dueDiligenceRischi?.map((r, i) => (
                            <div key={i} className="p-3 rounded-xl" style={{ background: '#151525' }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-white">{r.emoji} {r.area}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: riskColors[r.rischio]?.bg || '#1E1E30', color: riskColors[r.rischio]?.color || '#888' }}>{r.rischio}</span>
                              </div>
                              <p className="text-xs text-gray-500">{r.azione}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {/* PIANO D'AZIONE */}
                {tab === 'piano' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <Card title="🎯 Piano d'Azione Prioritario">
                        <div className="flex flex-col gap-3">
                          {analysis.pianoAzione?.map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: '#151525' }}>
                              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm"
                                style={{ background: i === 0 ? 'linear-gradient(135deg, #F5A623, #D4891C)' : i <= 2 ? 'linear-gradient(135deg, #4C8BF5, #3A7BD5)' : '#2A2A42', color: i <= 2 ? '#fff' : '#888' }}>
                                {item.priorita}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white text-sm mb-0.5">{item.azione}</div>
                                <p className="text-xs text-gray-500 mb-2">{item.perché}</p>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(76,139,245,0.1)', color: '#4C8BF5', border: '1px solid rgba(76,139,245,0.2)' }}>
                                    ⏱ {item.timing}
                                  </span>
                                  {(item.costo || 0) > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.2)' }}>
                                      💰 €{(item.costo||0).toLocaleString('it-IT')}
                                    </span>
                                  )}
                                  {(item.costo || 0) === 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(39,201,63,0.1)', color: '#27C93F', border: '1px solid rgba(39,201,63,0.2)' }}>
                                      ✓ Gratuito
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                    <div className="flex flex-col gap-4">
                      <Card title="💼 Costi Totali Stimati">
                        <div className="flex flex-col gap-2 text-sm mb-4">
                          {[
                            ['Imposte', analysis.costiTransazione?.imposteRegistro],
                            ['Notarile', analysis.costiTransazione?.notarile],
                            ['Perizia', analysis.costiTransazione?.perizia],
                            ['Agenzia', analysis.costiTransazione?.agenzia],
                          ].map(([l, v], i) => (
                            <div key={i} className="flex justify-between">
                              <span className="text-gray-500 text-xs">{l as string}</span>
                              <span className="text-gray-300 text-xs">€{((v as number)||0).toLocaleString('it-IT')}</span>
                            </div>
                          ))}
                          <div className="pt-2 mt-1 flex justify-between font-bold text-sm" style={{ borderTop: '1px solid #1E1E30' }}>
                            <span className="text-gray-200">Totale</span>
                            <span style={{ color: '#F5A623' }}>€{(analysis.costiTransazione?.totale||0).toLocaleString('it-IT')}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">{analysis.costiTransazione?.note}</p>
                      </Card>
                      <Card title="🔗 Prossimi Strumenti">
                        <div className="flex flex-col gap-2">
                          <Link href="/due-diligence" className="p-3 rounded-xl flex items-center gap-2 transition-all hover:bg-white/5 group" style={{ border: '1px solid rgba(76,139,245,0.25)' }}>
                            <span className="text-lg">🔍</span>
                            <div>
                              <div className="text-sm font-medium text-blue-400 group-hover:text-blue-300">Due Diligence Completa</div>
                              <div className="text-xs text-gray-600">8 aree, checklist, report AI</div>
                            </div>
                          </Link>
                          <Link href="/analyze" className="p-3 rounded-xl flex items-center gap-2 transition-all hover:bg-white/5 group" style={{ border: '1px solid rgba(245,166,35,0.25)' }}>
                            <span className="text-lg">📊</span>
                            <div>
                              <div className="text-sm font-medium text-yellow-400 group-hover:text-yellow-300">Analisi Deal Investor</div>
                              <div className="text-xs text-gray-600">Cap rate, NOI, value-add</div>
                            </div>
                          </Link>
                        </div>
                      </Card>
                      <button onClick={() => { setAnalysis(null); setForm(initial); setShowDetails(false) }}
                        className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5" style={{ border: '1px solid #1E1E30', color: '#888' }}>
                        ← Nuova Analisi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FF({ label, name, placeholder, value, onChange, type = 'text', prefix, suffix }: {
  label: string; name: string; placeholder: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; prefix?: string; suffix?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-gray-500 pointer-events-none">{prefix}</span>}
        <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full py-2.5 rounded-xl text-sm text-white placeholder-gray-600 ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-14' : 'pr-3'}`}
          style={{ background: '#151525', border: '1px solid #2A2A42' }} />
        {suffix && <span className="absolute right-3 text-xs text-gray-500 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
      <h3 className="font-bold text-white text-sm mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
      <div className="text-xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
    </div>
  )
}
