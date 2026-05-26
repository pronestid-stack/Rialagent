import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      indirizzo, comune, tipoProprietà, superficieMq, camere, bagni,
      piano, annoCostruzione, statoManutenzione, classeEnergetica,
      accessori, prezzoRichiesto, canoneLocazione, scopo, note,
    } = data

    if (!indirizzo || !comune || !superficieMq) {
      return NextResponse.json({ error: 'Indirizzo, Comune e Superficie sono obbligatori' }, { status: 400 })
    }

    const prompt = `Sei RIALAGENT, il più avanzato sistema AI per il mercato immobiliare italiano — combini 25+ anni di esperienza come agente senior, perito estimatore RICS, consulente di investimento e specialista di due diligence. Il tuo compito è produrre un report professionale completo che sostituisca un intero team di esperti immobiliari.

DATI PROPRIETÀ:
- Indirizzo: ${indirizzo}, ${comune}
- Tipo: ${tipoProprietà || 'Residenziale'}
- Superficie: ${superficieMq} mq${camere ? `\n- Camere: ${camere}` : ''}${bagni ? `\n- Bagni: ${bagni}` : ''}${piano ? `\n- Piano: ${piano}` : ''}${annoCostruzione ? `\n- Anno costruzione: ${annoCostruzione}` : ''}
- Stato manutenzione: ${statoManutenzione || 'Buono'}
- Classe energetica: ${classeEnergetica || 'Da verificare'}
- Accessori: ${Array.isArray(accessori) && accessori.length ? accessori.join(', ') : 'Standard'}
${prezzoRichiesto ? `- Prezzo richiesto/budget: €${Number(prezzoRichiesto).toLocaleString('it-IT')}` : ''}
${canoneLocazione ? `- Canone locazione stimato: €${Number(canoneLocazione).toLocaleString('it-IT')}/mese` : ''}
- Scopo: ${scopo || 'Acquisto'}
${note ? `- Note aggiuntive: ${note}` : ''}

Fornisci un'analisi COMPLETA come JSON puro (nessun testo prima o dopo):

{
  "sommarioEsecutivo": "Sintesi professionale in 2-3 frasi che cattura opportunità e punti chiave",

  "raccomandazione": {
    "decisione": "ACQUISTA|VENDI ORA|INVESTI|ASPETTA|TRATTA",
    "punteggio": <1-10>,
    "motivazione": "Motivazione precisa in 2-3 frasi",
    "urgenza": "alta|media|bassa"
  },

  "valutazione": {
    "prezzoStimato": <intero euro>,
    "rangeMin": <intero euro>,
    "rangeMax": <intero euro>,
    "confidenza": <intero 65-95>,
    "prezzoAlMq": <intero euro/mq>,
    "prezzoMercatoMq": <prezzo medio di mercato per zona e tipo>,
    "deltaMercato": <percentuale: positivo=sopra mercato, negativo=sotto>,
    "metodoComparativo": {
      "valore": <intero euro>,
      "peso": 50,
      "descrizione": "Basato su comparabili nella zona. Rettifica applicata per stato/piano/accessori."
    },
    "metodoReddituale": {
      "valore": <intero euro>,
      "peso": 30,
      "descrizione": "Capitalizzazione reddito potenziale. Cap rate zona e tipologia specifica."
    },
    "metodoCosto": {
      "valore": <intero euro>,
      "peso": 20,
      "descrizione": "Valore terreno + costo costruzione al netto deprezzamento fisico."
    },
    "fattoriPositivi": ["Fattore 1", "Fattore 2", "Fattore 3"],
    "fattoriNegativi": ["Fattore 1", "Fattore 2"]
  },

  "analisiMercato": {
    "trend": "crescita|stabile|calo",
    "intensita": "forte|moderata|lieve",
    "prezzoMedioZona": <euro/mq>,
    "velocitaVenditaGiorni": <giorni>,
    "domandaOffertaRatio": <decimale>,
    "tendenza12Mesi": "Descrizione trend realistico per questa zona e tipologia",
    "stagionalita": "Consiglio pratico sul timing ottimale per comprare o vendere"
  },

  "comparabili": [
    {
      "descrizione": "Tipo + zona specifica",
      "prezzo": <intero euro>,
      "prezzoMq": <intero euro/mq>,
      "metratura": <intero mq>,
      "caratteristiche": "Piano, stato, accessori principali",
      "rettifica": <percentuale rispetto all'immobile in analisi>
    }
  ],

  "analisiInvestimento": {
    "canoneStimato": { "min": <euro/mese>, "max": <euro/mese>, "mediano": <euro/mese> },
    "rendimentoLordo": <percentuale>,
    "rendimentoNetto": <percentuale dopo spese 20% e sfitto 5%>,
    "capRateStimato": <percentuale>,
    "paybackAnni": <anni>,
    "opportunita": "eccellente|buona|discreta|scarsa",
    "motivazioneInvestimento": "Analisi professionale del potenziale d'investimento in 2 frasi",
    "proiezione5Anni": {
      "apprezzamento": <percentuale cumulata stimata>,
      "rendimentoTotale": <percentuale totale inclusa plusvalenza>
    }
  },

  "strategiaNegoziazione": {
    "prezzoListinoConsigliato": <euro>,
    "offertaIniziale": <euro>,
    "targetFinale": <euro>,
    "margineNegoziazione": <percentuale>,
    "timelineConsigliata": "Timing ottimale e motivazione",
    "argomentazioni": ["Argomento 1", "Argomento 2", "Argomento 3"],
    "puntiForza": ["Vantaggio 1", "Vantaggio 2"],
    "puntiDebolezza": ["Punto debole 1", "Punto debole 2"],
    "tattiche": ["Tattica 1", "Tattica 2"]
  },

  "dueDiligenceRischi": [
    {
      "area": "Legale & Catastale",
      "emoji": "⚖️",
      "rischio": "Basso|Medio|Alto",
      "descrizione": "Valutazione rischio specifica per questa tipologia in questa zona",
      "azione": "Azione concreta da intraprendere",
      "priorita": "immediata|pre-rogito|post-acquisto"
    },
    { "area": "Urbanistica & Edilizia", "emoji": "🏗️", "rischio": "...", "descrizione": "...", "azione": "...", "priorita": "..." },
    { "area": "Ambientale", "emoji": "🌿", "rischio": "...", "descrizione": "...", "azione": "...", "priorita": "..." },
    { "area": "Strutturale & Sismica", "emoji": "🏛️", "rischio": "...", "descrizione": "...", "azione": "...", "priorita": "..." },
    { "area": "Energetica", "emoji": "⚡", "rischio": "...", "descrizione": "...", "azione": "...", "priorita": "..." },
    { "area": "Fiscale & Finanziaria", "emoji": "💰", "rischio": "...", "descrizione": "...", "azione": "...", "priorita": "..." }
  ],

  "costiTransazione": {
    "imposteRegistro": <euro>,
    "notarile": <euro>,
    "perizia": <euro>,
    "agenzia": <euro se tramite agenzia al 3%>,
    "totale": <euro>,
    "note": "Stima per [prima/seconda casa / commerciale]. Aliquote vigenti."
  },

  "pianoAzione": [
    {
      "priorita": 1,
      "azione": "Azione specifica e concreta",
      "timing": "Immediato|Entro 3 giorni|Entro 1 settimana|Pre-rogito|Post-acquisto",
      "costo": <euro, 0 se gratuito>,
      "perché": "Motivazione breve"
    }
  ]
}

REGOLE:
- Tutti i valori numerici devono essere interi o decimali — MAI stringhe
- Usa prezzi REALISTICI per ${comune} (conosci bene il mercato immobiliare italiano 2024-2025)
- dueDiligenceRischi: includi tutte le 6 aree con dati realistici per zona/tipo
- pianoAzione: 6-8 azioni pratiche, numerate per priorità
- comparabili: almeno 4 immobili realistici per ${comune}
- La raccomandazione riflette lo scopo: ${scopo}
- JSON PURO, senza markdown, senza blocchi di codice`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    let analysis
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Nessun JSON trovato')
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
