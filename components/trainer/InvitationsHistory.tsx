'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Trash2, Loader2 } from 'lucide-react'

interface Invitation {
  id: string
  token: string
  email: string | null
  expiresAt: string
  usedAt: string | null
  createdAt: string
  parcours: {
    title: string
  }
  usedBy: {
    name: string
    email: string
  } | null
}

interface InvitationsHistoryProps {
  invitations: Invitation[]
  onDelete?: (id: string) => Promise<void>
}

export function InvitationsHistory({
  invitations,
  onDelete,
}: InvitationsHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getStatus = (invitation: Invitation) => {
    if (invitation.usedAt) {
      return { label: 'Utilisé', variant: 'default' as const, color: 'bg-green-500' }
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return { label: 'Expiré', variant: 'secondary' as const, color: '' }
    }
    return { label: 'Actif', variant: 'default' as const, color: 'bg-blue-500' }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  const handleCopy = async (token: string, id: string) => {
    try {
      const link = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!onDelete) return
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune invitation créée
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Expire le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const status = getStatus(invitation)
            return (
              <TableRow key={invitation.id}>
                <TableCell>
                  {invitation.usedBy ? (
                    <div>
                      <p className="font-medium">{invitation.usedBy.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {invitation.usedBy.email}
                      </p>
                    </div>
                  ) : invitation.email ? (
                    invitation.email
                  ) : (
                    <span className="text-muted-foreground">Non spécifié</span>
                  )}
                </TableCell>
                <TableCell>{invitation.parcours.title}</TableCell>
                <TableCell>
                  <Badge className={status.color}>{status.label}</Badge>
                </TableCell>
                <TableCell>{formatDate(invitation.createdAt)}</TableCell>
                <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!invitation.usedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(invitation.token, invitation.id)}
                        disabled={new Date(invitation.expiresAt) < new Date()}
                      >
                        {copiedId === invitation.id ? (
                          'Copié!'
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {!invitation.usedAt && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(invitation.id)}
                        disabled={deletingId === invitation.id}
                      >
                        {deletingId === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
