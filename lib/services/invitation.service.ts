import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'
import type { CreateInvitationInput, RedeemInvitationInput } from '@/lib/validations/invitation.schema'

const INVITATION_EXPIRY_DAYS = parseInt(process.env.INVITATION_EXPIRY_DAYS || '14', 10)

export async function createInvitation(
  trainerId: string,
  data: CreateInvitationInput
) {
  const parcours = await prisma.parcours.findUnique({
    where: { id: data.parcoursId },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

  // Auto-whitelist the email if provided
  if (data.email) {
    await prisma.allowedEmail.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        role: UserRole.LEARNER,
      },
    })
  }

  const invitations = await Promise.all(
    Array.from({ length: data.count || 1 }).map(() =>
      prisma.invitation.create({
        data: {
          email: data.email,
          trainerId,
          parcoursId: data.parcoursId,
          expiresAt,
        },
        include: {
          parcours: { select: { title: true } },
        },
      })
    )
  )

  return invitations
}

export async function validateInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      parcours: { select: { id: true, title: true } },
      trainer: { select: { name: true } },
    },
  })

  if (!invitation) {
    throw new ApiError(404, 'Invitation non trouvée', 'INVITATION_NOT_FOUND')
  }

  if (invitation.usedAt) {
    throw new ApiError(400, 'Cette invitation a déjà été utilisée', 'INVITATION_USED')
  }

  if (new Date() > invitation.expiresAt) {
    throw new ApiError(400, 'Cette invitation a expiré', 'INVITATION_EXPIRED')
  }

  return {
    valid: true,
    parcours: invitation.parcours,
    trainer: invitation.trainer,
    email: invitation.email,
  }
}

export async function redeemInvitation(
  token: string,
  data: RedeemInvitationInput
) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { parcours: true },
  })

  if (!invitation) {
    throw new ApiError(404, 'Invitation non trouvée', 'INVITATION_NOT_FOUND')
  }

  if (invitation.usedAt) {
    throw new ApiError(400, 'Cette invitation a déjà été utilisée', 'INVITATION_USED')
  }

  if (new Date() > invitation.expiresAt) {
    throw new ApiError(400, 'Cette invitation a expiré', 'INVITATION_EXPIRED')
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new ApiError(400, 'Un compte existe déjà avec cet email', 'EMAIL_EXISTS')
  }

  // Create user, whitelist email, and mark invitation as used in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: UserRole.LEARNER,
        trainerId: invitation.trainerId,
        parcoursId: invitation.parcoursId,
      },
    })

    // Auto-whitelist the email so the user can login via magic link later
    await tx.allowedEmail.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        role: UserRole.LEARNER,
      },
    })

    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        usedAt: new Date(),
        usedById: user.id,
      },
    })

    return user
  })

  return result
}

export async function getTrainerInvitations(trainerId: string) {
  return prisma.invitation.findMany({
    where: { trainerId },
    include: {
      parcours: { select: { title: true } },
      usedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deleteInvitation(trainerId: string, invitationId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      trainerId, // Ensure trainer owns this invitation
    },
  })

  if (!invitation) {
    throw new ApiError(404, 'Invitation non trouvée', 'INVITATION_NOT_FOUND')
  }

  if (invitation.usedAt) {
    throw new ApiError(
      400,
      'Impossible de supprimer une invitation utilisée',
      'INVITATION_USED'
    )
  }

  await prisma.invitation.delete({
    where: { id: invitationId },
  })

  return { success: true }
}

export interface BulkInvitationInput {
  emails: string[]
  parcoursId: string
}

export async function createBulkInvitations(
  trainerId: string,
  data: BulkInvitationInput
) {
  const parcours = await prisma.parcours.findUnique({
    where: { id: data.parcoursId },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

  // Auto-whitelist all emails
  await Promise.all(
    data.emails.map((email) =>
      prisma.allowedEmail.upsert({
        where: { email },
        update: {},
        create: {
          email,
          role: UserRole.LEARNER,
        },
      })
    )
  )

  const invitations = await prisma.$transaction(
    data.emails.map((email) =>
      prisma.invitation.create({
        data: {
          email,
          trainerId,
          parcoursId: data.parcoursId,
          expiresAt,
        },
        include: {
          parcours: { select: { title: true } },
        },
      })
    )
  )

  return invitations
}
