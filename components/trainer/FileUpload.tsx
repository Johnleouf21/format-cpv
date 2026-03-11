'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet } from 'lucide-react'
import Papa from 'papaparse'

interface FileUploadProps {
  onEmailsLoaded: (emails: string[]) => void
  onError: (error: string) => void
}

export function FileUpload({ onEmailsLoaded, onError }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (fileExtension === 'csv' || fileExtension === 'txt') {
        Papa.parse(file, {
          complete: (results) => {
            const emails = extractEmails(results.data as string[][])
            if (emails.length === 0) {
              onError('Aucun email valide trouvé dans le fichier')
              return
            }
            onEmailsLoaded(emails)
          },
          error: () => {
            onError('Erreur lors de la lecture du fichier CSV')
          },
        })
      } else {
        onError('Format de fichier non supporté. Utilisez un fichier CSV.')
      }
    },
    [onEmailsLoaded, onError]
  )

  const extractEmails = (data: string[][]): string[] => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = new Set<string>()

    for (const row of data) {
      for (const cell of row) {
        const trimmed = cell?.trim()
        if (trimmed && emailRegex.test(trimmed)) {
          emails.add(trimmed.toLowerCase())
        }
      }
    }

    return Array.from(emails)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <Upload className="h-12 w-12 text-primary" />
        ) : (
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium">
            {isDragActive
              ? 'Déposez le fichier ici'
              : 'Glissez-déposez un fichier CSV'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ou cliquez pour sélectionner
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Format attendu: une colonne avec les adresses email
        </p>
      </div>
    </div>
  )
}
