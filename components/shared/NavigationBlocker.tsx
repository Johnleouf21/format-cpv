'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface NavigationBlockerProps {
  active: boolean
  title?: string
  message: string
}

/**
 * Bloque les tentatives de navigation pendant qu'un travail est en cours.
 * - Affiche une alerte navigateur sur fermeture/refresh d'onglet
 * - Intercepte les clics sur les liens internes pour demander confirmation
 */
export function NavigationBlocker({
  active,
  title = 'Quitter cette page ?',
  message,
}: NavigationBlockerProps) {
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      const link = target.closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href) return

      // Skip anchors, external protocols and same-page targets
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (link.target === '_blank') return

      const currentPath = window.location.pathname
      if (href === currentPath || href === window.location.href) return
      if (href.startsWith(currentPath + '#') || href.startsWith(currentPath + '?')) return

      // External http(s) links should also block
      e.preventDefault()
      e.stopPropagation()
      setPendingHref(href)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick, true)
    }
  }, [active])

  return (
    <AlertDialog open={!!pendingHref} onOpenChange={(open) => !open && setPendingHref(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Rester sur la page</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pendingHref) {
                if (pendingHref.startsWith('http')) {
                  window.location.href = pendingHref
                } else {
                  router.push(pendingHref)
                }
              }
              setPendingHref(null)
            }}
          >
            Quitter quand même
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
