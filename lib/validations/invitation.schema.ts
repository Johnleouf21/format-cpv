import { z } from 'zod'

export const createInvitationSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  parcoursId: z.string().uuid('ID de parcours invalide'),
  count: z.number().int().min(1).max(100).optional().default(1),
})

export const redeemInvitationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
})

export type CreateInvitationInput = z.input<typeof createInvitationSchema>
export type RedeemInvitationInput = z.infer<typeof redeemInvitationSchema>
