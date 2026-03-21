import { prisma } from '@/lib/db'

export async function submitFeedback(
  userId: string,
  data: { rating: number; comment: string; anonymous: boolean; parcoursId?: string }
) {
  // Si parcoursId fourni, vérifier qu'il n'a pas déjà donné un avis pour ce parcours
  if (data.parcoursId) {
    const existing = await prisma.feedback.findUnique({
      where: { userId_parcoursId: { userId, parcoursId: data.parcoursId } },
    })
    if (existing) {
      // Mettre à jour l'avis existant
      return prisma.feedback.update({
        where: { id: existing.id },
        data: {
          rating: data.rating,
          comment: data.comment,
          anonymous: data.anonymous,
        },
      })
    }
  }

  return prisma.feedback.create({
    data: {
      userId,
      rating: data.rating,
      comment: data.comment,
      anonymous: data.anonymous,
      parcoursId: data.parcoursId || null,
    },
  })
}

export async function hasUserGivenFeedback(userId: string, parcoursId?: string): Promise<boolean> {
  if (parcoursId) {
    const count = await prisma.feedback.count({ where: { userId, parcoursId } })
    return count > 0
  }
  const count = await prisma.feedback.count({ where: { userId } })
  return count > 0
}

export async function getAllFeedback() {
  const feedbacks = await prisma.feedback.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      parcours: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return feedbacks.map((f) => ({
    id: f.id,
    rating: f.rating,
    comment: f.comment,
    anonymous: f.anonymous,
    userName: f.anonymous ? null : f.user.name,
    userEmail: f.anonymous ? null : f.user.email,
    parcoursTitle: f.parcours?.title || null,
    parcoursId: f.parcoursId,
    createdAt: f.createdAt,
  }))
}

export async function getFeedbackStats() {
  const feedbacks = await prisma.feedback.findMany({
    select: { rating: true },
  })

  const total = feedbacks.length
  if (total === 0) return { total: 0, average: 0, distribution: [0, 0, 0, 0, 0] }

  const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0)
  const distribution = [0, 0, 0, 0, 0]
  feedbacks.forEach((f) => {
    distribution[f.rating - 1]++
  })

  return {
    total,
    average: Math.round((sum / total) * 10) / 10,
    distribution,
  }
}
