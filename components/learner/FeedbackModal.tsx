'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment, anonymous }),
      })
      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => onClose(), 2000)
      }
    } catch {
      // silently fail
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Star className="h-8 w-8 text-green-600 fill-green-600" />
            </div>
            <DialogTitle className="text-xl">Merci pour votre avis !</DialogTitle>
            <DialogDescription className="text-center">
              Votre retour nous aide a ameliorer la plateforme.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Donnez votre avis</DialogTitle>
          <DialogDescription>
            Que pensez-vous de cette plateforme de formation ? Votre retour est precieux pour nous aider a l&apos;ameliorer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Star rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Votre note</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hoveredRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {rating === 1 && 'Pas satisfait'}
                {rating === 2 && 'Peu satisfait'}
                {rating === 3 && 'Correct'}
                {rating === 4 && 'Satisfait'}
                {rating === 5 && 'Tres satisfait'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Votre commentaire (optionnel)</label>
            <Textarea
              placeholder="Ce que vous aimez, ce qui pourrait etre ameliore..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                anonymous ? 'bg-primary' : 'bg-muted'
              )}
              onClick={() => setAnonymous(!anonymous)}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                  anonymous ? 'translate-x-[18px]' : 'translate-x-[2px]'
                )}
              />
            </div>
            <span className="text-sm">
              {anonymous ? 'Avis anonyme' : 'Avis nominatif'}
            </span>
          </label>
          {anonymous && (
            <p className="text-xs text-muted-foreground -mt-3 ml-12">
              Votre nom ne sera pas visible par l&apos;administrateur
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Plus tard
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
