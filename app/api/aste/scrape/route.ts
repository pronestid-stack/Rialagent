import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Scraping via ScrapingBee (se configurato) o proxy pubblici
async function fetchWithScrapingBee(url: string): Promise<string> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY
  if (!apiKey) throw new Error('no_key')
  const endpoint = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=true&premium_proxy=false`
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`ScrapingBee HTTP ${res.status}`)
  return await res.text()
}

export interface AstaLot {
  titolo: string
  casaDasta: 'Cambi' | 'Finarte' | 'Incanto' | 'Capitolum' | 'Colasanti'
  numeroLotto: string
  stimaMin: number | null
  stimaMax: number | null
  dataAsta: string | null
  descrizione: string
  immagine: string
  url: string
  categoria: string
}

const SOURCES: Record<string, { name: string; urls: string[]; casaDasta: AstaLot['casaDasta'] }> = {
  cambi: {
    name: 'Cambi',
    casaDasta: 'Cambi',
    urls: [
      'https://www.cambiaste.com/it/ricerca?q=design',
      'https://www.cambiaste.com/it/aste',
    ],
  },
  finarte: {
    name: 'Finarte',
    casaDasta: 'Finarte',
    urls: [
      'https://www.finarte.it/it/ricerca?q=design+furniture',
      'https://www.finarte.it/it/aste',
    ],
  },
  incanto: {
    name: 'Incanto',
    casaDasta: 'Incanto',
    urls: [
      'https://www.incanto.auction/it/lotti?q=design',
      'https://www.incanto.auction/it/aste-in-corso',
    ],
  },
  capitolum: {
    name: 'Capitolum',
    casaDasta: 'Capitolum',
    urls: [
      'https://www.capitolum.it/it/lotti?q=design',
      'https://www.capitolum.it/it/aste',
    ],
  },
  colasanti: {
    name: 'Colasanti',
    casaDasta: 'Colasanti',
    urls: [
      'https://www.colasantiaste.com/it/lotti?q=design',
      'https://www.colasantiaste.com/it/aste',
    ],
  },
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
}

async function fetchDirect(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: BROWSER_HEADERS })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchViaProxy(url: string): Promise<string> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(proxyUrl, { signal: controller.signal })
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchPage(url: string): Promise<string> {
  // 1. ScrapingBee (JS rendering, bypass anti-bot)
  try {
    return await fetchWithScrapingBee(url)
  } catch (e) {
    if ((e as Error).message !== 'no_key') throw e
  }
  // 2. Fetch diretto
  try {
    return await fetchDirect(url)
  } catch {
    // 3. Proxy pubblico fallback
    return await fetchViaProxy(url)
  }
}

function truncateHtml(html: string, maxLen = 14000): string {
  // Rimuovi script e style ma mantieni i tag HTML (per estrarre src, data-src, href)
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.slice(0, maxLen)
}

async function extractLots(
  rawHtml: string,
  casaDasta: AstaLot['casaDasta'],
  sourceUrl: string,
): Promise<AstaLot[]> {
  const text = truncateHtml(rawHtml)

  const prompt = `Sei un esperto di aste d'arte e design. Analizza questo contenuto estratto dalla pagina web della casa d'aste "${casaDasta}" (URL: ${sourceUrl}) e cerca SOLO i lotti di MOBILI DI DESIGN (sedie, poltrone, tavoli, lampade, divani, credenze di designer del '900: Eames, Ponti, Aalto, Magistretti, Zanuso, Castelli, Kartell, Cassina, B&B Italia, Arflex, Colombo, Sottsass, Mari, Bellini, etc.).

CONTENUTO PAGINA:
${text}

Restituisci SOLO un array JSON con i lotti di design trovati. Per ogni lotto estrai tutti i dati disponibili:
{
  "titolo": "nome completo del lotto con autore/designer",
  "numeroLotto": "numero lotto (es. '42') o stringa vuota",
  "stimaMin": numero intero in euro o null,
  "stimaMax": numero intero in euro o null,
  "dataAsta": "YYYY-MM-DD o null",
  "descrizione": "descrizione dettagliata: materiali, dimensioni, anno, provenienza",
  "immagine": "URL ASSOLUTO dell'immagine del lotto — cerca tag <img src=...>, data-src=..., data-lazy=..., srcset=..., og:image, background-image:url(...). Se trovi un URL relativo come /images/lot.jpg combinalo con il dominio base. Se non trovi nulla lascia stringa vuota.",
  "url": "URL assoluto diretto alla pagina del lotto, altrimenti '${sourceUrl}'",
  "categoria": "Sedie & Poltrone|Tavoli|Illuminazione|Divani|Credenze & Armadi|Design da Collezione|Altro"
}

IMPORTANTE per le immagini: cerca attentamente qualsiasi URL di immagine associato al lotto nel testo/HTML. Priorità: jpg/png/webp di dimensioni medie o grandi.
Se non trovi lotti di mobili di design, restituisci [].
JSON puro, nessun testo prima o dopo.`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
  try {
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) return []
    const lots: Omit<AstaLot, 'casaDasta'>[] = JSON.parse(match[0])
    return lots.map((l) => ({ ...l, casaDasta }))
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const results: AstaLot[] = []
    const errors: { source: string; error: string }[] = []

    // Modalità testo incollato (nessun fetch — testo già in chiaro)
    if (body.pastedText) {
      const sourceKey = body.manualSource || 'cambi'
      const source = SOURCES[sourceKey] || SOURCES.cambi
      const lots = await extractLots(body.pastedText, source.casaDasta, `https://www.${sourceKey === 'finarte' ? 'finarte.it' : sourceKey === 'incanto' ? 'incanto.auction' : sourceKey + 'aste.com'}`)
      if (lots.length === 0) {
        errors.push({ source: source.name, error: 'Nessun lotto di design trovato nel testo. Assicurati di aver copiato la pagina del catalogo con i lotti.' })
      }
      results.push(...lots)
      return NextResponse.json({ lots: results, errors, total: results.length })
    }

    // Modalità URL manuale
    if (body.manualUrl) {
      const sourceKey = body.manualSource || 'cambi'
      const source = SOURCES[sourceKey] || SOURCES.cambi
      try {
        const html = await fetchPage(body.manualUrl)
        const lots = await extractLots(html, source.casaDasta, body.manualUrl)
        results.push(...lots)
        if (lots.length === 0) {
          errors.push({ source: source.name, error: 'Nessun lotto di design trovato in questa pagina. Prova un URL diverso (es. la pagina del catalogo specifico).' })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Errore fetch'
        errors.push({ source: source.name, error: `Impossibile caricare la pagina: ${msg}` })
      }
      return NextResponse.json({ lots: results, errors, total: results.length })
    }

    // Modalità automatica
    const sources = body.sources || Object.keys(SOURCES)
    const selectedSources = (sources as string[]).filter((s: string) => SOURCES[s])

    for (const sourceKey of selectedSources) {
      const source = SOURCES[sourceKey]
      let fetched = false
      for (const url of source.urls) {
        try {
          const html = await fetchPage(url)
          const lots = await extractLots(html, source.casaDasta, url)
          results.push(...lots)
          fetched = true
          break
        } catch {
          continue
        }
      }
      if (!fetched) errors.push({ source: source.name, error: 'Impossibile raggiungere il sito' })
    }

    return NextResponse.json({ lots: results, errors, total: results.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
