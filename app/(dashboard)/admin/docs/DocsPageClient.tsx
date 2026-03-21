'use client'

import { useMemo, useEffect, useState, useCallback, type ReactNode, type HTMLAttributes } from 'react'
import ReactMarkdown, { type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.min.css'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, List, ChevronRight, Folder, FolderOpen, File } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocsPageClientProps {
  content: string
}

interface TocItem {
  id: string
  text: string
  level: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return extractText((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

function generateToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n')
  const toc: TocItem[] = []
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[*`]/g, '')
      const id = slugify(text)
      toc.push({ id, text, level })
    }
  }
  return toc
}

// ─── File tree renderer ─────────────────────────────────────────────────────

interface TreeNode {
  name: string
  depth: number
  isDir: boolean
  comment?: string
}

function parseTree(text: string): TreeNode[] | null {
  const lines = text.split('\n').filter((l) => l.trim())
  // Detect if this is a file tree (contains ├── or └── or has directory-like structure)
  const isTree = lines.some((l) => /[├└│─]/.test(l) || /^\w+\//.test(l.trim()))
  if (!isTree || lines.length < 3) return null

  return lines.map((line) => {
    // Count depth by tree characters or spaces
    const stripped = line.replace(/[│├└─\s]/g, '')
    const depthMatch = line.match(/^(\s*(?:[│├└]\s*(?:──\s*)?))/)
    const depth = depthMatch ? Math.floor(depthMatch[1].replace(/[│├└─]/g, ' ').length / 2) : 0

    // Extract comment (after #)
    const commentMatch = stripped.match(/^(.+?)\s+#\s*(.+)$/)
    const name = commentMatch ? commentMatch[1] : stripped
    const comment = commentMatch ? commentMatch[2] : undefined

    const isDir = name.endsWith('/') || !name.includes('.')

    return { name: name.replace(/\/$/, ''), depth, isDir, comment }
  })
}

function FileTree({ code }: { code: string }) {
  const nodes = parseTree(code)
  if (!nodes) return null

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 my-4 font-mono text-sm overflow-x-auto">
      {nodes.map((node, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 py-0.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded px-1 -mx-1 transition-colors"
          style={{ paddingLeft: `${node.depth * 20}px` }}
        >
          {node.isDir ? (
            node.depth === 0 ? (
              <FolderOpen className="h-4 w-4 text-blue-400 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-400 shrink-0" />
            )
          ) : (
            <File className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          )}
          <span className={node.isDir ? 'text-blue-300 font-medium' : 'text-zinc-300'}>
            {node.name}
          </span>
          {node.comment && (
            <span className="text-zinc-600 text-xs ml-2">{'// ' + node.comment}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Scroll spy hook ────────────────────────────────────────────────────────

function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState<string>('')

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY + 100 // offset for sticky header

    let current = ''
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el && el.offsetTop <= scrollY) {
        current = id
      }
    }
    setActiveId(current)
  }, [ids])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return activeId
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DocsPageClient({ content }: DocsPageClientProps) {
  const toc = useMemo(() => generateToc(content), [content])
  const tocIds = useMemo(() => toc.map((t) => t.id), [toc])
  const activeId = useScrollSpy(tocIds)

  const headingComponent = (level: 1 | 2 | 3) =>
    function Heading({ children, ...props }: HTMLAttributes<HTMLHeadingElement> & ExtraProps) {
      const text = extractText(children)
      const id = slugify(text)
      const Tag = `h${level}` as const
      return <Tag id={id} {...props}>{children}</Tag>
    }

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

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

        {/* Sommaire sticky avec scroll-spy */}
        <Card className="lg:sticky lg:top-20">
          <CardContent className="pt-5 pb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <List className="h-4 w-4 text-primary" />
              Sommaire
            </h2>
            <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-2">
              {toc.map((item) => {
                const isActive = activeId === item.id
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      'group flex items-center gap-1.5 py-1 transition-all rounded-md px-2 -mx-2',
                      isActive
                        ? 'text-primary bg-primary/10 font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                  >
                    {item.level > 1 && (
                      <ChevronRight className={cn(
                        'h-3 w-3 shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-primary'
                      )} />
                    )}
                    {item.level === 1 && (
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                      )} />
                    )}
                    <span className={
                      item.level === 1
                        ? 'text-sm font-semibold'
                        : item.level === 2
                          ? 'text-[13px]'
                          : 'text-xs'
                    }>
                      {item.text}
                    </span>
                  </a>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Contenu */}
        <Card>
          <CardContent className="pt-6 pb-8 prose prose-sm dark:prose-invert max-w-none
            prose-headings:scroll-mt-20
            prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h1:mb-6
            prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-foreground/90
            prose-table:border prose-table:border-border prose-table:text-sm prose-table:w-full
            prose-th:bg-muted prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
            prose-td:px-4 prose-td:py-2 prose-td:border-t prose-td:border-border
            prose-code:bg-zinc-800 prose-code:text-emerald-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:rounded-xl prose-pre:p-0 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-zinc-700
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-li:marker:text-primary/60
            prose-strong:text-foreground prose-strong:font-semibold
            prose-hr:border-border prose-hr:my-8
            prose-ul:space-y-1
            prose-ol:space-y-1
            prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
          ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: headingComponent(1),
                h2: headingComponent(2),
                h3: headingComponent(3),
                pre: ({ children, ...props }) => {
                  // Check if this is a file tree block
                  const text = extractText(children)
                  const treeNodes = parseTree(text)
                  if (treeNodes) {
                    return <FileTree code={text} />
                  }
                  return <pre {...props}>{children}</pre>
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
