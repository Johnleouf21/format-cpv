'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InviteForm } from './InviteForm'
import { LinkDisplay } from './LinkDisplay'
import { InvitationsHistory } from './InvitationsHistory'
import { UserPlus, History } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface Invitation {
  id: string
  token: string
  email: string | null
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
  parcours: {
    title: string
  }
  usedBy: {
    name: string
    email: string
  } | null
}

interface InvitePageClientProps {
  parcoursList: Parcours[]
  initialInvitations: Invitation[]
}

interface GeneratedInvitation {
  token: string
  email?: string
  parcoursTitle: string
  expiresAt: string
}

export function InvitePageClient({
  parcoursList,
  initialInvitations,
}: InvitePageClientProps) {
  const [invitations, setInvitations] = useState(initialInvitations)
  const [generatedInvitation, setGeneratedInvitation] =
    useState<GeneratedInvitation | null>(null)

  const handleInvitationCreated = (invitation: GeneratedInvitation) => {
    setGeneratedInvitation(invitation)
    // Refresh invitations list
    refreshInvitations()
  }

  const refreshInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error('Error refreshing invitations:', error)
    }
  }

  const handleDeleteInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== id))
      }
    } catch (error) {
      console.error('Error deleting invitation:', error)
    }
  }

  // Transform dates to strings for the history component
  const transformedInvitations = invitations.map((inv) => ({
    ...inv,
    expiresAt: new Date(inv.expiresAt).toISOString(),
    usedAt: inv.usedAt ? new Date(inv.usedAt).toISOString() : null,
    createdAt: new Date(inv.createdAt).toISOString(),
  }))

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left column: Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/5">
                <UserPlus className="h-4.5 w-4.5 text-primary" />
              </div>
              Nouvelle invitation
            </CardTitle>
            <CardDescription>
              Sélectionnez un parcours et générez un lien d&apos;invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm
              parcoursList={parcoursList}
              onInvitationCreated={handleInvitationCreated}
            />
          </CardContent>
        </Card>

        {/* Generated link display */}
        {generatedInvitation && (
          <LinkDisplay
            token={generatedInvitation.token}
            email={generatedInvitation.email}
            parcoursTitle={generatedInvitation.parcoursTitle}
            expiresAt={generatedInvitation.expiresAt}
          />
        )}
      </div>

      {/* Right column: History */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-50">
                <History className="h-4.5 w-4.5 text-amber-600" />
              </div>
              Historique des invitations
            </CardTitle>
            <CardDescription>
              Liste des invitations créées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationsHistory
              invitations={transformedInvitations}
              onDelete={handleDeleteInvitation}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
