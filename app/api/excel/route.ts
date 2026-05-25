import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const { form, analysis } = await request.json()

    const wb = XLSX.utils.book_new()

    const m = analysis.metriche || {}
    const r = analysis.raccomandazione || {}
    const summaryData = [
      ['RIALAGENT — ANALISI DEAL IMMOBILIARE', '', '', ''],
      ['', '', '', ''],
      ['Data Analisi:', new Date().toLocaleDateString('it-IT'), '', ''],
      ['Indirizzo:', form.indirizzo, '', ''],
      ['Tipo Proprietà:', form.tipoProprietà, '', ''],
      ['', '', '', ''],
      ['SOMMARIO ESECUTIVO', '', '', ''],
      [analysis.sommarioEsecutivo || '', '', '', ''],
      ['', '', '', ''],
      ['RACCOMANDAZIONE', '', '', ''],
      ['Decisione:', r.decisione || '', '', ''],
      ['Score:', `${r.punteggio || 0}/10`, '', ''],
      ['Motivazione:', r.motivazione || '', '', ''],
      ['', '', '', ''],
      ['METRICHE FINANZIARIE CHIAVE', '', '', ''],
      ['Metrica', 'Valore', 'Benchmark', 'Valutazione'],
      ['Cap Rate', `${(m.capRate || 0).toFixed(2)}%`, '5-8%', (m.capRate || 0) >= 5 ? 'Buono' : 'Verificare'],
      ['NOI Annuo', `€${(m.noi || 0).toLocaleString('it-IT')}`, '', ''],
      ['Cash-on-Cash Return', `${(m.cashOnCash || 0).toFixed(2)}%`, '>6%', (m.cashOnCash || 0) >= 6 ? 'Buono' : 'Verificare'],
      ['Debt Coverage Ratio', (m.dcr || 0).toFixed(2), '>1.25', (m.dcr || 0) >= 1.25 ? 'Buono' : 'Sotto soglia'],
      ['Gross Rent Multiplier', (m.grm || 0).toFixed(1), '10-15', ''],
      ['Flusso di Cassa Annuo', `€${(m.flussoCassaAnnuo || 0).toLocaleString('it-IT')}`, '', ''],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    ws1['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Sommario')

    const dealsData = [
      ['DATI DEAL & ANALISI FINANZIARIA', '', ''],
      ['', '', ''],
      ['DATI PROPRIETÀ', '', ''],
      ['Indirizzo', form.indirizzo, ''],
      ['Tipo', form.tipoProprietà, ''],
      ['Superficie', form.superficieMq ? `${form.superficieMq} mq` : 'N/D', ''],
      ['', '', ''],
      ['STRUTTURA FINANZIARIA', '', ''],
      ['Prezzo di Acquisto', parseFloat(form.prezzoAcquisto) || 0, 'EUR'],
      ['Acconto (%)', parseFloat(form.acconto) || 30, '%'],
      ['Acconto (EUR)', (parseFloat(form.prezzoAcquisto) || 0) * (parseFloat(form.acconto) || 30) / 100, 'EUR'],
      ['Importo Mutuo', (parseFloat(form.prezzoAcquisto) || 0) * (1 - (parseFloat(form.acconto) || 30) / 100), 'EUR'],
      ['Tasso di Interesse', parseFloat(form.tassoInteresse) || 4.5, '%'],
      ['Durata Mutuo', parseFloat(form.durataMutuo) || 25, 'anni'],
      ['', '', ''],
      ['INCOME & EXPENSES', '', ''],
      ['Affitto Annuo Lordo', parseFloat(form.affittoAnnuoLordo) || 0, 'EUR'],
      ['Spese Operative Annue', parseFloat(form.speseOperative) || 0, 'EUR'],
      ['NOI (Net Operating Income)', m.noi || 0, 'EUR'],
      ['Servizio Debito Annuo', (m.noi || 0) - (m.flussoCassaAnnuo || 0), 'EUR'],
      ['Flusso di Cassa Netto', m.flussoCassaAnnuo || 0, 'EUR'],
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(dealsData)
    ws2['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Dati Deal')

    const vaRows: unknown[][] = [
      ['SCENARI VALUE-ADD', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Scenario', 'Investimento (EUR)', 'Nuovo NOI (EUR)', 'Nuovo Cap Rate (%)', 'ROI (%)', 'Descrizione'],
    ]
    ;(analysis.scenariValueAdd || []).forEach((s: { nome: string; investimento: number; nuovoNoi: number; nuovoCapRate: number; roi: number; descrizione: string }) => {
      vaRows.push([s.nome, s.investimento || 0, s.nuovoNoi || 0, (s.nuovoCapRate || 0).toFixed(2), (s.roi || 0).toFixed(1), s.descrizione || ''])
    })
    const ws3 = XLSX.utils.aoa_to_sheet(vaRows)
    ws3['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Value-Add')

    const compRows: unknown[][] = [
      ['COMPARABILI DI MERCATO', '', '', ''],
      ['', '', '', ''],
      ['Proprietà', 'Prezzo/mq (EUR)', 'Cap Rate (%)', 'Note'],
    ]
    ;(analysis.comparabili || []).forEach((c: { descrizione: string; prezzoMq: number; capRate: number; note: string }) => {
      compRows.push([c.descrizione, c.prezzoMq || 0, (c.capRate || 0).toFixed(1), c.note || ''])
    })
    const ws4 = XLSX.utils.aoa_to_sheet(compRows)
    ws4['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, ws4, 'Comparabili')

    const riskRows: unknown[][] = [
      ['ANALISI DEI RISCHI', '', ''],
      ['', '', ''],
      ['Fattore di Rischio', 'Livello', 'Strategia di Mitigazione'],
    ]
    ;(analysis.fattoriRischio || []).forEach((r: { rischio: string; livello: string; mitigazione: string }) => {
      riskRows.push([r.rischio, r.livello, r.mitigazione || ''])
    })
    const ws5 = XLSX.utils.aoa_to_sheet(riskRows)
    ws5['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 60 }]
    XLSX.utils.book_append_sheet(wb, ws5, 'Rischi')

    if (analysis.proiezioniDecennali?.length > 0) {
      const projRows: unknown[][] = [
        ['PROIEZIONI A 10 ANNI', '', '', ''],
        ['', '', '', ''],
        ['Anno', 'NOI (EUR)', 'Cash Flow (EUR)', 'Valore Stimato (EUR)'],
      ]
      analysis.proiezioniDecennali.forEach((p: { anno: number; noi: number; cashFlow: number; valoreStimato: number }) => {
        projRows.push([`Anno ${p.anno}`, p.noi || 0, p.cashFlow || 0, p.valoreStimato || 0])
      })
      const ws6 = XLSX.utils.aoa_to_sheet(projRows)
      ws6['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 18 }]
      XLSX.utils.book_append_sheet(wb, ws6, 'Proiezioni 10Y')
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="RialAgent_Analisi.xlsx"',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
