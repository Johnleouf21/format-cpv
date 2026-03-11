import { z } from 'zod'

export const addDomainSchema = z.object({
  domain: z
    .string()
    .min(3, 'Le domaine doit contenir au moins 3 caractères')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/,
      'Format de domaine invalide'
    ),
})

export const addEmailSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(['LEARNER', 'TRAINER', 'ADMIN']).default('LEARNER'),
})

export const updateEmailRoleSchema = z.object({
  role: z.enum(['LEARNER', 'TRAINER', 'ADMIN']),
})

export type AddDomainInput = z.infer<typeof addDomainSchema>
export type AddEmailInput = z.infer<typeof addEmailSchema>
export type UpdateEmailRoleInput = z.infer<typeof updateEmailRoleSchema>
