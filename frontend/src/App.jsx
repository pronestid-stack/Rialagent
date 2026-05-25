import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const EXAMPLES = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'JPM', 'AMZN']

function Badge({ text }) {
  const upper = (text || '').toUpperCase()
  const color =
    upper.includes('BUY') ? 'badge-buy' :
    upper.includes('SELL') ? 'badge-sell' :
    upper.includes('HOLD') ? 'badge-hold' : 'badge-neutral'
  return <span className={`badge ${color}`}>{text}</span>
}

function detectVerdict(report) {
  if (!report) return null
  const m = report.match(/\*\*(BUY|HOLD|SELL)\*\*/i)
  return m ? m[1].toUpperCase() : null
}

export default function App() {
  const [ticker, setTicker] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const reportRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (loading) {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [loading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setReport(null)
    setMeta(null)

    const cleanTicker = ticker.trim().toUpperCase()
    const cleanAmount = parseFloat(amount.replace(/[^0-9.]/g, ''))

    if (!cleanTicker || !/^[A-Z]{1,6}$/.test(cleanTicker)) {
      setError('Inserisci un ticker valido (es. AAPL, NVDA)')
      return
    }
    if (!cleanAmount || cleanAmount <= 0) {
      setError("Inserisci un importo valido maggiore di 0")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: cleanTicker, amount: cleanAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Analisi fallita')
      setReport(data.report)
      setMeta({ ticker: data.ticker, amount: data.amount })
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verdict = detectVerdict(report)

  return (
    <div className="root">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">JPM</span>
            <span className="logo-sep" />
            <span className="logo-title">Stock Analyzer</span>
          </div>
          <span className="header-tag">AI-Powered Equity Research</span>
        </div>
      </header>

      <main className="main">
        <div className="hero">
          <h1 className="hero-title">Analisi Azionaria Istituzionale</h1>
          <p className="hero-sub">
            Inserisci un ticker e l'importo proposto. L'agente recupera i fondamentali,
            confronta i peer di settore e restituisce un memo completo con raccomandazione.
          </p>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label className="field-label">Ticker</label>
              <input
                className="field-input ticker-input"
                placeholder="AAPL"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                maxLength={6}
                autoComplete="off"
                spellCheck={false}
              />
              <div className="quick-picks">
                {EXAMPLES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`quick-chip ${ticker === t ? 'active' : ''}`}
                    onClick={() => setTicker(t)}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">Importo (USD)</label>
              <div className="amount-wrap">
                <span className="amount-prefix">$</span>
                <input
                  className="field-input amount-input"
                  placeholder="100,000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Analisi in corso… {elapsed}s
              </span>
            ) : '⚡ Avvia Analisi'}
          </button>
        </form>

        {loading && (
          <div className="loading-card">
            <div className="loading-steps">
              {[
                { label: 'Recupero dati di mercato', done: elapsed >= 3 },
                { label: 'Analisi fondamentali', done: elapsed >= 8 },
                { label: 'Confronto peer di settore', done: elapsed >= 15 },
                { label: 'Generazione memo con Claude Opus', done: elapsed >= 25 },
              ].map((step, i) => (
                <div key={i} className={`step ${step.done ? 'done' : elapsed >= i * 5 ? 'active' : ''}`}>
                  <span className="step-icon">{step.done ? '✓' : '○'}</span>
                  <span className="step-label">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report && meta && (
          <div className="report-wrapper" ref={reportRef}>
            <div className="report-header">
              <div className="report-meta">
                <span className="report-ticker">{meta.ticker}</span>
                <span className="report-amount">${meta.amount.toLocaleString()}</span>
              </div>
              {verdict && <Badge text={verdict} />}
            </div>

            <div className="report-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
                  h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
                  h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
                  table: ({ children }) => (
                    <div className="table-wrap"><table className="md-table">{children}</table></div>
                  ),
                  th: ({ children }) => <th className="md-th">{children}</th>,
                  td: ({ children }) => <td className="md-td">{children}</td>,
                  strong: ({ children }) => {
                    const text = String(children)
                    const isVerdict = ['BUY', 'HOLD', 'SELL'].includes(text.toUpperCase())
                    return isVerdict
                      ? <Badge text={text} />
                      : <strong>{children}</strong>
                  },
                  code: ({ children }) => <code className="md-code">{children}</code>,
                  blockquote: ({ children }) => <blockquote className="md-quote">{children}</blockquote>,
                }}
              >
                {report}
              </ReactMarkdown>
            </div>

            <div className="report-footer">
              <span>Generato con Claude Opus · yfinance · dati real-time</span>
              <button className="reset-btn" onClick={() => { setReport(null); setMeta(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                ← Nuova analisi
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Tool interno — solo a scopo informativo. Non costituisce consulenza finanziaria.</p>
      </footer>
    </div>
  )
}
