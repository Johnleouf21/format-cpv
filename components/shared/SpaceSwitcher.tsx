'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Shield, GraduationCap, BookOpen } from 'lucide-react'

interface SpaceSwitcherProps {
  currentSpace: 'admin' | 'trainer' | 'learner'
  userRole: string
}

const spaces = [
  { key: 'admin' as const, label: 'Admin', href: '/admin', icon: Shield, roles: ['ADMIN'] },
  { key: 'trainer' as const, label: 'Formateur', href: '/trainer', icon: GraduationCap, roles: ['ADMIN', 'TRAINER'] },
  { key: 'learner' as const, label: 'Apprenant', href: '/learner', icon: BookOpen, roles: ['ADMIN', 'TRAINER', 'LEARNER'] },
]

export function SpaceSwitcher({ currentSpace, userRole }: SpaceSwitcherProps) {
  const availableSpaces = spaces.filter(s => s.roles.includes(userRole))

  if (availableSpaces.length <= 1) return null

  return (
    <div className="flex items-center gap-0.5 border rounded-lg p-0.5">
      {availableSpaces.map(space => (
        <Button
          key={space.key}
          variant={currentSpace === space.key ? 'default' : 'ghost'}
          size="sm"
          className="h-7 px-2 sm:px-2.5"
          asChild
        >
          <Link href={space.href}>
            <space.icon className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs">{space.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  )
}
