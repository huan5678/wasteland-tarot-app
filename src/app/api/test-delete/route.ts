import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('[TEST DELETE] GET handler called')
  return NextResponse.json({ method: 'GET', message: 'Test route working' })
}

export async function DELETE() {
  console.log('[TEST DELETE] DELETE handler called')
  return NextResponse.json({ method: 'DELETE', message: 'DELETE is working!' })
}
