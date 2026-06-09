import { NextRequest, NextResponse } from 'next/server'
import type { AstaLot } from '../scrape/route'

export const runtime = 'nodejs'

const NOTION_API = 'https://api.notion.com/v1'
const DB_ID = process.env.NOTION_DATABASE_ID || '8fec6ff382da43db974688a1d871221f'

function notionHeaders() {
  return {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  }
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

async function createNotionPage(lot: AstaLot): Promise<{ success: boolean; error?: string }> {
  const properties: Record<string, unknown> = {
    'Titolo': { title: [{ text: { content: lot.titolo || 'Lotto senza titolo' } }] },
    "Casa d'Asta": { select: { name: lot.casaDasta } },
    'N. Lotto': { rich_text: [{ text: { content: lot.numeroLotto || '' } }] },
    'Descrizione': { rich_text: [{ text: { content: (lot.descrizione || '').slice(0, 2000) } }] },
    'Stato': { select: { name: 'In corso' } },
  }

  if (lot.stimaMin != null) properties['Stima Min'] = { number: lot.stimaMin }
  if (lot.stimaMax != null) properties['Stima Max'] = { number: lot.stimaMax }
  if (lot.url) properties['URL'] = { url: lot.url }
  if (lot.immagine) properties['Immagine'] = { url: lot.immagine }

  const dateVal = parseDate(lot.dataAsta)
  if (dateVal) properties['Data Asta'] = { date: { start: dateVal } }

  if (lot.categoria) {
    const categoriaMap: Record<string, string> = {
      'Sedie & Poltrone': 'Arredi',
      'Tavoli': 'Arredi',
      'Illuminazione': 'Arredi',
      'Divani': 'Arredi',
      'Credenze & Armadi': 'Arredi',
      'Design da Collezione': 'Arte moderna',
      'Altro': 'Altro',
    }
    const notionCat = categoriaMap[lot.categoria] || 'Arredi'
    properties['Categoria'] = { multi_select: [{ name: notionCat }] }
  }

  const body = {
    parent: { database_id: DB_ID },
    properties,
    ...(lot.immagine ? { cover: { type: 'external', external: { url: lot.immagine } } } : {}),
  }

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { success: false, error: (err as { message?: string }).message || `HTTP ${res.status}` }
  }

  return { success: true }
}

export async function POST(request: NextRequest) {
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json({ error: 'NOTION_API_KEY non configurata' }, { status: 500 })
  }

  try {
    const { lots }: { lots: AstaLot[] } = await request.json()
    if (!lots?.length) return NextResponse.json({ error: 'Nessun lotto da salvare' }, { status: 400 })

    let saved = 0
    const errors: string[] = []

    for (const lot of lots) {
      const result = await createNotionPage(lot)
      if (result.success) saved++
      else errors.push(`${lot.titolo}: ${result.error}`)
    }

    return NextResponse.json({ saved, failed: errors.length, errors })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
