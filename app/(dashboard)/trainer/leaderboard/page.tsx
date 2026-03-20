'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, Loader2, Zap, Star, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback } from 'react'

interface Center {
  id: string
  name: string
}

interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  email: string
  centers: Center[]
  xp: number
  level: number
  levelProgress: number
  breakdown: {
    modules: number
    quizzes: number
    badges: number
    parcours: number
  }
}

export default function TrainerLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [selectedCenters, setSelectedCenters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLeaderboard = useCallback(async (centerIds: string[] = []) => {
    try {
      const params = centerIds.length > 0
        ? '?' + centerIds.map((id) => `centerId=${id}`).join('&')
        : ''
      const res = await fetch(`/api/trainers/me/leaderboard${params}`)
      if (res.ok) {
        setEntries(await res.json())
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const [, centersRes] = await Promise.all([
          fetchLeaderboard(),
          fetch('/api/admin/centers'),
        ])
        if (centersRes.ok) {
          setCenters(await centersRes.json())
        }
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [fetchLeaderboard])

  function toggleCenter(centerId: string) {
    setSelectedCenters((prev) => {
      const next = prev.includes(centerId)
        ? prev.filter((id) => id !== centerId)
        : [...prev, centerId]
      fetchLeaderboard(next)
      return next
    })
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />
    return <span className="text-sm text-muted-foreground">{rank}</span>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classement</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Progression de vos apprenants</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalXP = entries.reduce((sum, e) => sum + e.xp, 0)
  const avgXP = entries.length > 0 ? Math.round(totalXP / entries.length) : 0
  const avgLevel = entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + e.level, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classement</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {entries.length} apprenant{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
        {centers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {centers.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={selectedCenters.includes(c.id)}
                  onCheckedChange={() => toggleCenter(c.id)}
                />
                <span className="text-xs">{c.name}</span>
              </label>
            ))}
            {selectedCenters.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedCenters.length} filtre{selectedCenters.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Stats résumé */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Zap className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{avgXP}</p>
            <p className="text-xs text-muted-foreground">XP moyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Star className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{avgLevel}</p>
            <p className="text-xs text-muted-foreground">Niveau moyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalXP}</p>
            <p className="text-xs text-muted-foreground">XP total groupe</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Détail par apprenant
          </CardTitle>
          <CardDescription>
            Répartition des XP : modules, quiz, badges et parcours complétés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun apprenant dans votre groupe
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Apprenant</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead className="text-center">Niveau</TableHead>
                  <TableHead className="text-center">Modules</TableHead>
                  <TableHead className="text-center">Quiz</TableHead>
                  <TableHead className="text-center">Badges</TableHead>
                  <TableHead className="text-center">Parcours</TableHead>
                  <TableHead className="text-right">Total XP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className={cn(entry.rank <= 3 && 'bg-muted/30')}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.centers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.centers.map((c) => (
                            <span key={c.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          Niv. {entry.level}
                        </span>
                        <Progress value={entry.levelProgress} className="h-1 w-10" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{entry.breakdown.modules}</TableCell>
                    <TableCell className="text-center text-sm">{entry.breakdown.quizzes}</TableCell>
                    <TableCell className="text-center text-sm">{entry.breakdown.badges}</TableCell>
                    <TableCell className="text-center text-sm">{entry.breakdown.parcours}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="font-semibold">{entry.xp}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
