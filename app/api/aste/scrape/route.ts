import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
      'https://www.cambiaste.com/it/search?q=design&category=furniture',
      'https://www.cambiaste.com/it/aste?categoria=design',
    ],
  },
  finarte: {
    name: 'Finarte',
    casaDasta: 'Finarte',
    urls: [
      'https://www.finarte.it/it/search?q=design&tipo=mobili',
      'https://www.finarte.it/it/catalogo?categoria=design-del-900',
    ],
  },
  incanto: {
    name: 'Incanto',
    casaDasta: 'Incanto',
    urls: [
      'https://www.incanto.auction/it/search?q=design+furniture',
      'https://www.incanto.auction/it/categorie/design',
    ],
  },
  capitolum: {
    name: 'Capitolum',
    casaDasta: 'Capitolum',
    urls: [
      'https://www.capitolumaste.com/it/aste?q=design',
      'https://www.capitolumaste.com/it/catalogo',
    ],
  },
  colasanti: {
    name: 'Colasanti',
    casaDasta: 'Colasanti',
    urls: [
      'https://www.colasantiaste.com/it/aste?categoria=design',
      'https://www.colasantiaste.com/it/search?q=design+mobili',
    ],
  },
}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

function truncateHtml(html: string, maxLen = 12000): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.slice(0, maxLen)
}

async function extractLots(
  rawHtml: string,
  casaDasta: AstaLot['casaDasta'],
  sourceUrl: string,
): Promise<AstaLot[]> {
  const text = truncateHtml(rawHtml)

  const prompt = `Sei un esperto di aste. Analizza questo testo estratto dalla pagina web della casa d'aste "${casaDasta}" (URL: ${sourceUrl}) e cerca SOLO i lotti di MOBILI DI DESIGN (es. sedie, poltrone, tavoli, lampade, divani, credenze di designer del '900 come Eames, Ponti, Aalto, Magistretti, Zanuso, Castelli, Kartell, Cassina, B&B Italia, Arflex, etc.).

TESTO PAGINA:
${text}

Restituisci SOLO un array JSON con i lotti di design trovati. Per ogni lotto:
{
  "titolo": "nome completo del lotto",
  "numeroLotto": "numero lotto o stringa vuota",
  "stimaMin": numero intero in euro o null,
  "stimaMax": numero intero in euro o null,
  "dataAsta": "YYYY-MM-DD o null",
  "descrizione": "descrizione breve del pezzo",
  "immagine": "URL immagine se presente o stringa vuota",
  "url": "URL diretto al lotto se trovato, altrimenti '${sourceUrl}'",
  "categoria": "Sedie & Poltrone|Tavoli|Illuminazione|Divani|Credenze & Armadi|Design da Collezione|Altro"
}

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
    const { sources = Object.keys(SOURCES) } = await request.json().catch(() => ({}))

    const selectedSources = (sources as string[]).filter((s) => SOURCES[s])
    const results: AstaLot[] = []
    const errors: { source: string; error: string }[] = []

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

      if (!fetched) {
        errors.push({ source: source.name, error: 'Impossibile raggiungere il sito' })
      }
    }

    return NextResponse.json({ lots: results, errors, total: results.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
