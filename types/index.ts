export type { User, Invitation, Parcours, Module, Progress } from '@prisma/client'
export { UserRole } from '@prisma/client'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'LEARNER' | 'TRAINER' | 'ADMIN'
}
