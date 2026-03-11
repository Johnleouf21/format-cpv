'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Award } from 'lucide-react'

interface CertificateDownloadButtonProps {
  disabled?: boolean
  className?: string
}

export function CertificateDownloadButton({
  disabled,
  className,
}: CertificateDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/certificates/generate')

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la génération du certificat')
      }

      // Get the PDF blob
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'certificat.pdf'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/)
        if (match) {
          filename = match[1]
        }
      }

      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert('Erreur lors du téléchargement du certificat')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      className={className}
      size="lg"
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Génération en cours...
        </>
      ) : (
        <>
          <Award className="mr-2 h-5 w-5" />
          <Download className="mr-2 h-4 w-4" />
          Télécharger mon certificat
        </>
      )}
    </Button>
  )
}
