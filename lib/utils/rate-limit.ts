import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Nombre maximum de requêtes dans la fenêtre */
  maxRequests: number
  /** Durée de la fenêtre en secondes */
  windowSeconds: number
}

/**
 * Identifie le client par IP (forwarded ou directe)
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Vérifie le rate limit pour une requête donnée.
 * Retourne null si OK, ou une Response 429 si dépassé.
 */
export function checkRateLimit(
  request: NextRequest,
  prefix: string,
  options: RateLimitOptions
): NextResponse | null {
  const ip = getClientIP(request)
  const key = `${prefix}:${ip}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 })
    return null
  }

  entry.count++

  if (entry.count > options.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  return null
}
