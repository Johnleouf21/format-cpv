import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'learners'

    let csv = ''
    const now = new Date().toISOString().slice(0, 10)

    if (type === 'learners') {
      csv = await exportLearners()
    } else if (type === 'progress') {
      csv = await exportProgress()
    } else if (type === 'quiz') {
      csv = await exportQuizResults()
    } else {
      throw new ApiError(400, 'Type d\'export invalide', 'INVALID_TYPE')
    }

    // BOM UTF-8 pour que Excel ouvre correctement les accents
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export-${type}-${now}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map((v) => escapeCsv(v == null ? '' : String(v))).join(';')
}

async function exportLearners(): Promise<string> {
  const learnersWithProgress = await prisma.user.findMany({
    where: { role: 'LEARNER' },
    include: {
      trainer: { select: { name: true, email: true } },
      userParcours: {
        include: {
          parcours: {
            select: {
              title: true,
              modules: { select: { id: true } },
            },
          },
        },
      },
      progress: { select: { moduleId: true } },
    },
    orderBy: { name: 'asc' },
  })

  const header = csvRow([
    'Nom',
    'Email',
    'Formateur',
    'Parcours',
    'Modules complétés',
    'Modules totaux',
    'Progression (%)',
    'Date d\'inscription',
  ])

  const dataRows = learnersWithProgress.map((l) => {
    const parcoursTitles = l.userParcours.map((up) => up.parcours.title).join(', ')
    const totalModules = l.userParcours.reduce((acc, up) => acc + up.parcours.modules.length, 0)
    const completedModules = l.progress.length
    const percentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

    return csvRow([
      l.name,
      l.email,
      l.trainer?.name || 'Non attribué',
      parcoursTitles || 'Aucun',
      completedModules,
      totalModules,
      percentage,
      l.createdAt.toLocaleDateString('fr-FR'),
    ])
  })

  return [header, ...dataRows].join('\n')
}

async function exportProgress(): Promise<string> {
  const progress = await prisma.progress.findMany({
    include: {
      user: { select: { name: true, email: true } },
      module: {
        select: {
          title: true,
          parcours: { select: { title: true } },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  const header = csvRow([
    'Apprenant',
    'Email',
    'Parcours',
    'Module',
    'Date de complétion',
  ])

  const rows = progress.map((p) =>
    csvRow([
      p.user.name,
      p.user.email,
      p.module.parcours?.title || 'N/A',
      p.module.title,
      p.completedAt.toLocaleDateString('fr-FR'),
    ])
  )

  return [header, ...rows].join('\n')
}

async function exportQuizResults(): Promise<string> {
  const results = await prisma.quizResult.findMany({
    include: {
      progress: {
        include: {
          user: { select: { name: true, email: true } },
          module: {
            select: {
              title: true,
              parcours: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  const header = csvRow([
    'Apprenant',
    'Email',
    'Parcours',
    'Module',
    'Score (%)',
    'Questions totales',
    'Réussite',
    'Date',
  ])

  const rows = results.map((r) =>
    csvRow([
      r.progress.user.name,
      r.progress.user.email,
      r.progress.module.parcours?.title || 'N/A',
      r.progress.module.title,
      r.score,
      r.totalQuestions,
      r.score >= 80 ? 'Oui' : 'Non',
      r.completedAt.toLocaleDateString('fr-FR'),
    ])
  )

  return [header, ...rows].join('\n')
}
