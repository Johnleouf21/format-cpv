'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface CompleteModuleButtonProps {
  moduleId: string
  isCompleted: boolean
  nextModuleId?: string | null
  onCompleted?: (nextModuleId?: string) => void
}

export function CompleteModuleButton({
  moduleId,
  isCompleted,
  nextModuleId,
  onCompleted,
}: CompleteModuleButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/progress/${moduleId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to mark module as completed')
      }

      const data = await response.json()
      const nextId = data.nextModule?.id || nextModuleId

      // If parent handles completion, call callback
      if (onCompleted) {
        onCompleted(nextId)
        return
      }

      // Otherwise, navigate
      if (nextId) {
        router.push(`/learner/modules/${nextId}`)
      } else {
        router.push('/learner')
      }

      router.refresh()
    } catch (error) {
      console.error('Error completing module:', error)
      setIsLoading(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium">Module complété</span>
      </div>
    )
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={isLoading}
      size="lg"
      className="w-full"
    >
      {isLoading ? 'Enregistrement...' : "J'ai terminé ce module"}
    </Button>
  )
}
