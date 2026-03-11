'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

interface SignOutButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
}

export function SignOutButton({
  variant = 'ghost',
  size = 'sm',
  showIcon = false,
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  const isIconOnly = size === 'icon'

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={isIconOnly ? 'h-8 w-8' : undefined}
      title="Déconnexion"
    >
      {isIconOnly ? (
        <LogOut className="h-4 w-4" />
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          {isLoading ? 'Déconnexion...' : 'Déconnexion'}
        </>
      )}
    </Button>
  )
}
