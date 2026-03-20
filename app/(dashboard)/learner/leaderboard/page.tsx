'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award, Star, BookOpen, HelpCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  completedModules: number
  totalModules: number
  badges: number
  avgQuizScore: number
  compositeScore: number
  isCurrentUser: boolean
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/learner/leaderboard')
        if (res.ok) {
          setEntries(await res.json())
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="h-5 w-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank}</span>
  }

  function getRankBg(rank: number, isCurrentUser: boolean) {
    if (isCurrentUser) return 'bg-primary/5 border-primary/20'
    if (rank === 1) return 'bg-yellow-50 border-yellow-200'
    if (rank === 2) return 'bg-gray-50 border-gray-200'
    if (rank === 3) return 'bg-amber-50 border-amber-200'
    return 'bg-background border-border'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classement</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comparez votre progression</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentUser = entries.find((e) => e.isCurrentUser)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classement</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Score basé sur la progression (40%), les quiz (40%) et les badges (20%)
        </p>
      </div>

      {/* Position actuelle */}
      {currentUser && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {getRankIcon(currentUser.rank)}
              Votre position
            </CardTitle>
            <CardDescription>
              {currentUser.rank === 1
                ? 'Vous êtes en tête !'
                : `Vous êtes ${currentUser.rank}${currentUser.rank === 1 ? 'er' : 'e'} sur ${entries.length} apprenants`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{currentUser.completedModules}/{currentUser.totalModules} modules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span>{currentUser.avgQuizScore}% quiz</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span>{currentUser.badges} badge{currentUser.badges !== 1 ? 's' : ''}</span>
              </div>
              <div className="ml-auto font-semibold text-primary">
                {currentUser.compositeScore} pts
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau du classement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Classement général
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun apprenant pour le moment
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                    getRankBg(entry.rank, entry.isCurrentUser)
                  )}
                >
                  {/* Rang */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Nom */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      entry.isCurrentUser && 'text-primary'
                    )}>
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="text-xs ml-2 text-primary/70">(vous)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.completedModules}/{entry.totalModules} modules
                      {' · '}
                      {entry.avgQuizScore}% quiz
                      {' · '}
                      {entry.badges} badge{entry.badges !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="font-semibold">{entry.compositeScore}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
