import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendReminderEmail } from '@/lib/services/email.service'

const CRON_SECRET = process.env.CRON_SECRET

// Nombre de jours d'inactivité avant rappel
const INACTIVITY_DAYS = 7

export async function GET(request: NextRequest) {
  // Protection par secret pour éviter les appels non autorisés
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS)

    // Trouver les apprenants avec des parcours qui n'ont pas complété de module depuis X jours
    const inactiveLearners = await prisma.user.findMany({
      where: {
        role: 'LEARNER',
        userParcours: { some: {} },
        // Dernière activité (progress) avant la date limite
        progress: {
          none: {
            completedAt: { gte: cutoffDate },
          },
        },
      },
      include: {
        userParcours: {
          include: {
            parcours: {
              select: {
                title: true,
                modules: { select: { id: true } },
              },
            },
          },
          take: 1,
          orderBy: { assignedAt: 'desc' },
        },
        progress: {
          select: { completedAt: true },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
        notificationPreference: {
          select: { emailContentUpdate: true },
        },
      },
    })

    let sent = 0
    let skipped = 0

    for (const learner of inactiveLearners) {
      // Respecter les préférences de notification
      if (learner.notificationPreference?.emailContentUpdate === false) {
        skipped++
        continue
      }

      const mainParcours = learner.userParcours[0]
      if (!mainParcours) continue

      // Calculer les jours depuis la dernière activité
      const lastActivity = learner.progress[0]?.completedAt || learner.createdAt
      const daysSince = Math.floor(
        (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSince < INACTIVITY_DAYS) continue

      // Compter les modules complétés dans ce parcours
      const parcoursModuleIds = mainParcours.parcours.modules.map((m) => m.id)
      const completedInParcours = await prisma.progress.count({
        where: {
          userId: learner.id,
          moduleId: { in: parcoursModuleIds },
        },
      })

      // Ne pas envoyer si le parcours est déjà terminé
      if (completedInParcours >= parcoursModuleIds.length) continue

      await sendReminderEmail({
        to: learner.email,
        learnerName: learner.name,
        daysSinceLastActivity: daysSince,
        completedModules: completedInParcours,
        totalModules: parcoursModuleIds.length,
        parcoursTitle: mainParcours.parcours.title,
      })

      sent++
      // Pause entre les emails pour ne pas dépasser les rate limits Resend
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      checked: inactiveLearners.length,
      sent,
      skipped,
    })
  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
