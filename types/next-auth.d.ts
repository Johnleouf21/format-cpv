import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      isSuperAdmin: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: UserRole
    isSuperAdmin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    isSuperAdmin: boolean
  }
}
