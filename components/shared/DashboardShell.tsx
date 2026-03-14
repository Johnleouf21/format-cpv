'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SpaceSwitcher } from '@/components/shared/SpaceSwitcher'
import { UserMenu } from '@/components/shared/UserMenu'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  BookOpen,
  Route,
  GraduationCap,
  Users,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { ChatBot } from '@/components/shared/ChatBot'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface DashboardShellProps {
  children: React.ReactNode
  navItems: NavItem[]
  mobileNavComponent?: React.ReactNode
  userName: string
  userEmail: string
  userRole: string
  currentSpace: 'admin' | 'trainer' | 'learner'
  maxWidth?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  Route,
  GraduationCap,
  Users,
  ShieldCheck,
}

export function DashboardShell({
  children,
  navItems,
  mobileNavComponent,
  userName,
  userEmail,
  userRole,
  currentSpace,
  maxWidth = 'max-w-7xl',
}: DashboardShellProps) {
  const [layout, setLayout] = useState<'header' | 'sidebar' | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const stored = localStorage.getItem('forma-cpv-layout')
    setLayout(stored === 'sidebar' ? 'sidebar' : 'header')

    // Listen for layout changes (cross-tab + same-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'forma-cpv-layout') {
        setLayout(e.newValue === 'sidebar' ? 'sidebar' : 'header')
      }
    }
    const handleLayoutChange = (e: Event) => {
      const value = (e as CustomEvent).detail as string
      setLayout(value === 'sidebar' ? 'sidebar' : 'header')
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('layout-change', handleLayoutChange)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('layout-change', handleLayoutChange)
    }
  }, [])

  // Don't render until layout preference is loaded to prevent flash
  if (layout === null) {
    return <div className="min-h-screen bg-background" />
  }

  if (layout === 'sidebar') {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside
          className={`sticky top-0 h-screen border-r bg-card flex flex-col transition-all duration-200 ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          } hidden md:flex`}
        >
          {/* Logo + collapse */}
          <div className="h-14 flex items-center justify-between px-4 border-b">
            {!sidebarCollapsed && (
              <Link href={`/${currentSpace}`} className="text-lg font-bold text-primary">
                FormaCPV
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User menu */}
          <div className={`px-3 py-4 border-b ${sidebarCollapsed ? 'px-2 flex justify-center' : ''}`}>
            <UserMenu
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              currentSpace={currentSpace}
              compact={sidebarCollapsed}
              side="right"
              align="start"
            />
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard
              const isActive = pathname === item.href || (item.href !== `/${currentSpace}` && pathname.startsWith(item.href))

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {link}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return link
            })}
          </nav>

        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar (minimal in sidebar mode) */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b md:border-b-0">
            <div className="px-3 sm:px-6 h-14 flex items-center justify-between">
              {/* Mobile: show full nav like header mode */}
              <div className="flex items-center gap-4 md:hidden">
                {mobileNavComponent}
                <Link href={`/${currentSpace}`} className="text-lg font-bold text-primary">
                  FormaCPV
                </Link>
              </div>
              <div className="hidden md:block" />
              <div className="flex items-center gap-3 md:hidden">
                <UserMenu
                  userName={userName}
                  userEmail={userEmail}
                  userRole={userRole}
                  currentSpace={currentSpace}
                />
              </div>
            </div>
          </header>
          <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8">
            <div className={maxWidth === 'max-w-4xl' ? 'max-w-4xl mx-auto' : ''}>
              {children}
            </div>
          </main>
        </div>
        <ChatBot userName={userName} currentSpace={currentSpace} />
      </div>
    )
  }

  // Default: Header layout
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 min-w-0">
            {mobileNavComponent}
            <Link href={`/${currentSpace}`} className="text-lg font-bold text-primary shrink-0">
              FormaCPV
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-2.5 py-1.5 rounded-md transition-colors ${
                    pathname === item.href || (item.href !== `/${currentSpace}` && pathname.startsWith(item.href))
                      ? 'text-foreground bg-accent font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SpaceSwitcher currentSpace={currentSpace} userRole={userRole} />
            <UserMenu
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              currentSpace={currentSpace}
            />
          </div>
        </div>
      </header>
      <main className="px-3 sm:px-6 py-6 sm:py-8">{children}</main>
      <ChatBot userName={userName} currentSpace={currentSpace} />
    </div>
  )
}
