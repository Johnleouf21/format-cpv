import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  // En prod, ne loguer que le message (pas la stack trace complète)
  if (process.env.NODE_ENV === 'production') {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[API Error]', message)
  } else {
    console.error('API Error:', error)
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Données invalides', details: error.issues },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { error: 'Erreur interne du serveur' },
    { status: 500 }
  )
}
