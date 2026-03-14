'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

interface CompleteModuleButtonProps {
  moduleId: string
  isCompleted: boolean
  nextModuleId?: string | null
  onCompleted?: (nextModuleId?: string) => void
  isTimeElapsed?: boolean
  timeRemaining?: number
  startedAt?: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CompleteModuleButton({
  moduleId,
  isCompleted,
  nextModuleId,
  onCompleted,
  isTimeElapsed = true,
  timeRemaining = 0,
  startedAt,
}: CompleteModuleButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/progress/${moduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startedAt }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la validation')
      }

      const data = await response.json()
      const nextId = data.nextModule?.id || nextModuleId

      if (onCompleted) {
        onCompleted(nextId)
        return
      }

      if (nextId) {
        router.push(`/learner/modules/${nextId}`)
      } else {
        router.push('/learner')
      }

      router.refresh()
    } catch (err) {
      console.error('Error completing module:', err)
      setError(err instanceof Error ? err.message : 'Erreur')
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
    <div className="space-y-2">
      <Button
        onClick={handleComplete}
        disabled={isLoading || !isTimeElapsed}
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          'Enregistrement...'
        ) : !isTimeElapsed ? (
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Disponible dans {formatTime(timeRemaining)}
          </span>
        ) : (
          "J'ai terminé ce module"
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
