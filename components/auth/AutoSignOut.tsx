'use client'

import { useEffect, useRef } from 'react'

export function AutoSignOut() {
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    async function clearSession() {
      try {
        // Get CSRF token from NextAuth
        const csrfRes = await fetch('/api/auth/csrf')
        const { csrfToken } = await csrfRes.json()

        // Sign out without redirect (just clears the cookie)
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ csrfToken }),
          redirect: 'manual', // Don't follow the redirect
        })
      } catch {
        // Ignore — no session to clear
      }
    }

    clearSession()
  }, [])

  return null
}
