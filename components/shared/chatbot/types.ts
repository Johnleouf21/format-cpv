import type { CategorySuggestions } from '@/lib/chatbot/knowledge'

export interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  text: string
  richText?: React.ReactNode[]
  suggestions?: string[]
  categorySuggestions?: CategorySuggestions[]
  showCategories?: boolean
  feedbackGiven?: 'up' | 'down'
}

export const spaceToRole: Record<string, string> = {
  admin: 'ADMIN',
  trainer: 'TRAINER',
  learner: 'LEARNER',
}

export const roleLabels: Record<string, string> = {
  ADMIN: 'administrateur',
  TRAINER: 'formateur',
  LEARNER: 'apprenant',
}

export const STORAGE_KEY_PREFIX = 'formacpv-chatbot-'
