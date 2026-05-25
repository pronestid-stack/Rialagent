import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RialAgent — AI per il Mercato Immobiliare',
  description: "Analizza qualsiasi deal immobiliare in pochi secondi. Valutazione AI, comparabili di mercato, scenari value-add e report Excel professionale in un click.",
  keywords: ['real estate AI', 'analisi immobiliare', 'underwriting AI', 'valutazione immobili', 'investimenti immobiliari'],
  openGraph: {
    title: 'RialAgent — AI per il Mercato Immobiliare',
    description: "Modelli finanziari professionali generati dall'AI in un click.",
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
