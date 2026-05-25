'use client'

import { useState } from 'react'
import Link from 'next/link'

type Comparabile = { descrizione: string; prezzoMq: number; capRate: number; note: string }
type ScenarioValueAdd = { nome: string; investimento: number; nuovoNoi: number; nuovoCapRate: number; roi: number; descrizione: string }
type FattoreRischio = { rischio: string; livello: string; mitigazione: string }
type Analysis = {
  sommarioEsecutivo: string
  metriche: { capRate: number; noi: number; cashOnCash: number; dcr: number; grm: number; flussoCassaAnnuo: number }
  analisiValutazione: string
  comparabili: Comparabile[]
  scenariValueAdd: ScenarioValueAdd[]
  fattoriRischio: FattoreRischio[]
  raccomandazione: { decisione: string; punteggio: number; motivazione: string }
  proiezioniDecennali?: { anno: number; noi: number; cashFlow: number; valoreStimato: number }[]
}
type FormData = {
  indirizzo: string; tipoProprietà: string; prezzoAcquisto: string; affittoAnnuoLordo: string;
  speseOperative: string; acconto: string; tassoInteresse: string; durataMutuo: string;
  superficieMq: string; noteAggiuntive: string;
}

const initialForm: FormData = {
  indirizzo: '', tipoProprietà: 'Residenziale', prezzoAcquisto: '', affittoAnnuoLordo: '',
  speseOperative: '', acconto: '30', tassoInteresse: '4.5', durataMutuo: '25', superficieMq: '', noteAggiuntive: '',
}

export default function AnalyzePage() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form')
  const [downloadingExcel, setDownloadingExcel] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.indirizzo || !form.prezzoAcquisto || !form.affittoAnnuoLordo) {
      setError('Compila almeno: Indirizzo, Prezzo di Acquisto e Affitto Annuo.')
      return
    }
    setError(null)
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Errore ${res.status}`) }
      const data = await res.json()
      setAnalysis(data)
      setActiveTab('results')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadExcel() {
    if (!analysis) return
    setDownloadingExcel(true)
    try {
      const res = await fetch('/api/excel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form, analysis }) })
      if (!res.ok) throw new Error('Errore generazione Excel')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `RialAgent_${form.indirizzo.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { setError('Impossibile generare il file Excel. Riprova.') }
    finally { setDownloadingExcel(false) }
  }

  const rc: Record<string, { bg: string; color: string }> = {
    ACQUISTA: { bg: 'rgba(39,201,63,0.15)', color: '#27C93F' },
    MANTIENI: { bg: 'rgba(255,189,46,0.15)', color: '#FFBD2E' },
    PASSA: { bg: 'rgba(255,95,86,0.15)', color: '#FF5F56' },
  }
  const rk: Record<string, { bg: string; color: string }> = {
    Alto: { bg: 'rgba(255,95,86,0.15)', color: '#FF5F56' },
    Medio: { bg: 'rgba(255,189,46,0.15)', color: '#FFBD2E' },
    Basso: { bg: 'rgba(39,201,63,0.15)', color: '#27C93F' },
  }

  return (
    <div className="min-h-screen" style={{ background: '#05050B' }}>
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,5,11,0.90)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(30,30,48,0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" fill="white"/></svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Rial<span className="text-gradient-gold">Agent</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/due-diligence" className="hidden sm:inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: '#4C8BF5' }}>
              🔍 Due Diligence
            </Link>
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Analizza il tuo <span className="text-gradient-gold">Deal Immobiliare</span></h1>
            <p className="text-gray-400">Inserisci i dati della proprietà e ottieni un&apos;analisi AI professionale completa in pochi secondi</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl p-1" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
              {(['form', 'results'] as const).map(tab => (
                <button key={tab} onClick={() => analysis && setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-white'} ${!analysis && tab === 'results' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={activeTab === tab ? { background: 'linear-gradient(135deg, #F5A623, #D4891C)' } : {}}>
                  {tab === 'form' ? '📋 Dati Deal' : '📊 Analisi AI'}
                  {tab === 'results' && analysis && <span className="ml-1.5 w-2 h-2 rounded-full bg-green-400 inline-block" />}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto animate-in">
              <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <h2 className="font-bold text-white mb-5 flex items-center gap-2"><span className="text-lg">🏠</span> Dettagli Proprietà</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><FF label="Indirizzo Proprietà *" placeholder="Via Roma 15, Milano MI" name="indirizzo" value={form.indirizzo} onChange={handleChange} /></div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo di Proprietà *</label>
                    <select name="tipoProprietà" value={form.tipoProprietà} onChange={handleChange} className="w-full px-3 py-2.5 rounded-xl text-sm text-white transition-all" style={{ background: '#151525', border: '1px solid #2A2A42' }}>
                      {['Residenziale','Commerciale','Uffici','Industriale / Logistica','Hotel','Misto','Terreno'].map(t => <option key={t} value={t} style={{ background: '#0D0D1A' }}>{t}</option>)}
                    </select>
                  </div>
                  <FF label="Superficie (mq)" placeholder="850" name="superficieMq" type="number" value={form.superficieMq} onChange={handleChange} />
                </div>
              </div>
              <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <h2 className="font-bold text-white mb-5 flex items-center gap-2"><span className="text-lg">💰</span> Dati Finanziari</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FF label="Prezzo di Acquisto (€) *" placeholder="1300000" name="prezzoAcquisto" type="number" value={form.prezzoAcquisto} onChange={handleChange} prefix="€" />
                  <FF label="Affitto Annuo Lordo (€) *" placeholder="89400" name="affittoAnnuoLordo" type="number" value={form.affittoAnnuoLordo} onChange={handleChange} prefix="€" />
                  <FF label="Spese Operative Annue (€)" placeholder="15000" name="speseOperative" type="number" value={form.speseOperative} onChange={handleChange} prefix="€" />
                </div>
              </div>
              <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <h2 className="font-bold text-white mb-5 flex items-center gap-2"><span className="text-lg">🏦</span> Parametri di Finanziamento</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FF label="Acconto (%)" placeholder="30" name="acconto" type="number" value={form.acconto} onChange={handleChange} suffix="%" />
                  <FF label="Tasso di Interesse (%)" placeholder="4.5" name="tassoInteresse" type="number" step="0.1" value={form.tassoInteresse} onChange={handleChange} suffix="%" />
                  <FF label="Durata Mutuo (anni)" placeholder="25" name="durataMutuo" type="number" value={form.durataMutuo} onChange={handleChange} suffix="anni" />
                </div>
              </div>
              <div className="rounded-2xl p-6 sm:p-8 mb-6" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Note Aggiuntive (opzionale)</label>
                <textarea name="noteAggiuntive" value={form.noteAggiuntive} onChange={handleChange} rows={3}
                  placeholder="Stato della proprietà, inquilino attuale, lavori previsti, contesto di mercato locale..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white transition-all resize-none placeholder-gray-600"
                  style={{ background: '#151525', border: '1px solid #2A2A42' }} />
              </div>
              {error && <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: 'rgba(255,95,86,0.1)', border: '1px solid rgba(255,95,86,0.3)', color: '#FF7B74' }}>⚠️ {error}</div>}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-base font-bold transition-all hover:opacity-90 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed glow-gold"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
                {loading ? (<><svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Analisi in corso...</>) : (<>Analizza con AI</>)}
              </button>
              <p className="text-center text-xs text-gray-600 mt-3">Analisi completata in &lt;60 secondi · Powered by Claude AI</p>
            </form>
          )}

          {activeTab === 'results' && analysis && (
            <div className="animate-in">
              <div className="max-w-3xl mx-auto mb-6 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{ background: rc[analysis.raccomandazione.decisione]?.bg || 'rgba(245,166,35,0.1)', border: `1px solid ${rc[analysis.raccomandazione.decisione]?.color || '#F5A623'}44` }}>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">Raccomandazione AI</div>
                  <div className="font-black text-2xl" style={{ color: rc[analysis.raccomandazione.decisione]?.color }}>{analysis.raccomandazione.decisione}</div>
                  <div className="text-sm text-gray-300 mt-1">{analysis.raccomandazione.motivazione}</div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="text-xs text-gray-400 mb-1">Score</div>
                  <div className="text-3xl font-black" style={{ color: rc[analysis.raccomandazione.decisione]?.color }}>{analysis.raccomandazione.punteggio}<span className="text-lg">/10</span></div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                <div className="lg:col-span-2 flex flex-col gap-5">
                  <Card title="📝 Sommario Esecutivo"><p className="text-sm text-gray-300 leading-relaxed">{analysis.sommarioEsecutivo}</p></Card>
                  <Card title="📊 Metriche Finanziarie Chiave">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Metric label="Cap Rate" value={`${analysis.metriche.capRate?.toFixed(2)}%`} color="#F5A623" />
                      <Metric label="NOI Annuo" value={`€${(analysis.metriche.noi || 0).toLocaleString('it-IT')}`} color="#4C8BF5" />
                      <Metric label="Cash-on-Cash" value={`${analysis.metriche.cashOnCash?.toFixed(2)}%`} color="#A78BFA" />
                      <Metric label="Debt Coverage" value={(analysis.metriche.dcr || 0).toFixed(2)} color="#27C93F" />
                      <Metric label="Gross Rent Mult." value={(analysis.metriche.grm || 0).toFixed(1)} color="#FFBD2E" />
                      <Metric label="Flusso Cassa" value={`€${(analysis.metriche.flussoCassaAnnuo || 0).toLocaleString('it-IT')}`} color="#F5A623" />
                    </div>
                  </Card>
                  <Card title="🏗️ Analisi di Valutazione"><p className="text-sm text-gray-300 leading-relaxed">{analysis.analisiValutazione}</p></Card>
                  <Card title="📈 Scenari Value-Add">
                    <div className="flex flex-col gap-4">
                      {analysis.scenariValueAdd?.map((s, i) => {
                        const colors = ['#4C8BF5','#F5A623','#27C93F']; const pcts = [50,70,90]
                        return (
                          <div key={i} className="p-4 rounded-xl" style={{ background: '#151525' }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm text-white">{s.nome}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${colors[i]}22`, color: colors[i] }}>ROI +{s.roi?.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full mb-3" style={{ background: '#1E1E30' }}>
                              <div className="h-full rounded-full" style={{ width: `${pcts[i]}%`, background: colors[i] }} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                              <div>Investimento: <span className="text-white font-medium">€{(s.investimento||0).toLocaleString('it-IT')}</span></div>
                              <div>Nuovo NOI: <span className="text-white font-medium">€{(s.nuovoNoi||0).toLocaleString('it-IT')}</span></div>
                              <div>Cap Rate: <span className="text-white font-medium">{s.nuovoCapRate?.toFixed(2)}%</span></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{s.descrizione}</p>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                </div>
                <div className="flex flex-col gap-5">
                  <Card title="🔍 Comparabili di Mercato">
                    <div className="flex flex-col gap-3">
                      {analysis.comparabili?.map((c, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: '#151525' }}>
                          <div className="text-sm font-medium text-white mb-1">{c.descrizione}</div>
                          <div className="flex gap-3 text-xs text-gray-400">
                            <span>€{(c.prezzoMq||0).toLocaleString('it-IT')}/mq</span>
                            <span>Cap: {c.capRate?.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{c.note}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card title="⚠️ Fattori di Rischio">
                    <div className="flex flex-col gap-2">
                      {analysis.fattoriRischio?.map((r, i) => (
                        <div key={i} className="p-3 rounded-xl" style={{ background: '#151525' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white font-medium">{r.rischio}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: rk[r.livello]?.bg || '#1E1E30', color: rk[r.livello]?.color || '#ccc' }}>{r.livello}</span>
                          </div>
                          <p className="text-xs text-gray-500">{r.mitigazione}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  {analysis.proiezioniDecennali && analysis.proiezioniDecennali.length > 0 && (
                    <Card title="📅 Proiezioni 10 Anni">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr style={{ color: '#666' }}><th className="text-left pb-2">Anno</th><th className="text-right pb-2">NOI</th><th className="text-right pb-2">Cash Flow</th></tr></thead>
                          <tbody>
                            {analysis.proiezioniDecennali.map((p, i) => (
                              <tr key={i} className="border-t" style={{ borderColor: '#1E1E30' }}>
                                <td className="py-1.5 text-gray-400">Anno {p.anno}</td>
                                <td className="text-right text-gray-300">€{(p.noi||0).toLocaleString('it-IT')}</td>
                                <td className="text-right" style={{ color: (p.cashFlow||0) >= 0 ? '#27C93F' : '#FF5F56' }}>€{(p.cashFlow||0).toLocaleString('it-IT')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                  <button onClick={handleDownloadExcel} disabled={downloadingExcel}
                    className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 glow-gold"
                    style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
                    {downloadingExcel ? (<><svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Generando Excel...</>) : (<><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v10M5 8l4 4 4-4M2 14v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>Scarica Report Excel</>)}
                  </button>
                  <button onClick={() => { setActiveTab('form'); setAnalysis(null) }} className="w-full py-3 rounded-xl font-medium text-sm transition-all hover:bg-white/5" style={{ border: '1px solid #1E1E30', color: '#888' }}>
                    ← Nuova Analisi
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="max-w-xl mx-auto mt-8 animate-in">
              <div className="p-8 rounded-2xl text-center" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(76,139,245,0.2))' }}>
                  <svg className="animate-spin" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="rgba(245,166,35,0.3)" strokeWidth="3"/><path d="M16 2a14 14 0 0114 14" stroke="#F5A623" strokeWidth="3" strokeLinecap="round"/></svg>
                </div>
                <h3 className="font-bold text-white mb-2">Analisi in corso...</h3>
                <div className="flex flex-col gap-2">
                  {['Elaborazione dati deal...','Analisi comparabili di mercato...','Calcolo scenari value-add...','Generazione raccomandazione...'].map((step, i) => (
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

function FF({ label, name, placeholder, value, onChange, type = 'text', step, prefix, suffix }: {
  label: string; name: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; step?: string; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-sm text-gray-500 pointer-events-none">{prefix}</span>}
        <input name={name} type={type} step={step} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full py-2.5 rounded-xl text-sm text-white transition-all placeholder-gray-600 ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-12' : 'pr-3'}`}
          style={{ background: '#151525', border: '1px solid #2A2A42' }} />
        {suffix && <span className="absolute right-3 text-sm text-gray-500 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>
      <h3 className="font-bold text-white mb-4 text-sm">{title}</h3>
      {children}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: '#151525' }}>
      <div className="text-xl font-black" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
