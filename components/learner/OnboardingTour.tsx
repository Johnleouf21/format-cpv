'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'forma-onboarding-done'

interface TourStep {
  target: string // CSS selector or data-tour value
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="usermenu"]',
    title: 'Votre profil',
    description:
      'Accedez a vos parametres, notifications, et basculez entre le mode clair et sombre depuis votre menu profil.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    description:
      'Utilisez la barre laterale pour acceder a vos formations, consulter vos quiz passes et telecharger vos certificats.',
    position: 'right',
  },
  {
    target: '[data-tour="stats"]',
    title: 'Vos statistiques',
    description:
      'Suivez votre progression en temps reel : pourcentage d\'avancement, modules completes, quiz passes et score moyen.',
    position: 'bottom',
  },
  {
    target: '[data-tour="resume"]',
    title: 'Reprendre votre formation',
    description:
      'Ce bouton vous emmene directement au prochain module a suivre. Cliquez pour reprendre la ou vous en etiez !',
    position: 'bottom',
  },
  {
    target: '[data-tour="modules"]',
    title: 'Liste des modules',
    description:
      'Tous les modules de votre formation sont ici. Suivez-les dans l\'ordre, chacun se deverrouille apres le precedent. Un quiz peut vous attendre a la fin de certains modules.',
    position: 'top',
  },
  {
    target: '[data-tour="badges"]',
    title: 'Vos badges',
    description:
      'Debloquez des badges en completant des modules, en reussissant des quiz ou en terminant un parcours entier. Collectionnez-les tous !',
    position: 'top',
  },
  {
    target: '[data-tour="certificates"]',
    title: 'Certificat de reussite',
    description:
      'Une fois votre parcours termine, telechargez votre certificat officiel pour attester de votre formation.',
    position: 'top',
  },
  {
    target: '[data-tour="chatbot"]',
    title: 'Besoin d\'aide ?',
    description:
      'L\'assistant est disponible a tout moment. Posez-lui vos questions sur la plateforme, vos formations ou le fonctionnement des quiz. Vous pouvez aussi le deplacer en le maintenant appuye si il vous gene.',
    position: 'left',
  },
]

const TOOLTIP_HEIGHT = 180 // approximate max height of tooltip card

function getTooltipStyle(
  rect: DOMRect,
  position: TourStep['position']
): React.CSSProperties {
  const gap = 12
  const vh = window.innerHeight
  const vw = window.innerWidth

  // For left/right positions, check if tooltip would overflow vertically
  if (position === 'left' || position === 'right') {
    const centerY = rect.top + rect.height / 2
    const tooltipTop = centerY - TOOLTIP_HEIGHT / 2

    // If tooltip would go below viewport, position it above the element instead
    if (tooltipTop + TOOLTIP_HEIGHT > vh - 20) {
      return {
        position: 'fixed',
        bottom: vh - rect.top + gap,
        ...(position === 'left'
          ? { right: vw - rect.left + gap }
          : { left: rect.right + gap }),
      }
    }
  }

  switch (position) {
    case 'bottom':
      return {
        position: 'fixed',
        top: Math.min(rect.bottom + gap, vh - TOOLTIP_HEIGHT - 20),
        left: Math.min(Math.max(rect.left + rect.width / 2, 170), vw - 170),
        transform: 'translateX(-50%)',
      }
    case 'top':
      return {
        position: 'fixed',
        bottom: vh - rect.top + gap,
        left: Math.min(Math.max(rect.left + rect.width / 2, 170), vw - 170),
        transform: 'translateX(-50%)',
      }
    case 'right':
      return {
        position: 'fixed',
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: 'translateY(-50%)',
      }
    case 'left':
      return {
        position: 'fixed',
        top: rect.top + rect.height / 2,
        right: vw - rect.left + gap,
        transform: 'translateY(-50%)',
      }
  }
}

export function OnboardingTour() {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})
  const [availableSteps, setAvailableSteps] = useState<TourStep[]>([])
  const rafRef = useRef<number>(0)

  // Check localStorage on mount
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      // Small delay so the page finishes rendering
      const timer = setTimeout(() => setActive(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  // Filter steps to only those with visible targets
  useEffect(() => {
    if (!active) return
    const visible = STEPS.filter((step) => {
      const el = document.querySelector(step.target)
      return el && el.getBoundingClientRect().height > 0
    })
    setAvailableSteps(visible.length > 0 ? visible : STEPS.slice(0, 1))
  }, [active])

  const positionTooltip = useCallback(() => {
    if (!active || availableSteps.length === 0) return
    const step = availableSteps[currentStep]
    if (!step) return

    const el = document.querySelector(step.target)
    if (!el) return

    const rect = el.getBoundingClientRect()

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Highlight box
    const pad = 8
    setHighlightStyle({
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: '12px',
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
      pointerEvents: 'none',
      zIndex: 9998,
      transition: 'all 0.3s ease',
    })

    setTooltipStyle(getTooltipStyle(rect, step.position))
  }, [active, currentStep, availableSteps])

  useEffect(() => {
    positionTooltip()

    const handleResize = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(positionTooltip)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [positionTooltip])

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setActive(false)
  }, [])

  const next = () => {
    if (currentStep < availableSteps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      finish()
    }
  }

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  if (!active || availableSteps.length === 0) return null

  const step = availableSteps[currentStep]
  const isLast = currentStep === availableSteps.length - 1
  const isFirst = currentStep === 0

  return (
    <>
      {/* Highlight overlay */}
      <div style={highlightStyle} />

      {/* Tooltip card */}
      <div style={{ ...tooltipStyle, zIndex: 9999 }} className="w-80">
        <Card className="shadow-xl border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <h3 className="font-semibold text-sm">{step.title}</h3>
              </div>
              <button
                onClick={finish}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            <div className="flex items-center justify-between">
              {/* Dots */}
              <div className="flex gap-1">
                {availableSteps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/20'
                    )}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-1.5">
                {!isFirst && (
                  <Button size="sm" variant="ghost" onClick={prev} className="h-7 px-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" onClick={next} className="h-7 px-3">
                  {isLast ? 'Compris !' : 'Suivant'}
                  {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
