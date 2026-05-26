import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const {
      indirizzo,
      tipoProprietà,
      prezzoAcquisto,
      affittoAnnuoLordo,
      speseOperative,
      acconto,
      tassoInteresse,
      durataMutuo,
      superficieMq,
      noteAggiuntive,
    } = data

    if (!indirizzo || !prezzoAcquisto || !affittoAnnuoLordo) {
      return NextResponse.json({ error: 'Dati insufficienti per l\'analisi' }, { status: 400 })
    }

    const prezzoNum = parseFloat(prezzoAcquisto) || 0
    const affittoNum = parseFloat(affittoAnnuoLordo) || 0
    const speseNum = parseFloat(speseOperative) || (affittoNum * 0.15)
    const accontoNum = parseFloat(acconto) || 30
    const tassoNum = parseFloat(tassoInteresse) || 4.5
    const durataNum = parseFloat(durataMutuo) || 25
    const mq = parseFloat(superficieMq) || null

    const importoMutuo = prezzoNum * (1 - accontoNum / 100)
    const rataMensile = importoMutuo * (tassoNum / 100 / 12) / (1 - Math.pow(1 + tassoNum / 100 / 12, -durataNum * 12))
    const serviziDebitoAnnuo = rataMensile * 12

    const prompt = `Sei un esperto analista di investimenti immobiliari con 20+ anni di esperienza nel mercato italiano ed europeo. Analizza il seguente deal immobiliare e fornisci un'analisi professionale completa.

DATI DEL DEAL:
- Indirizzo: ${indirizzo}
- Tipo di Proprietà: ${tipoProprietà}
- Prezzo di Acquisto: €${prezzoNum.toLocaleString('it-IT')}
- Affitto Annuo Lordo: €${affittoNum.toLocaleString('it-IT')}
- Spese Operative Annue: €${speseNum.toLocaleString('it-IT')}
- Acconto: ${accontoNum}% (€${(prezzoNum * accontoNum / 100).toLocaleString('it-IT')})
- Importo Mutuo: €${importoMutuo.toLocaleString('it-IT')}
- Tasso di Interesse: ${tassoNum}%
- Durata Mutuo: ${durataNum} anni
- Rata Mensile Stimata: €${rataMensile.toFixed(0)}
- Servizio Debito Annuo: €${serviziDebitoAnnuo.toFixed(0)}
${mq ? `- Superficie: ${mq} mq (€${(prezzoNum/mq).toFixed(0)}/mq)` : ''}
${noteAggiuntive ? `- Note: ${noteAggiuntive}` : ''}

Fornisci l'analisi ESCLUSIVAMENTE come JSON valido (nessun testo prima o dopo il JSON), con questa struttura:
{
  "sommarioEsecutivo": "Sintesi professionale del deal in 2-3 frasi",
  "metriche": {
    "capRate": <numero percentuale, es: 6.8>,
    "noi": <NOI annuo in euro intero>,
    "cashOnCash": <rendimento cash-on-cash percentuale>,
    "dcr": <debt coverage ratio>,
    "grm": <gross rent multiplier>,
    "flussoCassaAnnuo": <flusso di cassa netto dopo mutuo>
  },
  "analisiValutazione": "Analisi dettagliata del valore di mercato e posizionamento in 3-4 frasi",
  "comparabili": [
    {
      "descrizione": "Nome/descrizione proprietà comparabile",
      "prezzoMq": <prezzo al mq in euro>,
      "capRate": <cap rate percentuale>,
      "note": "Breve nota"
    }
  ],
  "scenariValueAdd": [
    {
      "nome": "Conservativo",
      "investimento": <capex in euro>,
      "nuovoNoi": <nuovo noi in euro>,
      "nuovoCapRate": <nuovo cap rate>,
      "roi": <roi percentuale sull'investimento>,
      "descrizione": "Descrizione dello scenario in una frase"
    },
    {
      "nome": "Moderato",
      "investimento": <capex>,
      "nuovoNoi": <noi>,
      "nuovoCapRate": <cap rate>,
      "roi": <roi>,
      "descrizione": "..."
    },
    {
      "nome": "Aggressivo",
      "investimento": <capex>,
      "nuovoNoi": <noi>,
      "nuovoCapRate": <cap rate>,
      "roi": <roi>,
      "descrizione": "..."
    }
  ],
  "fattoriRischio": [
    {
      "rischio": "Nome rischio",
      "livello": "Alto|Medio|Basso",
      "mitigazione": "Strategia di mitigazione specifica"
    }
  ],
  "raccomandazione": {
    "decisione": "ACQUISTA|MANTIENI|PASSA",
    "punteggio": <numero da 1 a 10>,
    "motivazione": "Motivazione chiara della raccomandazione in 2-3 frasi"
  },
  "proiezioniDecennali": [
    {"anno": 1, "noi": <noi anno 1>, "cashFlow": <cash flow anno 1>, "valoreStimato": <valore stimato>},
    {"anno": 2},
    {"anno": 3},
    {"anno": 4},
    {"anno": 5},
    {"anno": 7},
    {"anno": 10}
  ]
}

Regole importanti:
- Usa NOI = Affitto Lordo - Spese Operative = €${(affittoNum - speseNum).toFixed(0)}
- Cap Rate = NOI / Prezzo Acquisto × 100
- Cash-on-Cash = Flusso Cassa Netto / Capitale Investito × 100
- DCR = NOI / Servizio Debito Annuo
- GRM = Prezzo Acquisto / Affitto Lordo
- Flusso Cassa = NOI - Servizio Debito
- Per le proiezioni, applica crescita dei canoni del 2-3% annuo e tasso di rivalutazione immobiliare del 2% annuo
- Includi almeno 3-4 comparabili realistici per il mercato italiano
- I valori devono essere numerici (non stringhe) dove indicato
- La risposta deve essere JSON puro, senza markdown code blocks`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    let analysis
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Nessun JSON trovato nella risposta')
      analysis = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { error: 'Errore nel parsing della risposta AI. Riprova.' },
        { status: 500 }
      )
    }

    return NextResponse.json(analysis)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    const isApiKeyError = message.includes('API key') || message.includes('authentication')
    return NextResponse.json(
      { error: isApiKeyError ? 'ANTHROPIC_API_KEY non configurata. Aggiungi la tua API key nel file .env.local' : message },
      { status: 500 }
    )
  }
}
