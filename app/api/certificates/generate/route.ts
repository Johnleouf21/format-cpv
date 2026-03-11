import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCertificateData, canGenerateCertificate } from '@/lib/services/certificate.service'
import { CertificateTemplate } from '@/components/pdf/CertificateTemplate'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Check if user can generate certificate
    const canGenerate = await canGenerateCertificate(session.user.id)
    if (!canGenerate) {
      throw new ApiError(
        400,
        'Le parcours n\'est pas encore complété',
        'PARCOURS_NOT_COMPLETED'
      )
    }

    // Get certificate data
    const certificateData = await getCertificateData(session.user.id)

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
