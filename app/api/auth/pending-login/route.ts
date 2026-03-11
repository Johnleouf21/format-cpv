import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isEmailWhitelisted } from '@/lib/services/whitelist.service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Check whitelist before creating pending login
    const whitelisted = await isEmailWhitelisted(email)
    if (!whitelisted) {
      return NextResponse.json({ error: 'Email non autorisé' }, { status: 403 })
    }

    // Create pending login (expires in 15 minutes)
    const pending = await prisma.pendingLogin.create({
      data: {
        email: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    return NextResponse.json({ id: pending.id })
  } catch (error) {
    console.error('Error creating pending login:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
