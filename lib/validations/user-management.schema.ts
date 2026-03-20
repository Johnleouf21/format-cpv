import { z } from 'zod'

export const addUserSchema = z.object({
  email: z.string().email('Email invalide').transform((e) => e.toLowerCase().trim()),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  role: z.enum(['LEARNER', 'TRAINER', 'ADMIN']).optional().default('LEARNER'),
  trainerId: z.string().uuid().optional(),
  parcoursIds: z.array(z.string().uuid()).optional().default([]),
  centerIds: z.array(z.string().uuid()).optional().default([]),
  sendEmail: z.boolean().optional().default(true),
})

export type AddUserInput = z.infer<typeof addUserSchema>

export const addUsersBulkSchema = z.object({
  emails: z
    .array(z.string().email('Email invalide'))
    .min(1, 'Au moins un email requis')
    .max(500, 'Maximum 500 emails')
    .transform((emails) => emails.map((e) => e.toLowerCase().trim())),
  parcoursIds: z.array(z.string().uuid()).optional().default([]),
  sendEmails: z.boolean().optional().default(true),
})

export type AddUsersBulkInput = z.infer<typeof addUsersBulkSchema>

export const assignParcoursSchema = z.object({
  parcoursId: z.string().uuid('ID de parcours invalide'),
  sendNotification: z.boolean().optional().default(false),
})

export type AssignParcoursInput = z.infer<typeof assignParcoursSchema>

export const unassignParcoursSchema = z.object({
  parcoursId: z.string().uuid('ID de parcours invalide'),
})

export type UnassignParcoursInput = z.infer<typeof unassignParcoursSchema>

export const updateUserRoleSchema = z.object({
  role: z.enum(['LEARNER', 'TRAINER', 'ADMIN']),
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
