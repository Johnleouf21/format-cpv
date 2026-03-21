'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  Moon,
  Sun,
  BarChart3,
  Award,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
  Shield,
  GraduationCap,
  BookOpen,
} from 'lucide-react'

interface UserMenuProps {
  userName: string
  userEmail: string
  userRole: string
  isSuperAdmin?: boolean
  currentSpace: 'admin' | 'trainer' | 'learner'
  /** Compact mode: only show avatar, no name/chevron (used in sidebar) */
  compact?: boolean
  /** Alignment of the dropdown */
  align?: 'start' | 'end'
  /** Side of the dropdown */
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  TRAINER: 'Formateur',
  LEARNER: 'Apprenant',
}

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  TRAINER: 'bg-blue-100 text-blue-700',
  LEARNER: 'bg-green-100 text-green-700',
}

const spaces = [
  { key: 'admin' as const, label: 'Admin', href: '/admin', icon: Shield, roles: ['ADMIN'] },
  { key: 'trainer' as const, label: 'Formateur', href: '/trainer', icon: GraduationCap, roles: ['ADMIN', 'TRAINER'] },
  { key: 'learner' as const, label: 'Apprenant', href: '/learner', icon: BookOpen, roles: ['ADMIN', 'TRAINER', 'LEARNER'] },
]

export function UserMenu({
  userName,
  userEmail,
  userRole,
  isSuperAdmin,
  currentSpace,
  compact = false,
  align = 'end',
  side = 'bottom',
}: UserMenuProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forma-cpv-theme') as 'light' | 'dark' || 'light'
    }
    return 'light'
  })

  const initials = userName
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('forma-cpv-theme', newTheme)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const statsHref = currentSpace === 'admin' ? '/admin' : currentSpace === 'trainer' ? '/trainer' : '/learner#stats'
  const showCertificates = currentSpace === 'learner' || userRole === 'LEARNER'
  const availableSpaces = spaces.filter(s => s.roles.includes(userRole))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
            <Avatar size="sm" className="w-7 h-7">
              <AvatarFallback className={`text-xs font-bold ${roleBadgeColors[userRole] || 'bg-gray-100 text-gray-700'}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-64">
        {/* User info header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className={`text-sm font-bold ${roleBadgeColors[userRole] || 'bg-gray-100 text-gray-700'}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${roleBadgeColors[userRole]}`}>
                  {roleLabels[userRole] || userRole}
                </span>
                {isSuperAdmin && (
                  <span className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 dark:from-amber-600 dark:via-yellow-500 dark:to-amber-600 text-amber-900 dark:text-amber-100 shadow-sm animate-shimmer bg-[length:200%_100%]">
                    <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                    Super&nbsp;Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Space switcher */}
        {availableSpaces.length > 1 && (
          <>
            <DropdownMenuGroup>
              {availableSpaces.map((space) => (
                <DropdownMenuItem key={space.key} asChild className="cursor-pointer">
                  <Link href={space.href} className="flex items-center">
                    <space.icon className="mr-2 h-4 w-4" />
                    Espace {space.label}
                    {currentSpace === space.key && (
                      <span className="ml-auto text-xs text-muted-foreground">actif</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Profile & preferences */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Mon profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
            {theme === 'light' ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile#notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* Stats & certificates */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={statsHref}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Mes statistiques
            </Link>
          </DropdownMenuItem>
          {showCertificates && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/learner/certificates">
                <Award className="mr-2 h-4 w-4" />
                Mes certificats
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {/* Help & sign out */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/help">
              <HelpCircle className="mr-2 h-4 w-4" />
              Aide
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
