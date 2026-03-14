// ─── Chatbot Fuzzy Search Engine ─────────────────────────────────────────────

import { type QA, KNOWLEDGE_BASE } from './knowledge'

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, ' ')
}

/** Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

/** Check if query word fuzzy-matches a keyword */
function fuzzyMatch(queryWord: string, keyword: string): boolean {
  // Exact substring
  if (keyword.includes(queryWord) || queryWord.includes(keyword)) return true

  // For short words, require exact or substring match
  if (queryWord.length <= 3) return false

  // Levenshtein: allow 1 error per 4 chars
  const maxDist = Math.floor(queryWord.length / 4) + 1
  const dist = levenshtein(queryWord, keyword)
  return dist <= maxDist
}

interface ScoredMatch {
  qa: QA
  score: number
}

function findMatches(query: string, role: string): ScoredMatch[] {
  const q = normalize(query)
  const queryWords = q.split(/\s+/).filter((w) => w.length >= 2)

  const scored: ScoredMatch[] = []

  for (const qa of KNOWLEDGE_BASE) {
    if (qa.roles && !qa.roles.includes(role)) continue

    // Exact question match
    if (normalize(qa.question) === q) {
      scored.push({ qa, score: 1000 })
      continue
    }

    let score = 0

    // Keyword matching (exact + fuzzy)
    for (const keyword of qa.keywords) {
      const nk = normalize(keyword)
      // Check if any query word matches this keyword
      for (const qw of queryWords) {
        if (nk.includes(qw) || qw.includes(nk)) {
          score += nk.length * 2 // exact match bonus
        } else if (fuzzyMatch(qw, nk)) {
          score += nk.length // fuzzy match
        }
      }
      // Also check full query contains keyword
      if (q.includes(nk)) {
        score += nk.length * 2
      }
    }

    // Question similarity bonus
    const questionWords = normalize(qa.question).split(/\s+/)
    for (const qw of queryWords) {
      if (questionWords.some((w) => w.includes(qw) || qw.includes(w))) {
        score += 2
      }
    }

    if (score > 0) {
      scored.push({ qa, score })
    }
  }

  return scored.sort((a, b) => b.score - a.score)
}

export function findAnswer(query: string, role: string): { best: QA | null; similar: QA[] } {
  const matches = findMatches(query, role)

  if (matches.length === 0) return { best: null, similar: [] }

  const best = matches[0].score >= 4 ? matches[0].qa : null
  const similar = best
    ? matches.slice(1, 4).map((m) => m.qa)
    : matches.slice(0, 3).map((m) => m.qa)

  return { best, similar }
}
