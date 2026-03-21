import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DocsPageClient } from './DocsPageClient'
import fs from 'fs'
import path from 'path'

export default async function AdminDocsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Lire le fichier markdown côté serveur
  const filePath = path.join(process.cwd(), 'docs', 'TECHNICAL.md')
  let content = ''
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    content = '# Documentation non trouvée\n\nLe fichier docs/TECHNICAL.md est introuvable.'
  }

  return <DocsPageClient content={content} />
}
