'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Mail } from 'lucide-react'

interface EmailPreviewListProps {
  emails: string[]
  onRemove: (email: string) => void
  onClear: () => void
}

export function EmailPreviewList({
  emails,
  onRemove,
  onClear,
}: EmailPreviewListProps) {
  if (emails.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Emails à inviter
            </CardTitle>
            <CardDescription>
              {emails.length} email{emails.length > 1 ? 's' : ''} importé
              {emails.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Tout effacer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
          {emails.map((email) => (
            <Badge
              key={email}
              variant="secondary"
              className="pr-1 flex items-center gap-1"
            >
              {email}
              <button
                onClick={() => onRemove(email)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
