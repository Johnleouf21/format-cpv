import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

// --- Whitelist Validation ---

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase()

  // Check 1: Exact email match in AllowedEmail
  const allowedEmail = await prisma.allowedEmail.findUnique({
    where: { email: normalizedEmail },
  })
  if (allowedEmail) return true

  // Check 2: Domain match in AllowedDomain
  const domain = normalizedEmail.split('@')[1]
  if (!domain) return false

  const allowedDomain = await prisma.allowedDomain.findUnique({
    where: { domain },
  })
  return !!allowedDomain
}

export async function getRoleForEmail(email: string): Promise<UserRole> {
  const allowedEmail = await prisma.allowedEmail.findUnique({
    where: { email: email.toLowerCase() },
  })
  if (allowedEmail) return allowedEmail.role
  return UserRole.LEARNER
}

// --- AllowedDomain CRUD ---

export async function getAllowedDomains() {
  return prisma.allowedDomain.findMany({ orderBy: { domain: 'asc' } })
}

export async function addAllowedDomain(domain: string) {
  return prisma.allowedDomain.create({
    data: { domain: domain.toLowerCase().trim() },
  })
}

export async function removeAllowedDomain(id: string) {
  return prisma.allowedDomain.delete({ where: { id } })
}

// --- AllowedEmail CRUD ---

export async function getAllowedEmails() {
  return prisma.allowedEmail.findMany({ orderBy: { email: 'asc' } })
}

export async function addAllowedEmail(email: string, role: UserRole = UserRole.LEARNER) {
  return prisma.allowedEmail.create({
    data: { email: email.toLowerCase().trim(), role },
  })
}

export async function updateAllowedEmailRole(id: string, role: UserRole) {
  return prisma.allowedEmail.update({ where: { id }, data: { role } })
}

export async function removeAllowedEmail(id: string) {
  return prisma.allowedEmail.delete({ where: { id } })
}
