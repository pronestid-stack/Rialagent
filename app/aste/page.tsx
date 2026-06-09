'use client'

import { useState } from 'react'
import Link from 'next/link'

interface AstaLot {
  titolo: string
  casaDasta: string
  numeroLotto: string
  stimaMin: number | null
  stimaMax: number | null
  dataAsta: string | null
  descrizione: string
  immagine: string
  url: string
  categoria: string
}

const SOURCES = [
  { key: 'cambi', label: 'Cambi', color: '#4C8BF5' },
  { key: 'finarte', label: 'Finarte', color: '#9C6FE4' },
  { key: 'incanto', label: 'Incanto', color: '#F5A623' },
  { key: 'capitolum', label: 'Capitolum', color: '#E84855' },
  { key: 'colasanti', label: 'Colasanti', color: '#2DD4BF' },
]

const URL_PLACEHOLDERS: Record<string, string> = {
  cambi: 'https://www.cambiaste.com/it/aste/123-design-del-900',
  finarte: 'https://www.finarte.it/it/aste/design-italiano',
  incanto: 'https://www.incanto.auction/it/lotti/123',
  capitolum: 'https://www.capitolum.it/it/aste/design',
  colasanti: 'https://www.colasantiaste.com/it/aste/design',
}

function formatEuro(n: number | null) {
  if (n == null) return '—'
  return `€${n.toLocaleString('it-IT')}`
}

export default function AstePage() {
  const [mode, setMode] = useState<'paste' | 'manual' | 'auto'>('paste')
  const [selected, setSelected] = useState<string[]>(SOURCES.map((s) => s.key))
  const [manualSource, setManualSource] = useState('cambi')
  const [manualUrl, setManualUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [scraping, setScraping] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lots, setLots] = useState<AstaLot[]>([])
  const [selectedLots, setSelectedLots] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<{ source: string; error: string }[]>([])
  const [saveResult, setSaveResult] = useState<{ saved: number; failed: number } | null>(null)
  const [scrapeError, setScrapeError] = useState<string | null>(null)

  function toggleSource(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  function toggleLot(idx: number) {
    setSelectedLots((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function toggleAll() {
    if (selectedLots.size === lots.length) setSelectedLots(new Set())
    else setSelectedLots(new Set(lots.map((_, i) => i)))
  }

  async function handleScrape() {
    setScraping(true)
    setLots([])
    setErrors([])
    setSaveResult(null)
    setScrapeError(null)
    setSelectedLots(new Set())

    try {
      const body = mode === 'paste'
        ? { pastedText: pastedText.trim(), manualSource }
        : mode === 'manual'
        ? { manualUrl: manualUrl.trim(), manualSource }
        : { sources: selected }

      const res = await fetch('/api/aste/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore scraping')
      setLots(data.lots || [])
      setErrors(data.errors || [])
      setSelectedLots(new Set((data.lots || []).map((_: AstaLot, i: number) => i)))
    } catch (e: unknown) {
      setScrapeError(e instanceof Error ? e.message : 'Errore sconosciuto')
    } finally {
      setScraping(false)
    }
  }

  async function handleSave() {
    const toSave = lots.filter((_, i) => selectedLots.has(i))
    if (!toSave.length) return
    setSaving(true)
    setSaveResult(null)
    try {
      const res = await fetch('/api/aste/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lots: toSave }),
      })
      const data = await res.json()
      setSaveResult({ saved: data.saved, failed: data.failed })
    } catch {
      setSaveResult({ saved: 0, failed: lots.length })
    } finally {
      setSaving(false)
    }
  }

  const canScrape = mode === 'paste' ? pastedText.trim().length > 0 : mode === 'auto' ? selected.length > 0 : manualUrl.trim().length > 0
  const sourceColor = (name: string) => SOURCES.find((s) => s.label === name)?.color || '#888'

  return (
    <div className="min-h-screen" style={{ background: '#05050B' }}>
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,5,11,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(30,30,48,0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5A623, #D4891C)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 7v9h5v-5h4v5h5V7L9 2z" fill="white"/></svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Rial<span style={{ background: 'linear-gradient(90deg,#F5A623,#D4891C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Agent</span></span>
            </Link>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Link href="/agente" className="hover:text-white transition-colors">AI Agent</Link>
              <Link href="/analyze" className="hover:text-white transition-colors">Deal Analysis</Link>
              <span className="text-white font-medium">Archivio Aste</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
        {/* HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623' }}>
            🪑 Mobili di Design
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Archivio Aste Design</h1>
          <p className="text-gray-400">Estrai i lotti di mobili di design dalle case d&apos;asta italiane e salvali automaticamente su Notion.</p>
        </div>

        {/* MODE TOGGLE */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setMode('paste')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: mode === 'paste' ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'paste' ? '#F5A623' : '#2A2A3A'}`, color: mode === 'paste' ? '#F5A623' : '#666' }}>
            📋 Incolla testo
          </button>
          <button onClick={() => setMode('manual')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: mode === 'manual' ? 'rgba(156,111,228,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'manual' ? '#9C6FE4' : '#2A2A3A'}`, color: mode === 'manual' ? '#9C6FE4' : '#666' }}>
            🔗 URL manuale
          </button>
          <button onClick={() => setMode('auto')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: mode === 'auto' ? 'rgba(76,139,245,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === 'auto' ? '#4C8BF5' : '#2A2A3A'}`, color: mode === 'auto' ? '#4C8BF5' : '#666' }}>
            🤖 Automatico
          </button>
        </div>

        {/* CONTROLS */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: '#0D0D1A', border: '1px solid #1E1E30' }}>

          {mode === 'paste' ? (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">Casa d&apos;asta</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {SOURCES.map((s) => (
                  <button key={s.key} onClick={() => setManualSource(s.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: manualSource === s.key ? `${s.color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${manualSource === s.key ? s.color : '#2A2A3A'}`, color: manualSource === s.key ? s.color : '#555' }}>
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)' }}>
                <p className="text-xs font-medium text-yellow-400 mb-2">Come fare:</p>
                <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
                  <li>Vai sul sito di <strong className="text-white">{SOURCES.find(s => s.key === manualSource)?.label}</strong> e apri una pagina di catalogo design</li>
                  <li>Premi <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: '#1E1E30', color: '#aaa' }}>Ctrl+A</kbd> poi <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: '#1E1E30', color: '#aaa' }}>Ctrl+C</kbd> per copiare tutto il testo della pagina</li>
                  <li>Incolla qui sotto con <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: '#1E1E30', color: '#aaa' }}>Ctrl+V</kbd></li>
                </ol>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Incolla qui il testo della pagina catalogo dell'asta..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none"
                style={{ background: '#070710', border: '1px solid #2A2A3A' }}
              />
              {pastedText.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">{pastedText.length.toLocaleString('it-IT')} caratteri incollati</p>
              )}
            </div>
          ) : mode === 'manual' ? (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">Incolla l&apos;URL del catalogo asta</p>
              <p className="text-xs text-gray-500 mb-4">Vai sul sito della casa d&apos;asta, apri la pagina del catalogo design/arredamento e copia l&apos;URL.</p>

              <div className="flex gap-3 mb-4 flex-wrap">
                {SOURCES.map((s) => (
                  <button key={s.key} onClick={() => setManualSource(s.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: manualSource === s.key ? `${s.color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${manualSource === s.key ? s.color : '#2A2A3A'}`, color: manualSource === s.key ? s.color : '#555' }}>
                    {s.label}
                  </button>
                ))}
              </div>

              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder={URL_PLACEHOLDERS[manualSource]}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-1 mb-2"
                style={{ background: '#070710', border: '1px solid #2A2A3A' }}
              />

              <div className="rounded-xl p-3 mt-3" style={{ background: 'rgba(76,139,245,0.06)', border: '1px solid rgba(76,139,245,0.15)' }}>
                <p className="text-xs text-blue-400 font-medium mb-1">Come trovare l&apos;URL giusto:</p>
                <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                  <li>Vai su <span style={{ color: sourceColor(SOURCES.find(s => s.key === manualSource)?.label || '') }}>{SOURCES.find(s => s.key === manualSource)?.label}</span> e apri la sezione <strong className="text-gray-400">Aste</strong> o <strong className="text-gray-400">Catalogo</strong></li>
                  <li>Trova un&apos;asta con lotti di design/arredamento</li>
                  <li>Copia l&apos;URL dalla barra del browser e incollalo qui sopra</li>
                </ol>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-4">Case d&apos;asta (scraping automatico — richiede ScrapingBee API key):</p>
              <div className="flex flex-wrap gap-3 mb-2">
                {SOURCES.map((s) => (
                  <button key={s.key} onClick={() => toggleSource(s.key)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{ background: selected.includes(s.key) ? `${s.color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${selected.includes(s.key) ? s.color : '#2A2A3A'}`, color: selected.includes(s.key) ? s.color : '#666' }}>
                    {selected.includes(s.key) ? '✓ ' : ''}{s.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">Per lo scraping automatico aggiungi <code className="text-yellow-600">SCRAPINGBEE_API_KEY</code> nelle variabili Vercel. Chiave gratuita su scrapingbee.com (1.000 req/mese).</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-center mt-5">
            <button onClick={handleScrape} disabled={scraping || !canScrape}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F5A623 0%, #D4891C 100%)', color: '#000' }}>
              {scraping ? (
                <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>Analisi in corso…</>
              ) : <>🔍 Avvia Scraping</>}
            </button>

            {lots.length > 0 && (
              <button onClick={handleSave} disabled={saving || !selectedLots.size}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.4)', color: '#2ecc71' }}>
                {saving ? (
                  <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/></svg>Salvataggio…</>
                ) : <>📝 Salva su Notion ({selectedLots.size})</>}
              </button>
            )}
          </div>
        </div>

        {/* STATUS */}
        {scrapeError && (
          <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'rgba(232,72,85,0.1)', border: '1px solid rgba(232,72,85,0.3)', color: '#E84855' }}>
            ⚠️ {scrapeError}
          </div>
        )}
        {errors.length > 0 && (
          <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623' }}>
            <p className="font-medium mb-1">Siti non raggiungibili:</p>
            {errors.map((e, i) => <p key={i}>• {e.source}: {e.error}</p>)}
          </div>
        )}
        {saveResult && (
          <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)', color: '#2ecc71' }}>
            ✅ Salvati su Notion: <strong>{saveResult.saved}</strong> lotti
            {saveResult.failed > 0 && <span className="text-yellow-400 ml-2">({saveResult.failed} falliti)</span>}
          </div>
        )}

        {/* RESULTS */}
        {lots.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E1E30' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ background: '#0D0D1A', borderBottom: '1px solid #1E1E30' }}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedLots.size === lots.length} onChange={toggleAll} className="w-4 h-4 rounded accent-amber-500 cursor-pointer" />
                <span className="text-sm font-medium text-white">{lots.length} lotti trovati</span>
              </div>
              <span className="text-xs text-gray-500">{selectedLots.size} selezionati</span>
            </div>

            <div className="divide-y divide-[#1E1E30]">
              {lots.map((lot, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer"
                  style={{ background: selectedLots.has(i) ? 'rgba(245,166,35,0.04)' : 'transparent' }}
                  onClick={() => toggleLot(i)}>
                  <input type="checkbox" checked={selectedLots.has(i)} onChange={() => toggleLot(i)}
                    className="mt-1 w-4 h-4 rounded accent-amber-500 cursor-pointer flex-shrink-0"
                    onClick={(e) => e.stopPropagation()} />
                  {lot.immagine && (
                    <img src={lot.immagine} alt={lot.titolo}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-800"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium mr-2"
                          style={{ background: `${sourceColor(lot.casaDasta)}20`, color: sourceColor(lot.casaDasta), border: `1px solid ${sourceColor(lot.casaDasta)}40` }}>
                          {lot.casaDasta}
                        </span>
                        {lot.numeroLotto && <span className="text-xs text-gray-500">Lotto {lot.numeroLotto}</span>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {(lot.stimaMin || lot.stimaMax) && (
                          <p className="text-sm font-semibold text-white">{formatEuro(lot.stimaMin)} – {formatEuro(lot.stimaMax)}</p>
                        )}
                        {lot.dataAsta && (
                          <p className="text-xs text-gray-500">{new Date(lot.dataAsta).toLocaleDateString('it-IT')}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-white mt-1 truncate">{lot.titolo}</p>
                    {lot.descrizione && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{lot.descrizione}</p>}
                    {lot.categoria && (
                      <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded" style={{ background: '#1E1E30', color: '#888' }}>{lot.categoria}</span>
                    )}
                  </div>
                  {lot.url && (
                    <a href={lot.url} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors mt-1"
                      onClick={(e) => e.stopPropagation()}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 2h4v4M6 8l6-6M2 4h3v6H2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!scraping && lots.length === 0 && !scrapeError && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🪑</div>
            <p className="text-gray-600 text-sm">
              {mode === 'paste' ? 'Copia il testo dalla pagina del catalogo e incollalo sopra' : mode === 'manual' ? 'Incolla l\'URL di un catalogo asta e clicca Avvia Scraping' : 'Seleziona le case d\'asta e avvia lo scraping'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
