import { auth } from '@/lib/auth'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'

interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
  }
}

/**
 * Vérifie l'authentification et le rôle.
 * Lance une ApiError si non authentifié ou rôle insuffisant.
 *
 * Usage:
 *   const session = await requireAuth()                    // juste authentifié
 *   const session = await requireAuth('ADMIN')             // admin uniquement
 *   const session = await requireAuth('ADMIN', 'TRAINER')  // admin ou formateur
 */
export async function requireAuth(...allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role as UserRole)) {
    throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
  }

  return session as AuthSession
}

/**
 * Vérifie que l'utilisateur est Super Admin.
 * Usage pour les actions sensibles : promotion admin, suppression admin, delete parcours/modules.
 */
export async function requireSuperAdmin(): Promise<AuthSession> {
  const session = await requireAuth('ADMIN')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) {
    throw new ApiError(403, 'Action réservée au Super Admin', 'SUPER_ADMIN_REQUIRED')
  }

  return session
}

/**
 * Vérifie si un userId est Super Admin (pour protéger contre la modification/suppression).
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  })
  return user?.isSuperAdmin ?? false
}
