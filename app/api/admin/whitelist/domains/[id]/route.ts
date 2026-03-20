import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { removeAllowedDomain } from '@/lib/services/whitelist.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth('ADMIN')

    const { id } = await params
    await removeAllowedDomain(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
