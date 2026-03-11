import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  }

  try {
    const pending = await prisma.pendingLogin.findUnique({
      where: { id },
    })

    if (!pending) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    }

    if (pending.expiresAt < new Date()) {
      return NextResponse.json({ verified: false, expired: true })
    }

    return NextResponse.json({ verified: pending.verified })
  } catch (error) {
    console.error('Error polling login:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
