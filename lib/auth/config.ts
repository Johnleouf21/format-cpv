import type { NextAuthConfig } from 'next-auth'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { FormaCPVAdapter } from './adapter'
import { isEmailWhitelisted, getRoleForEmail } from '@/lib/services/whitelist.service'
import { sendMagicLinkEmail } from './magic-link-email'

// Build providers array
const providers: NextAuthConfig['providers'] = []

// Magic Link via Resend (production auth)
if (process.env.RESEND_API_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || 'FormaCPV <onboarding@resend.dev>',
      maxAge: 15 * 60, // 15 minutes
      sendVerificationRequest: sendMagicLinkEmail,
    })
  )
}

// Credentials provider: handles cross-device pending login (always) + dev testing
providers.push(
  Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      role: { label: 'Role', type: 'text' },
      pendingLoginId: { label: 'Pending Login ID', type: 'text' },
    },
    async authorize(credentials) {
      // Cross-device pending login flow (always available)
      if (credentials?.pendingLoginId) {
        const pendingId = credentials.pendingLoginId as string
        const pending = await prisma.pendingLogin.findUnique({
          where: { id: pendingId },
        })

        if (!pending || !pending.verified || pending.expiresAt < new Date()) {
          return null
        }

        // Delete pending login (one-time use)
        await prisma.pendingLogin.delete({ where: { id: pendingId } })

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: pending.email },
        })

        if (!user) {
          const role = await getRoleForEmail(pending.email)
          user = await prisma.user.create({
            data: {
              email: pending.email,
              name: pending.email.split('@')[0],
              role,
            },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }

      // Dev test flow (development only)
      if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_CREDENTIALS_AUTH !== 'true') {
        return null
      }

      if (!credentials?.email) return null

      const email = credentials.email as string
      const requestedRole = (credentials.role as string)?.toUpperCase() as UserRole || UserRole.LEARNER
      const validRole = Object.values(UserRole).includes(requestedRole) ? requestedRole : UserRole.LEARNER

      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0],
            role: validRole,
          },
        })
      } else if (user.role !== validRole) {
        user = await prisma.user.update({
          where: { email },
          data: { role: validRole },
        })
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    },
  })
)

export const authConfig: NextAuthConfig = {
  adapter: FormaCPVAdapter(),
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/login/verify',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      // For email provider: check whitelist BEFORE sending magic link
      if (account?.provider === 'resend') {
        const whitelisted = await isEmailWhitelisted(user.email)
        if (!whitelisted) {
          return false
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
        // Always fetch fresh name and role from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, role: true },
        })
        if (dbUser) {
          session.user.name = dbUser.name
          session.user.role = dbUser.role
        } else {
          session.user.role = token.role as UserRole
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      if (url.startsWith(baseUrl)) {
        return url
      }
      return baseUrl
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  cookies: {
    sessionToken: {
      name: 'forma-cpv.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // No maxAge → session cookie, dies when browser closes
      },
    },
  },
}
