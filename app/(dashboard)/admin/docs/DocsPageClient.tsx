'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface DocsPageClientProps {
  content: string
}

export function DocsPageClient({ content }: DocsPageClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Documentation technique
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Architecture, stack technique et fonctionnalités de la plateforme
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none
          prose-headings:scroll-mt-20
          prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:pb-3 prose-h1:mb-6
          prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2
          prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
          prose-table:border prose-table:border-border prose-table:text-sm
          prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-medium
          prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border
          prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
          prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-li:marker:text-muted-foreground
          prose-strong:text-foreground
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  )
}
