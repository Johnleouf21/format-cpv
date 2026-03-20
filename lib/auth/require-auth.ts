import { auth } from '@/lib/auth'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'

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
