import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendReminderEmail } from '@/lib/services/email.service'

const CRON_SECRET = process.env.CRON_SECRET

// Nombre de jours d'inactivité avant rappel
const INACTIVITY_DAYS = 3

export async function GET(request: NextRequest) {
  // Protection : Vercel Cron envoie le secret via Authorization header
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS)

    // Trouver les apprenants inactifs depuis X jours avec au moins un parcours
    const inactiveLearners = await prisma.user.findMany({
      where: {
        role: 'LEARNER',
        userParcours: { some: {} },
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
                parcoursModules: { select: { moduleId: true } },
              },
            },
          },
        },
        progress: {
          select: { completedAt: true, moduleId: true },
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

      // Trouver le premier parcours non terminé
      const completedModuleIds = new Set(learner.progress.map((p) => p.moduleId))

      const unfinishedParcours = learner.userParcours.find((up) => {
        const totalModules = up.parcours.parcoursModules.length
        const completed = up.parcours.parcoursModules.filter((pm) => completedModuleIds.has(pm.moduleId)).length
        return totalModules > 0 && completed < totalModules
      })

      // Pas de parcours non terminé → pas de rappel
      if (!unfinishedParcours) {
        skipped++
        continue
      }

      const totalModules = unfinishedParcours.parcours.parcoursModules.length
      const completedInParcours = unfinishedParcours.parcours.parcoursModules.filter(
        (pm) => completedModuleIds.has(pm.moduleId)
      ).length

      // Calculer les jours depuis la dernière activité
      const lastActivityDate = learner.progress.length > 0
        ? learner.progress.reduce((latest, p) =>
            new Date(p.completedAt) > new Date(latest.completedAt) ? p : latest
          ).completedAt
        : learner.createdAt
      const daysSince = Math.floor(
        (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSince < INACTIVITY_DAYS) continue

      await sendReminderEmail({
        to: learner.email,
        learnerName: learner.name,
        daysSinceLastActivity: daysSince,
        completedModules: completedInParcours,
        totalModules,
        parcoursTitle: unfinishedParcours.parcours.title,
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
