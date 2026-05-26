import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { indirizzo, tipoProprietà, comune, foglioParticella, superficie, noteAggiuntive, checksSelezionati } = data

    if (!indirizzo || !comune) {
      return NextResponse.json({ error: 'Indirizzo e Comune sono obbligatori' }, { status: 400 })
    }

    const checksStr = checksSelezionati?.length
      ? `\nVERIFICHE PRIORITARIE RICHIESTE:\n${checksSelezionati.map((c: string) => `- ${c}`).join('\n')}`
      : ''

    const prompt = `Sei un esperto di due diligence immobiliare in Italia con 20+ anni di esperienza. Analizza questa proprietà e genera un report di due diligence professionale completo secondo il framework italiano.

DATI PROPRIETÀ:
- Indirizzo: ${indirizzo}
- Comune: ${comune}
- Tipo: ${tipoProprietà || 'Non specificato'}
- Superficie: ${superficie ? `${superficie} mq` : 'Non specificata'}
- Foglio/Particella Catastale: ${foglioParticella || 'Da verificare'}
- Note: ${noteAggiuntive || 'Nessuna'}
${checksStr}

Genera l'analisi ESCLUSIVAMENTE come JSON valido (nessun testo prima o dopo), con questa struttura:

{
  "aree": [
    {
      "id": "legale",
      "nome": "Legale & Catastale",
      "emoji": "⚖️",
      "stato": "Attenzione",
      "rischio": "Medio",
      "sommario": "Breve valutazione in 1-2 frasi",
      "findings": ["Finding 1", "Finding 2", "Finding 3"],
      "azioniRichieste": ["Azione 1", "Azione 2"],
      "documentiNecessari": ["Documento 1", "Documento 2"],
      "tempoStimato": "3-5 giorni",
      "costoStimato": 500
    },
    {
      "id": "urbanistica",
      "nome": "Urbanistica & Edilizia",
      "emoji": "🏗️",
      "stato": "OK",
      "rischio": "Basso",
      "sommario": "...",
      "findings": [],
      "azioniRichieste": [],
      "documentiNecessari": [],
      "tempoStimato": "5-7 giorni",
      "costoStimato": 600
    },
    {
      "id": "ambientale",
      "nome": "Ambientale",
      "emoji": "🌿",
      "stato": "OK",
      "rischio": "Basso",
      "sommario": "...",
      "findings": [],
      "azioniRichieste": [],
      "documentiNecessari": [],
      "tempoStimato": "4-6 giorni",
      "costoStimato": 400
    },
    {
      "id": "strutturale",
      "nome": "Strutturale & Sismica",
      "emoji": "🏛️",
      "stato": "Attenzione",
      "rischio": "Medio",
      "sommario": "...",
      "findings": [],
      "azioniRichieste": [],
      "documentiNecessari": [],
      "tempoStimato": "7-10 giorni",
      "costoStimato": 1200
    },
    {
      "id": "energetica",
      "nome": "Energetica",
      "emoji": "⚡",
      "stato": "OK",
      "rischio": "Basso",
      "sommario": "...",
      "findings": [],
      "azioniRichieste": [],
      "documentiNecessari": [],
      "tempoStimato": "2-3 giorni",
      "costoStimato": 300
    },
    {
      "id": "condominiale",
      "nome": "Condominiale",
      "emoji": "🏢",
      "stato": "OK",
      "rischio": "Basso",
      "sommario": "...",
      "findings": [],
      "azioniRichieste": [],
      "documentiNecessari": [],
      "tempoStimato": "3-5 giorni",
      "costoStimato": 200
    },
    {
      "id": "esg",
      "nome": "ESG & Governance",
      "emoji": "🌱",
      "stato": "OK",
      "rischio": "Basso",
      "sommario": "...",
      "findings": [],
      "azioniRichieste": [],
      "documentiNecessari": [],
      "tempoStimato": "3-4 giorni",
      "costoStimato": 350
    },
    {
      "id": "fiscale",
      "nome": "Fiscale & Finanziaria",
      "emoji": "💰",
      "stato": "OK",
      "rischio": "Basso",
      "sommario": "...",
      "findings": [],
      "azioniRichieste": [],
      "documentiNecessari": [],
      "tempoStimato": "2-4 giorni",
      "costoStimato": 250
    }
  ],
  "valutazioneGlobale": "Sintesi professionale della due diligence in 3-4 frasi",
  "raccomandazione": "PROCEDI",
  "punteggio": 7,
  "motivazioneRaccomandazione": "Spiegazione della raccomandazione in 2-3 frasi",
  "redFlagsCritici": ["Red flag 1 se esistono"],
  "prioritaAzioni": ["Prima cosa da fare", "Seconda cosa da fare", "Terza cosa da fare"],
  "tempoTotaleStimato": "3-4 settimane",
  "costoTotaleMin": 2500,
  "costoTotaleMax": 4500
}

REGOLE:
- stato può essere: "OK" | "Attenzione" | "Critico"
- rischio può essere: "Basso" | "Medio" | "Alto"
- raccomandazione può essere: "PROCEDI" | "PROCEDI CON CAUTELA" | "STOP"
- punteggio da 1 (pessimo) a 10 (ottimo)
- Per ${comune}, considera il rischio sismico specifico della zona (usa dati INGV realistici per la regione)
- Per la zona, considera eventuali vincoli paesaggistici/ambientali tipici
- redFlagsCritici: lista vuota [] se non ci sono red flag critici
- Tutti i valori numerici devono essere numeri, non stringhe
- costoStimato per ogni area è in euro (stima realistica per il mercato italiano)
- La risposta deve essere JSON puro, senza markdown code blocks`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    let analysis
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Nessun JSON trovato nella risposta')
      analysis = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Errore nel parsing della risposta AI. Riprova.' }, { status: 500 })
    }

    return NextResponse.json(analysis)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    const isApiKeyError = message.includes('API key') || message.includes('authentication')
    return NextResponse.json(
      { error: isApiKeyError ? 'ANTHROPIC_API_KEY non configurata.' : message },
      { status: 500 }
    )
  }
}
