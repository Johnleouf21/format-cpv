import { ApiError } from '@/lib/errors/api-error'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface UploadResult {
  url: string
  filename: string
}

export async function uploadImage(
  file: File,
  folder: string = 'modules'
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ApiError(
      400,
      'Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP',
      'INVALID_FILE_TYPE'
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(
      400,
      'Fichier trop volumineux. Maximum 5 Mo',
      'FILE_TOO_LARGE'
    )
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const filename = `${timestamp}-${randomStr}.${ext}`

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
  await mkdir(uploadDir, { recursive: true })

  const filePath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  return {
    url: `/uploads/${folder}/${filename}`,
    filename: `${folder}/${filename}`,
  }
}

export async function deleteImage(url: string): Promise<void> {
  // Local file - log only for safety
  console.log('Would delete local file:', url)
}