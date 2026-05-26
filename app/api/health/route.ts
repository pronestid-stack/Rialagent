import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY
  const keyPrefix = hasKey ? process.env.ANTHROPIC_API_KEY!.substring(0, 20) + '...' : 'MISSING'

  return NextResponse.json({
    status: 'ok',
    runtime: 'edge',
    anthropic_key_present: hasKey,
    anthropic_key_prefix: keyPrefix,
    timestamp: new Date().toISOString(),
  })
}
