import { ApiError } from '@/lib/errors/api-error'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface UploadResult {
  url: string
  filename: string
}

function getAzureBlobClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    return null
  }

  // Lazy import Azure SDK only when needed
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BlobServiceClient } = require('@azure/storage-blob')
    return BlobServiceClient.fromConnectionString(connectionString)
  } catch {
    console.warn('Azure Storage SDK not installed, using local storage')
    return null
  }
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

  // Try Azure Blob Storage first
  const azureClient = getAzureBlobClient()
  if (azureClient) {
    return uploadToAzure(azureClient, file, folder, filename)
  }

  // Fallback to local storage
  return uploadToLocal(file, folder, filename)
}

async function uploadToAzure(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blobServiceClient: any,
  file: File,
  folder: string,
  filename: string
): Promise<UploadResult> {
  const containerName = process.env.AZURE_STORAGE_CONTAINER || 'module-images'
  const containerClient = blobServiceClient.getContainerClient(containerName)

  // Create container if it doesn't exist
  await containerClient.createIfNotExists({ access: 'blob' })

  const blobPath = `${folder}/${filename}`
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath)

  const buffer = Buffer.from(await file.arrayBuffer())
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: file.type,
    },
  })

  return {
    url: blockBlobClient.url,
    filename: blobPath,
  }
}

async function uploadToLocal(
  file: File,
  folder: string,
  filename: string
): Promise<UploadResult> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)

  // Ensure directory exists
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
  // Check if it's an Azure URL
  if (url.includes('blob.core.windows.net')) {
    const azureClient = getAzureBlobClient()
    if (azureClient) {
      try {
        const containerName = process.env.AZURE_STORAGE_CONTAINER || 'module-images'
        const containerClient = azureClient.getContainerClient(containerName)

        // Extract blob name from URL
        const urlObj = new URL(url)
        const blobName = urlObj.pathname.split('/').slice(2).join('/')

        const blockBlobClient = containerClient.getBlockBlobClient(blobName)
        await blockBlobClient.deleteIfExists()
      } catch (error) {
        console.error('Error deleting from Azure:', error)
      }
    }
    return
  }

  // Local file - just log, don't actually delete for safety
  console.log('Would delete local file:', url)
}
