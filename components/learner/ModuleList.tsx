'use client'

import { ModuleCard } from './ModuleCard'
import { BookOpen } from 'lucide-react'

interface Module {
  id: string
  title: string
  order: number
  isCompleted: boolean
  hasQuiz?: boolean
  quizScore?: { score: number; total: number } | null
}

interface ModuleListProps {
  modules: Module[]
}

export function ModuleList({ modules }: ModuleListProps) {
  // Find the first non-completed module (next to do)
  const nextModuleId = modules.find((m) => !m.isCompleted)?.id
  const completedCount = modules.filter((m) => m.isCompleted).length

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Votre parcours</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{modules.length} module{modules.length > 1 ? 's' : ''} complété{completedCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="relative">
        {modules.map((module, index) => (
          <div
            key={module.id}
            className={index === modules.length - 1 ? '[&_.timeline-line]:hidden' : ''}
          >
            <ModuleCard
              id={module.id}
              title={module.title}
              order={module.order}
              isCompleted={module.isCompleted}
              isNext={module.id === nextModuleId}
              hasQuiz={module.hasQuiz}
              quizScore={module.quizScore}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
