'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, User, EyeOff, Route } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackItem {
  id: string
  rating: number
  comment: string
  anonymous: boolean
  userName: string | null
  userEmail: string | null
  parcoursTitle: string | null
  createdAt: string
}

interface FeedbackStats {
  total: number
  average: number
  distribution: number[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'
          )}
        />
      ))}
    </div>
  )
}

function StatsCard({ stats }: { stats: FeedbackStats }) {
  const maxCount = Math.max(...stats.distribution, 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Statistiques
        </CardTitle>
        <CardDescription>{stats.total} avis au total</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-4xl font-bold">{stats.average}</span>
          <span className="text-muted-foreground text-lg">/5</span>
          <div className="flex justify-center mt-1">
            <StarRating rating={Math.round(stats.average)} />
          </div>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-right">{star}</span>
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${(stats.distribution[star - 1] / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">
                {stats.distribution[star - 1]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function FeedbackPageClient() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/feedback')
      .then((res) => res.json())
      .then((data) => {
        setFeedbacks(data.feedbacks)
        setStats(data.stats)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avis</h1>
          <p className="text-muted-foreground">Retours des apprenants sur la plateforme</p>
        </div>
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <Skeleton className="h-64" />
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avis</h1>
        <p className="text-muted-foreground">Retours des apprenants sur la plateforme</p>
      </div>

      {stats && stats.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium">Aucun avis pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les apprenants pourront donner leur avis après avoir complété leur parcours.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {stats && <StatsCard stats={stats} />}

          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <StarRating rating={feedback.rating} />
                        {feedback.parcoursTitle && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Route className="h-3 w-3" />
                            {feedback.parcoursTitle}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(feedback.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {feedback.comment && (
                        <p className="text-sm leading-relaxed">{feedback.comment}</p>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {feedback.anonymous ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Anonyme</span>
                          </>
                        ) : (
                          <>
                            <User className="h-3.5 w-3.5" />
                            <span>{feedback.userName} ({feedback.userEmail})</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
