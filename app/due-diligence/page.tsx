'use client'

import { useState } from 'react'
import Link from 'next/link'

type DDArea = {
  id: string
  nome: string
  emoji: string
  stato: 'OK' | 'Attenzione' | 'Critico'
  rischio: 'Basso' | 'Medio' | 'Alto'
  sommario: string
  findings: string[]
  azioniRichieste: string[]
  documentiNecessari: string[]
  tempoStimato: string
  costoStimato: number
}

type DDAnalysis = {
  aree: DDArea[]
  valutazioneGlobale: string
  raccomandazione: string
  punteggio: number
  motivazioneRaccomandazione: string
  redFlagsCritici: string[]
  prioritaAzioni: string[]
  tempoTotaleStimato: string
  costoTotaleMin: number
  costoTotaleMax: number
}

const CHECKLIST_AREE = [
  {
    id: 'legale',
    nome: 'Legale & Catastale',
    emoji: '⚖️',
    items: [
      'Visura catastale (Agenzia Entrate)',
      'Ispezione ipotecaria e pesi/vincoli',
      'Verifica titolarità e provenienza',
      'Controllo diritti di terzi (servitù, usufrutto)',
    ],
  },
  {
    id: 'urbanistica',
    nome: 'Urbanistica & Edilizia',
    emoji: '🏗️',
    items: [
      'Conformità urbanistica (PRG/PUG)',
      'Verifica abusi edilizi (Comune)',
      'Certificato di agibilità/abitabilità',
      'Conformità impianti (L.46/90, D.Lgs 37/08)',
    ],
  },
  {
    id: 'ambientale',
    nome: 'Ambientale',
    emoji: '🌿',
    items: [
      'Siti contaminati ISPRA/ARPA',
      'Verifica presenza amianto',
      'Misurazione radon (D.Lgs 101/2020)',
      'Rischio idrogeologico (PAI)',
    ],
  },
  {
    id: 'strutturale',
    nome: 'Strutturale & Sismica',
    emoji: '🏛️',
    items: [
      'Classificazione sismica INGV (NTC 2018)',
      'Perizia strutturale fondazioni',
      'Relazione geologica',
    ],
  },
  {
    id: 'energetica',
    nome: 'Energetica',
    emoji: '⚡',
    items: [
      'APE (D.Lgs 192/2005) — classe energetica',
      'Verifica impianti termici e riscaldamento',
    ],
  },
  {
    id: 'condominiale',
    nome: 'Condominiale',
    emoji: '🏢',
    items: [
      'Quote condominiali arretrate',
      'Verbali assemblea ultimi 3 anni',
      'Fondo di riserva (art. 1135 c.c.)',
    ],
  },
  {
    id: 'esg',
    nome: 'ESG & Governance',
    emoji: '🌱',
    items: [
      'Verifica zone protette/vincoli paesaggistici',
      'Analisi affittuari e contratti in corso',
      'Governance e struttura proprietaria',
    ],
  },
  {
    id: 'fiscale',
    nome: 'Fiscale & Finanziaria',
    emoji: '💰',
    items: [
      'IMU e TARI arretrati',
      'Pignoramenti fiscali (Agenzia Entrate)',
      'Verifica rendita catastale',
    ],
  },
]

const DATABASE_UFFICIALI = [
  { nome: 'Agenzia Entrate — Visure Catastali', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/consultazione-visure-catastali', desc: 'Visure catastali, ispezioni ipotecarie, rendita catastale' },
  { nome: 'ISPRA — Siti Contaminati', url: 'https://www.isprambiente.gov.it/it/banche-dati/banche-dati-del-suolo', desc: 'Anagrafe siti contaminati, banche dati ambientali' },
  { nome: 'INGV — Rischio Sismico', url: 'https://www.ingv.it/it/rischio-sismico', desc: 'Classificazione sismica dei comuni, NTC 2018' },
  { nome: 'ENEA — APE e Classe Energetica', url: 'https://www.efficienzaenergetica.enea.it/servizi-per-i-cittadini/attestato-di-prestazione-energetica.html', desc: 'Attestati di Prestazione Energetica, D.Lgs 192/2005' },
  { nome: 'OMI — Osservatorio Mercato Immobiliare', url: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/omi', desc: 'Quotazioni immobiliari per zona e tipologia' },
  { nome: 'Portale Mappe ISPRA — Idrogeologico', url: 'https://www.isprambiente.gov.it/it/progetti/suolo-e-territorio/la-carta-della-natura', desc: 'Rischio idrogeologico, PAI (Piano Assetto Idrogeologico)' },
]

const TIMELINE = [
  { settimana: 'Settimana 1', titolo: 'Legale & Documentazione', attività: ['Visura catastale', 'Ispezione ipotecaria', 'Raccolta titoli di proprietà', 'Verifica PRG/PUG'], color: '#4C8BF5' },
  { settimana: 'Settimana 2', titolo: 'Tecnica & Ambientale', attività: ['Sopralluogo strutturale', 'Verifica abusi edilizi', 'Analisi rischio ambientale', 'APE e impianti'], color: '#F5A623' },
  { settimana: 'Settimana 3', titolo: 'Sismica & Urbanistica', attività: ['Classificazione sismica', 'Perizia geologica', 'Conformità urbanistica', 'Agibilità'], color: '#A78BFA' },
  { settimana: 'Settimana 4', titolo: 'Fiscale & Chiusura', attività: ['Verifica IMU/TARI', 'Pignoramenti', 'Condominiale', 'Report finale'], color: '#27C93F' },
]

const statoConfig = {
  OK: { bg: 'rgba(39,201,63,0.15)', color: '#27C93F', border: 'rgba(39,201,63,0.3)', icon: '✓' },
  Attenzione: { bg: 'rgba(255,189,46,0.15)', color: '#FFBD2E', border: 'rgba(255,189,46,0.3)', icon: '!' },
  Critico: { bg: 'rgba(255,95,86,0.15)', color: '#FF5F56', border: 'rgba(255,95,86,0.3)', icon: '✕' },
}

const raccConfig: Record<string, { bg: string; color: string; border: string }> = {
  'PROCEDI': { bg: 'rgba(39,201,63,0.12)', color: '#27C93F', border: 'rgba(39,201,63,0.3)' },
  'PROCEDI CON CAUTELA': { bg: 'rgba(255,189,46,0.12)', color: '#FFBD2E', border: 'rgba(255,189,46,0.3)' },
  'STOP': { bg: 'rgba(255,95,86,0.12)', color: '#FF5F56', border: 'rgba(255,95,86,0.3)' },
}

export default function DueDiligencePage() {
  const [form, setForm] = useState({ indirizzo: '', tipoProprietà: 'Residenziale', comune: '', foglioParticella: '', superficie: '', noteAggiuntive: '' })
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [expandedArea, setExpandedArea] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<DDAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form')
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  function toggleCheck(item: string) {
    setChecks(prev => ({ ...prev, [item]: !prev[item] }))
  }

  function toggleArea(id: string) {
    setExpandedArea(prev => prev === id ? null : id)
  }

  function selectAll(areaId: string) {
    const area = CHECKLIST_AREE.find(a => a.id === areaId)
    if (!area) return
    const allChecked = area.items.every(item => checks[item])
    const updated = { ...checks }
    area.items.forEach(item => { updated[item] = !allChecked })
    setChecks(updated)
  }

  const totalChecked = Object.values(checks).filter(Boolean).length
  const totalItems = CHECKLIST_AREE.reduce((sum, a) => sum + a.items.length, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.indirizzo || !form.comune) {
      setError('Compila almeno Indirizzo e Comune')
      return
    }
    setError(null)
    setLoading(true)
    setAnalysis(null)
    try {
      const checksSelezionati = Object.entries(checks).filter(([, v]) => v).map(([k]) => k)
      const res = await fetch('/api/due-diligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, checksSelezionati }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Errore ${res.status}`) }
      const data = await res.json()
      setAnalysis(data)
      setActiveTab('results')
      setExpandedResult(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#05050B' }}>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,5,11,0.90)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(30,30,48,0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" fill="white"/></svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Rial<span className="text-gradient-gold">Agent</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/analyze" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Analisi Deal</Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* HEADER */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(76,139,245,0.1)', border: '1px solid rgba(76,139,245,0.25)', color: '#4C8BF5' }}>
              🔍 Due Diligence Immobiliare Italia
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Due Diligence <span className="text-gradient-blue">Professionale</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Framework completo per la verifica immobiliare in Italia — 8 aree di analisi, checklist operativa,
              database ufficiali e report AI generato in 60 secondi.
            </p>
          </div>

          {/* TABS */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl p-1" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
              {(['form', 'results'] as const).map(tab => (
                <button key={tab} onClick={() => analysis && setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-white'} ${!analysis && tab === 'results' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={activeTab === tab ? { background: 'linear-gradient(135deg, #4C8BF5, #3A7BD5)' } : {}}>
                  {tab === 'form' ? '📋 Proprietà & Checklist' : '🔍 Report DD AI'}
                  {tab === 'results' && analysis && <span className="ml-1.5 w-2 h-2 rounded-full bg-blue-400 inline-block" />}
                </button>
              ))}
            </div>
          </div>

          {/* FORM TAB */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="animate-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: PROPERTY FORM */}
                <div className="lg:col-span-1 flex flex-col gap-5">
                  <div className="rounded-2xl p-6" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                    <h2 className="font-bold text-white mb-5 flex items-center gap-2"><span>🏠</span> Dati Proprietà</h2>
                    <div className="flex flex-col gap-4">
                      <FF label="Indirizzo *" placeholder="Via Roma 15, Milano" name="indirizzo" value={form.indirizzo} onChange={e => setForm(p => ({ ...p, indirizzo: e.target.value }))} />
                      <FF label="Comune *" placeholder="Milano" name="comune" value={form.comune} onChange={e => setForm(p => ({ ...p, comune: e.target.value }))} />
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo di Proprietà</label>
                        <select value={form.tipoProprietà} onChange={e => setForm(p => ({ ...p, tipoProprietà: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white" style={{ background: '#151525', border: '1px solid #2A2A42' }}>
                          {['Residenziale','Commerciale','Uffici','Industriale / Logistica','Hotel','Misto','Terreno'].map(t => (
                            <option key={t} value={t} style={{ background: '#0D0D1A' }}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <FF label="Foglio/Particella Catastale" placeholder="Fg. 12 - Part. 345" name="foglioParticella" value={form.foglioParticella} onChange={e => setForm(p => ({ ...p, foglioParticella: e.target.value }))} />
                      <FF label="Superficie (mq)" placeholder="850" name="superficie" type="number" value={form.superficie} onChange={e => setForm(p => ({ ...p, superficie: e.target.value }))} />
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Note</label>
                        <textarea value={form.noteAggiuntive} onChange={e => setForm(p => ({ ...p, noteAggiuntive: e.target.value }))} rows={3}
                          placeholder="Stato proprietà, inquilini, lavori previsti..."
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white resize-none placeholder-gray-600"
                          style={{ background: '#151525', border: '1px solid #2A2A42' }} />
                      </div>
                    </div>
                  </div>

                  {/* DATABASES */}
                  <div className="rounded-2xl p-6" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                    <h2 className="font-bold text-white mb-4 flex items-center gap-2"><span>🔗</span> Database Ufficiali</h2>
                    <div className="flex flex-col gap-2">
                      {DATABASE_UFFICIALI.map((db, i) => (
                        <a key={i} href={db.url} target="_blank" rel="noopener noreferrer"
                          className="group flex items-start gap-2.5 p-2.5 rounded-lg transition-all hover:bg-white/5"
                          style={{ border: '1px solid transparent' }}>
                          <svg className="flex-shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6h8M6 2l4 4-4 4" stroke="#4C8BF5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <div>
                            <div className="text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors">{db.nome}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{db.desc}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT: CHECKLIST */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-bold text-white flex items-center gap-2"><span>✅</span> Checklist Operativa</h2>
                    <div className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(76,139,245,0.1)', color: '#4C8BF5', border: '1px solid rgba(76,139,245,0.2)' }}>
                      {totalChecked}/{totalItems} verifiche selezionate
                    </div>
                  </div>

                  {CHECKLIST_AREE.map(area => {
                    const areaChecked = area.items.filter(item => checks[item]).length
                    const isExpanded = expandedArea === area.id
                    return (
                      <div key={area.id} className="rounded-2xl overflow-hidden" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                        <button type="button" onClick={() => toggleArea(area.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{area.emoji}</span>
                            <div className="text-left">
                              <div className="font-semibold text-white text-sm">{area.nome}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{areaChecked}/{area.items.length} verifiche</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {areaChecked > 0 && (
                              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#1E1E30' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${(areaChecked / area.items.length) * 100}%`, background: '#4C8BF5' }} />
                              </div>
                            )}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              <path d="M4 6l4 4 4-4" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4" style={{ borderTop: '1px solid #1E1E30' }}>
                            <div className="flex justify-end mt-3 mb-2">
                              <button type="button" onClick={() => selectAll(area.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                {area.items.every(i => checks[i]) ? 'Deseleziona tutti' : 'Seleziona tutti'}
                              </button>
                            </div>
                            <div className="flex flex-col gap-2">
                              {area.items.map(item => (
                                <label key={item} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/3 transition-all" style={{ border: '1px solid transparent' }}>
                                  <div
                                    onClick={() => toggleCheck(item)}
                                    className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all cursor-pointer"
                                    style={{
                                      background: checks[item] ? 'linear-gradient(135deg, #4C8BF5, #3A7BD5)' : '#151525',
                                      border: checks[item] ? 'none' : '1px solid #2A2A42',
                                    }}>
                                    {checks[item] && (
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-300">{item}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {error && <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,95,86,0.1)', border: '1px solid rgba(255,95,86,0.3)', color: '#FF7B74' }}>⚠️ {error}</div>}

                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-xl text-base font-bold transition-all hover:opacity-90 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #4C8BF5 0%, #3A7BD5 100%)', color: '#fff' }}>
                    {loading
                      ? (<><svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Analisi in corso...</>)
                      : (<>🔍 Genera Report Due Diligence AI</>)}
                  </button>
                  <p className="text-center text-xs text-gray-600">Report generato da Claude AI · Include tutte le 8 aree di verifica</p>
                </div>
              </div>
            </form>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && analysis && (
            <div className="animate-in">
              {/* RECOMMENDATION BANNER */}
              <div className="max-w-4xl mx-auto mb-6 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{
                  background: raccConfig[analysis.raccomandazione]?.bg || 'rgba(76,139,245,0.1)',
                  border: `1px solid ${raccConfig[analysis.raccomandazione]?.border || 'rgba(76,139,245,0.3)'}`,
                }}>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">Raccomandazione Due Diligence</div>
                  <div className="font-black text-2xl" style={{ color: raccConfig[analysis.raccomandazione]?.color || '#4C8BF5' }}>{analysis.raccomandazione}</div>
                  <div className="text-sm text-gray-300 mt-1">{analysis.motivazioneRaccomandazione}</div>
                </div>
                <div className="flex gap-4 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Score DD</div>
                    <div className="text-3xl font-black" style={{ color: raccConfig[analysis.raccomandazione]?.color || '#4C8BF5' }}>{analysis.punteggio}<span className="text-lg">/10</span></div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Tempo</div>
                    <div className="text-sm font-bold text-white">{analysis.tempoTotaleStimato}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Costo Est.</div>
                    <div className="text-sm font-bold text-white">€{(analysis.costoTotaleMin||0).toLocaleString('it-IT')}–{(analysis.costoTotaleMax||0).toLocaleString('it-IT')}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                {/* LEFT: DD AREAS */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2"><span>📋</span> Report per Area</h3>
                  {analysis.aree?.map(area => {
                    const sc = statoConfig[area.stato] || statoConfig['OK']
                    const isOpen = expandedResult === area.id
                    return (
                      <div key={area.id} className="rounded-2xl overflow-hidden" style={{ background: '#0D0D1A', border: `1px solid ${isOpen ? sc.border : '#1E1E30'}` }}>
                        <button type="button" onClick={() => setExpandedResult(isOpen ? null : area.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{area.emoji}</span>
                            <div className="text-left">
                              <div className="font-semibold text-white text-sm">{area.nome}</div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{area.sommario}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {area.stato}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#151525', color: '#888' }}>
                              {area.rischio === 'Alto' ? '🔴' : area.rischio === 'Medio' ? '🟡' : '🟢'} {area.rischio}
                            </span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                              <path d="M3.5 5.25l3.5 3.5 3.5-3.5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4" style={{ borderTop: `1px solid ${sc.border}` }}>
                            <div className="flex gap-3 mt-3 mb-2 text-xs">
                              <span style={{ color: '#888' }}>⏱ {area.tempoStimato}</span>
                              <span style={{ color: '#888' }}>💰 €{(area.costoStimato||0).toLocaleString('it-IT')} stimati</span>
                            </div>
                            {area.findings?.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-semibold text-gray-400 mb-2">📌 Findings</div>
                                <div className="flex flex-col gap-1.5">
                                  {area.findings.map((f, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                      <span className="flex-shrink-0 mt-0.5" style={{ color: sc.color }}>•</span>
                                      {f}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {area.azioniRichieste?.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-semibold text-gray-400 mb-2">⚡ Azioni Richieste</div>
                                <div className="flex flex-col gap-1.5">
                                  {area.azioniRichieste.map((a, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                      <span className="flex-shrink-0 font-bold text-xs mt-0.5" style={{ color: '#F5A623' }}>{i + 1}.</span>
                                      {a}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {area.documentiNecessari?.length > 0 && (
                              <div className="p-3 rounded-xl" style={{ background: '#151525' }}>
                                <div className="text-xs font-semibold text-gray-400 mb-2">📄 Documenti Necessari</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {area.documentiNecessari.map((d, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(76,139,245,0.1)', color: '#4C8BF5', border: '1px solid rgba(76,139,245,0.2)' }}>{d}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* RIGHT: SIDEBAR */}
                <div className="flex flex-col gap-5">
                  {/* VALUTAZIONE GLOBALE */}
                  <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                    <h3 className="font-bold text-white mb-3 text-sm">📝 Valutazione Globale</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{analysis.valutazioneGlobale}</p>
                  </div>

                  {/* RED FLAGS */}
                  {analysis.redFlagsCritici?.length > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,95,86,0.05)', border: '1px solid rgba(255,95,86,0.3)' }}>
                      <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#FF5F56' }}>🚨 Red Flag Critici</h3>
                      <div className="flex flex-col gap-2">
                        {analysis.redFlagsCritici.map((rf, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#FF7B74' }}>
                            <span className="flex-shrink-0">⚠</span>{rf}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PRIORITA AZIONI */}
                  <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                    <h3 className="font-bold text-white mb-3 text-sm">🎯 Priorità Azioni</h3>
                    <div className="flex flex-col gap-2">
                      {analysis.prioritaAzioni?.map((a, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: '#151525' }}>
                          <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: 'linear-gradient(135deg, #4C8BF5, #3A7BD5)', color: '#fff' }}>{i + 1}</div>
                          <span className="text-sm text-gray-300">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TIMELINE */}
                  <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                    <h3 className="font-bold text-white mb-4 text-sm">📅 Timeline Operativa (4 Settimane)</h3>
                    <div className="flex flex-col gap-3">
                      {TIMELINE.map((t, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: t.color }} />
                          <div>
                            <div className="text-xs font-semibold" style={{ color: t.color }}>{t.settimana}</div>
                            <div className="text-xs font-medium text-white mt-0.5">{t.titolo}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{t.attività.join(' · ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COST SUMMARY */}
                  <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                    <h3 className="font-bold text-white mb-3 text-sm">💰 Costi Stimati per Area</h3>
                    <div className="flex flex-col gap-2">
                      {analysis.aree?.map(area => (
                        <div key={area.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{area.emoji} {area.nome}</span>
                          <span className="font-medium text-white">€{(area.costoStimato||0).toLocaleString('it-IT')}</span>
                        </div>
                      ))}
                      <div className="pt-2 mt-1 flex items-center justify-between text-sm font-bold" style={{ borderTop: '1px solid #1E1E30' }}>
                        <span className="text-gray-300">Totale stimato</span>
                        <span style={{ color: '#F5A623' }}>€{(analysis.costoTotaleMin||0).toLocaleString('it-IT')} – €{(analysis.costoTotaleMax||0).toLocaleString('it-IT')}</span>
                      </div>
                    </div>
                  </div>

                  {/* DATABASE LINKS */}
                  <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                    <h3 className="font-bold text-white mb-3 text-sm">🔗 Database Ufficiali</h3>
                    <div className="flex flex-col gap-1.5">
                      {DATABASE_UFFICIALI.map((db, i) => (
                        <a key={i} href={db.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {db.nome}
                        </a>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => { setActiveTab('form'); setAnalysis(null) }}
                    className="w-full py-3 rounded-xl font-medium text-sm transition-all hover:bg-white/5" style={{ border: '1px solid #1E1E30', color: '#888' }}>
                    ← Nuova Analisi DD
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="max-w-xl mx-auto mt-8 animate-in">
              <div className="p-8 rounded-2xl text-center" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(76,139,245,0.2), rgba(162,139,250,0.2))' }}>
                  <svg className="animate-spin" width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="rgba(76,139,245,0.3)" strokeWidth="3"/>
                    <path d="M16 2a14 14 0 0114 14" stroke="#4C8BF5" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-2">Due Diligence in corso...</h3>
                <div className="flex flex-col gap-2">
                  {['Analisi legale e catastale...','Verifica urbanistica e sismica...','Assessment ambientale...','Analisi fiscale e finanziaria...','Generazione report completo...'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 justify-center text-sm text-gray-500">
                      <div className="skeleton w-4 h-4 rounded-full" />{step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FF({ label, name, placeholder, value, onChange, type = 'text' }: {
  label: string; name: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600"
        style={{ background: '#151525', border: '1px solid #2A2A42' }} />
    </div>
  )
}
