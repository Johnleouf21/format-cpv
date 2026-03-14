import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

// Use a unique key for global caching
const globalKey = Symbol.for('prisma-pool-client')

// Cache pool and prisma client globally to avoid recreation
const globalForPrisma = globalThis as unknown as {
  [globalKey]?: {
    pool: InstanceType<typeof Pool>
    prisma: PrismaClient
  }
}

function getOrCreatePrismaClient(): PrismaClient {
  if (globalForPrisma[globalKey]) {
    return globalForPrisma[globalKey].prisma
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any)
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma[globalKey] = { pool, prisma }
  }

  return prisma
}

export const prisma = getOrCreatePrismaClient()
