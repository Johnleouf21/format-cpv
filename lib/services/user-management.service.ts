import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'
import { sendWelcomeEmail, sendParcoursAssignmentEmail } from './email.service'
import type { AddUserInput, AddUsersBulkInput } from '@/lib/validations/user-management.schema'

// ─── Add a single user ──────────────────────────────────────────────────────

export interface AddUserResult {
  user: { id: string; email: string; name: string; role: UserRole }
  isNew: boolean
  assignedParcours: string[]
}

export async function addUser(
  data: AddUserInput & { addedBy: string; addedByName?: string }
): Promise<AddUserResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    include: { userParcours: { select: { parcoursId: true } } },
  })

  if (existingUser) {
    // User exists — assign new parcours only
    const existingParcoursIds = existingUser.userParcours.map((up) => up.parcoursId)
    const newParcoursIds = data.parcoursIds.filter((id) => !existingParcoursIds.includes(id))

    if (newParcoursIds.length > 0) {
      await prisma.userParcours.createMany({
        data: newParcoursIds.map((parcoursId) => ({
          userId: existingUser.id,
          parcoursId,
        })),
        skipDuplicates: true,
      })

      // Send notification email for new parcours
      if (data.sendEmail) {
        const parcours = await prisma.parcours.findMany({
          where: { id: { in: newParcoursIds } },
          select: { title: true },
        })
        await sendParcoursAssignmentEmail({
          to: existingUser.email,
          parcoursTitles: parcours.map((p) => p.title),
          trainerName: data.addedByName || 'Votre formateur',
        })
      }
    }

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      },
      isNew: false,
      assignedParcours: newParcoursIds,
    }
  }

  // New user — create user + whitelist + parcours assignments
  const role = (data.role as UserRole) || UserRole.LEARNER
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        name: data.name || data.email.split('@')[0],
        role,
        trainerId: data.trainerId,
      },
    })

    // Auto-whitelist
    await tx.allowedEmail.upsert({
      where: { email: data.email },
      update: { role },
      create: { email: data.email, role },
    })

    // Assign parcours
    if (data.parcoursIds.length > 0) {
      await tx.userParcours.createMany({
        data: data.parcoursIds.map((parcoursId) => ({
          userId: newUser.id,
          parcoursId,
        })),
      })
    }

    return newUser
  })

  // Send welcome email
  if (data.sendEmail) {
    const parcours = await prisma.parcours.findMany({
      where: { id: { in: data.parcoursIds } },
      select: { title: true },
    })
    await sendWelcomeEmail({
      to: user.email,
      parcoursTitles: parcours.map((p) => p.title),
      trainerName: data.addedByName || 'Votre formateur',
    })
  }

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    isNew: true,
    assignedParcours: data.parcoursIds,
  }
}

// ─── Bulk add users ─────────────────────────────────────────────────────────

export interface BulkAddResult {
  email: string
  success: boolean
  isNew: boolean
  error?: string
}

export async function addUsersBulk(
  data: AddUsersBulkInput & { trainerId: string; addedBy: string; addedByName?: string }
): Promise<BulkAddResult[]> {
  const results: BulkAddResult[] = []

  for (const email of data.emails) {
    try {
      const result = await addUser({
        email,
        role: 'LEARNER',
        parcoursIds: data.parcoursIds,
        sendEmail: data.sendEmails,
        trainerId: data.trainerId,
        addedBy: data.addedBy,
        addedByName: data.addedByName,
      })
      results.push({ email, success: true, isNew: result.isNew })
    } catch (error) {
      results.push({
        email,
        success: false,
        isNew: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      })
    }
    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  return results
}

// ─── Assign / Unassign parcours ─────────────────────────────────────────────

export async function assignParcours(data: {
  userId: string
  parcoursId: string
  assignedByName?: string
  sendNotification?: boolean
}) {
  const user = await prisma.user.findUnique({ where: { id: data.userId } })
  if (!user) throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND')

  const parcours = await prisma.parcours.findUnique({ where: { id: data.parcoursId } })
  if (!parcours) throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')

  const assignment = await prisma.userParcours.upsert({
    where: { userId_parcoursId: { userId: data.userId, parcoursId: data.parcoursId } },
    update: {},
    create: { userId: data.userId, parcoursId: data.parcoursId },
  })

  if (data.sendNotification) {
    await sendParcoursAssignmentEmail({
      to: user.email,
      parcoursTitles: [parcours.title],
      trainerName: data.assignedByName || 'Votre formateur',
    })
  }

  // Notification in-app
  const { createNotification } = await import('./notification.service')
  createNotification({
    userId: data.userId,
    title: 'Nouveau parcours assigné',
    message: `Le parcours "${parcours.title}" vous a été assigné.`,
    link: '/learner',
  })

  return assignment
}

export async function unassignParcours(data: { userId: string; parcoursId: string }) {
  // Delete the assignment
  await prisma.userParcours.deleteMany({
    where: { userId: data.userId, parcoursId: data.parcoursId },
  })

  // Delete progress for modules in this parcours
  const modules = await prisma.module.findMany({
    where: { parcoursId: data.parcoursId },
    select: { id: true },
  })
  const moduleIds = modules.map((m) => m.id)

  if (moduleIds.length > 0) {
    await prisma.progress.deleteMany({
      where: { userId: data.userId, moduleId: { in: moduleIds } },
    })
  }
}

// ─── Remove user ────────────────────────────────────────────────────────────

export async function removeUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND')

  await prisma.$transaction(async (tx) => {
    // Remove from allowed emails
    await tx.allowedEmail.deleteMany({ where: { email: user.email } })
    // Delete user (cascades: userParcours, progress)
    await tx.user.delete({ where: { id: userId } })
  })
}

// ─── Update user role ───────────────────────────────────────────────────────

const ROLE_LEVEL: Record<UserRole, number> = {
  LEARNER: 0,
  TRAINER: 1,
  ADMIN: 2,
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  currentUserRole: UserRole
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND')

  // ADMIN can change any role to any role (pyramide: ADMIN > TRAINER > LEARNER)
  if (currentUserRole === 'ADMIN') {
    // Admin can do anything, no restrictions
  } else {
    // Non-admin: cannot modify users of equal or higher role
    if (ROLE_LEVEL[user.role] >= ROLE_LEVEL[currentUserRole]) {
      throw new ApiError(403, 'Vous ne pouvez pas modifier un utilisateur de rang supérieur ou égal', 'FORBIDDEN')
    }
    // Non-admin: cannot promote above own role
    if (ROLE_LEVEL[newRole] >= ROLE_LEVEL[currentUserRole]) {
      throw new ApiError(403, 'Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre', 'FORBIDDEN')
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { role: newRole } })
    await tx.allowedEmail.upsert({
      where: { email: user.email },
      update: { role: newRole },
      create: { email: user.email, role: newRole },
    })
  })

  return { ...user, role: newRole }
}

// ─── List users ─────────────────────────────────────────────────────────────

export interface UserWithParcours {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  trainer: { id: string; name: string } | null
  parcours: { id: string; title: string; assignedAt: Date; completed: number; total: number }[]
  progressSummary: { total: number; completed: number }
}

export async function getUsers(options?: {
  trainerId?: string
  parcoursId?: string
  role?: UserRole
  search?: string
}): Promise<UserWithParcours[]> {
  const where: Record<string, unknown> = {}

  if (options?.trainerId) where.trainerId = options.trainerId
  if (options?.role) where.role = options.role
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { email: { contains: options.search, mode: 'insensitive' } },
    ]
  }
  if (options?.parcoursId) {
    where.userParcours = { some: { parcoursId: options.parcoursId } }
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      trainer: { select: { id: true, name: true } },
      userParcours: {
        include: { parcours: { select: { id: true, title: true, modules: { select: { id: true } } } } },
        orderBy: { assignedAt: 'desc' },
      },
      progress: { select: { moduleId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return users.map((user) => {
    const allModuleIds = user.userParcours.flatMap((up) => up.parcours.modules.map((m) => m.id))
    const completedModuleIds = user.progress.map((p) => p.moduleId)
    const completedCount = allModuleIds.filter((id) => completedModuleIds.includes(id)).length

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      trainer: user.trainer,
      parcours: user.userParcours.map((up) => {
        const totalModules = up.parcours.modules.length
        const completed = up.parcours.modules.filter((m) => completedModuleIds.includes(m.id)).length
        return {
          id: up.parcours.id,
          title: up.parcours.title,
          assignedAt: up.assignedAt,
          completed,
          total: totalModules,
        }
      }),
      progressSummary: {
        total: allModuleIds.length,
        completed: completedCount,
      },
    }
  })
}
