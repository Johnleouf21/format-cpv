'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  HelpCircle,
  CheckCircle,
  GripVertical,
  AlertCircle,
} from 'lucide-react'

interface Answer {
  text: string
  isCorrect: boolean
}

interface Question {
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  answers: Answer[]
}

interface QuizEditorProps {
  moduleId: string
}

export function QuizEditor({ moduleId }: QuizEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasQuiz, setHasQuiz] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/admin/modules/${moduleId}/quiz`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setHasQuiz(true)
            setQuestions(
              data.questions.map((q: { text: string; type: string; answers: { text: string; isCorrect: boolean }[] }) => ({
                text: q.text,
                type: q.type as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE',
                answers: q.answers.map((a: { text: string; isCorrect: boolean }) => ({
                  text: a.text,
                  isCorrect: a.isCorrect,
                })),
              }))
            )
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuiz()
  }, [moduleId])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'SINGLE_CHOICE',
        answers: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
      },
    ])
  }

  const removeQuestion = (qi: number) => {
    setQuestions(questions.filter((_, i) => i !== qi))
  }

  const updateQuestion = (qi: number, field: Partial<Question>) => {
    setQuestions(questions.map((q, i) => (i === qi ? { ...q, ...field } : q)))
  }

  const addAnswer = (qi: number) => {
    setQuestions(
      questions.map((q, i) =>
        i === qi ? { ...q, answers: [...q.answers, { text: '', isCorrect: false }] } : q
      )
    )
  }

  const removeAnswer = (qi: number, ai: number) => {
    setQuestions(
      questions.map((q, i) =>
        i === qi ? { ...q, answers: q.answers.filter((_, j) => j !== ai) } : q
      )
    )
  }

  const updateAnswer = (qi: number, ai: number, field: Partial<Answer>) => {
    setQuestions(
      questions.map((q, i) =>
        i === qi
          ? {
              ...q,
              answers: q.answers.map((a, j) => {
                if (j !== ai) {
                  // For SINGLE_CHOICE, uncheck other answers when one is checked
                  if (q.type === 'SINGLE_CHOICE' && field.isCorrect) {
                    return { ...a, isCorrect: false }
                  }
                  return a
                }
                return { ...a, ...field }
              }),
            }
          : q
      )
    )
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.text.trim()) {
        setError(`Question ${i + 1} : le texte est requis`)
        return
      }
      if (q.answers.length < 2) {
        setError(`Question ${i + 1} : au moins 2 réponses sont requises`)
        return
      }
      if (!q.answers.some((a) => a.isCorrect)) {
        setError(`Question ${i + 1} : au moins une bonne réponse est requise`)
        return
      }
      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].text.trim()) {
          setError(`Question ${i + 1}, réponse ${j + 1} : le texte est requis`)
          return
        }
      }
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}/quiz`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.map((q, qi) => ({
            text: q.text,
            type: q.type,
            order: qi,
            answers: q.answers.map((a, ai) => ({
              text: a.text,
              isCorrect: a.isCorrect,
              order: ai,
            })),
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Erreur lors de la sauvegarde')
      }

      setHasQuiz(true)
      setSuccess('Quiz sauvegardé avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setError(null)
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}/quiz`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setQuestions([])
        setHasQuiz(false)
        setSuccess('Quiz supprimé')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch {
      setError('Erreur lors de la suppression')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-violet-600" />
            Quiz
            {hasQuiz && (
              <Badge variant="secondary" className="text-xs">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {hasQuiz && questions.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isSaving}>
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer le quiz
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {questions.length === 0 ? (
          <div className="text-center py-6">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucun quiz pour ce module. Ajoutez des questions pour créer un quiz.
            </p>
            <Button onClick={addQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
          </div>
        ) : (
          <>
            {questions.map((question, qi) => (
              <div key={qi} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0">Q{qi + 1}</Badge>
                      <Input
                        value={question.text}
                        onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                        placeholder="Texte de la question..."
                        className="flex-1"
                      />
                      <Select
                        value={question.type}
                        onValueChange={(v) => updateQuestion(qi, { type: v as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE_CHOICE">Choix unique</SelectItem>
                          <SelectItem value="MULTIPLE_CHOICE">Choix multiple</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => removeQuestion(qi)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-2">
                      <Label className="text-xs text-muted-foreground">
                        Réponses (cochez les bonnes réponses)
                      </Label>
                      {question.answers.map((answer, ai) => (
                        <div key={ai} className="flex items-center gap-2">
                          <Checkbox
                            checked={answer.isCorrect}
                            onCheckedChange={(checked) =>
                              updateAnswer(qi, ai, { isCorrect: !!checked })
                            }
                          />
                          <Input
                            value={answer.text}
                            onChange={(e) => updateAnswer(qi, ai, { text: e.target.value })}
                            placeholder={`Réponse ${ai + 1}...`}
                            className={`flex-1 ${answer.isCorrect ? 'border-green-300 bg-green-50/50' : ''}`}
                          />
                          {question.answers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => removeAnswer(qi, ai)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => addAnswer(qi)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Ajouter une réponse
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une question
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder le quiz
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
