import { prisma } from '@/lib/db'
import type { Adapter, AdapterUser, VerificationToken } from 'next-auth/adapters'
import { UserRole } from '@prisma/client'

function mapToAdapterUser(user: {
  id: string
  email: string
  name: string
  role: UserRole
  emailVerified: Date | null
}): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    role: user.role,
  }
}

export function FormaCPVAdapter(): Adapter {
  return {
    async createUser(data) {
      // Determine role from AllowedEmail whitelist, fallback to LEARNER
      let role: UserRole = UserRole.LEARNER
      if (data.email) {
        const allowedEmail = await prisma.allowedEmail.findUnique({
          where: { email: data.email.toLowerCase() },
        })
        if (allowedEmail) {
          role = allowedEmail.role
        }
      }

      const user = await prisma.user.create({
        data: {
          email: data.email!,
          name: data.name || data.email!.split('@')[0],
          emailVerified: data.emailVerified ?? new Date(),
          role,
        },
      })

      // Ensure AllowedEmail entry exists (for domain-based users)
      await prisma.allowedEmail.upsert({
        where: { email: data.email!.toLowerCase() },
        update: {},
        create: { email: data.email!.toLowerCase(), role },
      })

      return mapToAdapterUser(user)
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) return null
      return mapToAdapterUser(user)
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return null
      return mapToAdapterUser(user)
    },

    async getUserByAccount() {
      // Not needed for email-only flow
      return null
    },

    async updateUser(data) {
      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.emailVerified && { emailVerified: data.emailVerified }),
        },
      })
      return mapToAdapterUser(user)
    },

    async createVerificationToken(data: VerificationToken) {
      const token = await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      })
      return token
    },

    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        })
        return verificationToken
      } catch {
        // Token not found or already used
        return null
      }
    },

    // Stubs for methods not needed with JWT strategy
    async linkAccount() {
      return undefined as never
    },
    async createSession() {
      return undefined as never
    },
    async getSessionAndUser() {
      return null
    },
    async updateSession() {
      return undefined as never
    },
    async deleteSession() {},
    async unlinkAccount() {},
    async deleteUser() {},
  }
}
