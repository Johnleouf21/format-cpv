import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCertificateData, canGenerateCertificate } from '@/lib/services/certificate.service'
import { CertificateTemplate } from '@/components/pdf/CertificateTemplate'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const parcoursId = searchParams.get('parcoursId') || undefined

    // Check if user can generate certificate
    const canGenerate = await canGenerateCertificate(session.user.id, parcoursId)
    if (!canGenerate) {
      throw new ApiError(
        400,
        'Le parcours n\'est pas encore complété',
        'PARCOURS_NOT_COMPLETED'
      )
    }

    // Get certificate data
    const certificateData = await getCertificateData(session.user.id, parcoursId)

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CertificateTemplate({ data: certificateData }) as any
    )

    // Generate filename
    const fileName = `certificat-${certificateData.parcoursTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
