'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Menu,
  LayoutDashboard,
  BookOpen,
  Route,
  GraduationCap,
  Users,
  ShieldCheck,
  MessageSquare,
  UserPlus,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  Route,
  GraduationCap,
  Users,
  ShieldCheck,
  MessageSquare,
  UserPlus,
  Upload,
}

export interface NavItem {
  href: string
  label: string
  icon: string
}

interface MobileNavProps {
  items: NavItem[]
  userName: string
  roleLabel: string
  roleBadgeClass: string
}

export function MobileNav({ items, userName, roleLabel, roleBadgeClass }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left text-lg font-bold">FormaCPV</SheetTitle>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground truncate">{userName}</span>
            <span className={`text-xs ${roleBadgeClass} px-2 py-0.5 rounded-full font-medium shrink-0`}>
              {roleLabel}
            </span>
          </div>
        </SheetHeader>
        <nav className="flex flex-col p-2">
          {items.map(item => {
            const Icon = iconMap[item.icon]
            return (
              <Button
                key={item.href}
                variant="ghost"
                className="justify-start h-10"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href={item.href}>
                  {Icon && <Icon className="mr-3 h-4 w-4" />}
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
