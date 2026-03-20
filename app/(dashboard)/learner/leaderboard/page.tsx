'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, Medal, Award, Loader2, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  xp: number
  level: number
  levelProgress: number
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
          Classement entre apprenants de votre groupe
        </p>
      </div>

      {/* Position actuelle */}
      {currentUser && (
        <Card className="border-primary/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {getRankIcon(currentUser.rank)}
              Votre position
            </CardTitle>
            <CardDescription>
              {currentUser.rank === 1
                ? 'Vous êtes en tête !'
                : `${currentUser.rank}${currentUser.rank === 1 ? 'er' : 'e'} sur ${entries.length} apprenants`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold">{currentUser.xp} XP</span>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                <Star className="h-3 w-3 fill-indigo-500" />
                <span className="text-xs font-bold">Niv. {currentUser.level}</span>
              </div>
              <div className="flex-1 max-w-32">
                <Progress value={currentUser.levelProgress} className="h-1.5" />
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
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                        Niv. {entry.level}
                      </span>
                      <Progress value={entry.levelProgress} className="h-1 w-12" />
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-indigo-500" />
                      <p className="font-semibold">{entry.xp}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">XP</p>
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
