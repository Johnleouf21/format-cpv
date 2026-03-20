'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Users, BookOpen, HelpCircle, Loader2 } from 'lucide-react'

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(type: 'learners' | 'progress' | 'quiz') {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/admin/export?type=${type}`)
      if (!response.ok) throw new Error('Erreur lors de l\'export')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `export-${type}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exporter CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('learners')}>
          <Users className="h-4 w-4 mr-2" />
          Apprenants et progression
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('progress')}>
          <BookOpen className="h-4 w-4 mr-2" />
          Détail des modules complétés
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('quiz')}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Résultats des quiz
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
