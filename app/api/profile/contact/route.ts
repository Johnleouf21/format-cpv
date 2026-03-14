import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendContactEmail } from '@/lib/services/email.service'

// GET: return contact info (trainer + admins)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        trainer: { select: { id: true, name: true, email: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const contacts: { id: string; name: string; role: string }[] = []
    const addedIds = new Set<string>()

    function addContact(c: { id: string; name: string }, role: string) {
      if (c.id === session!.user!.id || addedIds.has(c.id)) return
      addedIds.add(c.id)
      contacts.push({ id: c.id, name: c.name, role })
    }

    // Learner: assigned trainer + admins
    // Trainer: admins only
    // Admin: other admins only
    if (user.trainer) {
      addContact(user.trainer, 'TRAINER')
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    for (const admin of admins) {
      addContact(admin, 'ADMIN')
    }

    return NextResponse.json({ contacts })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: send a contact message
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { recipientId, subject, message } = await request.json()

    if (!recipientId || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Destinataire, sujet et message sont requis' },
        { status: 400 }
      )
    }

    if (subject.trim().length > 200) {
      return NextResponse.json({ error: 'Sujet trop long (max 200 caractères)' }, { status: 400 })
    }
    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message trop long (max 2000 caractères)' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, role: true },
    })

    if (!recipient) {
      return NextResponse.json({ error: 'Destinataire non trouvé' }, { status: 404 })
    }

    // Only allow contacting trainers or admins (not learners)
    if (recipient.role !== 'ADMIN' && recipient.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Destinataire invalide' }, { status: 403 })
    }

    // Cannot send to yourself
    if (recipientId === session.user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous envoyer un message' }, { status: 400 })
    }

    const result = await sendContactEmail({
      to: recipient.email,
      fromName: session.user.name || session.user.email || 'Utilisateur',
      fromEmail: session.user.email || '',
      fromRole: session.user.role,
      subject: subject.trim(),
      message: message.trim(),
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Erreur lors de l'envoi" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
