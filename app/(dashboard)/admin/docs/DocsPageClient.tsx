'use client'

import { useMemo, useEffect, useState, useCallback, type ReactNode, type HTMLAttributes } from 'react'
import ReactMarkdown, { type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.min.css'
import { Card, CardContent } from '@/components/ui/card'
import {
  FileText, List, ChevronRight, Folder, FolderOpen, File,
  FileCode, FileJson, Database, Globe, Shield, Settings, Terminal,
  Palette, Layout, Braces, Server, TestTube, BookOpen, Cog,
  Layers, Rocket, Lock, Wrench, Users, BarChart3, Workflow,
  type LucideIcon,
} from 'lucide-react'
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

const tocIcons: Record<string, LucideIcon> = {
  'stack technique': Layers,
  'architecture': Folder,
  'structure': Folder,
  'fonctionnalités': Wrench,
  'fonctionnalites': Wrench,
  'authentification': Lock,
  'sécurité': Shield,
  'securite': Shield,
  'rôles': Users,
  'roles': Users,
  'rbac': Shield,
  'déploiement': Rocket,
  'deploiement': Rocket,
  'ci/cd': Workflow,
  'pipeline': Workflow,
  'performance': BarChart3,
  'base de données': Database,
  'base de donnees': Database,
  'api': Server,
  'email': Globe,
  'tests': TestTube,
  'configuration': Settings,
  'variables': Settings,
}

function getTocIcon(text: string): LucideIcon | null {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [key, icon] of Object.entries(tocIcons)) {
    const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (lower.includes(normalizedKey)) return icon
  }
  return null
}

function generateToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n')
  const toc: TocItem[] = []
  let inCodeBlock = false

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

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
  const isTree = lines.some((l) => /[├└│─]/.test(l))
  if (!isTree || lines.length < 3) return null

  return lines.map((line) => {
    // Count depth: each level of tree drawing is ~4 chars (│   or ├── or └──)
    const prefixMatch = line.match(/^([\s│├└─]*)/)
    const prefix = prefixMatch ? prefixMatch[1] : ''
    const depth = Math.floor(prefix.length / 4)

    // Extract the actual name + comment from after the tree characters
    const content = line.replace(/^[\s│├└─]*/, '').trim()

    // Split name and comment (comment starts with #)
    const commentIdx = content.indexOf('#')
    let name: string
    let comment: string | undefined

    if (commentIdx > 0) {
      name = content.substring(0, commentIdx).trim()
      comment = content.substring(commentIdx + 1).trim()
    } else {
      name = content
    }

    const isDir = name.endsWith('/') || (!name.includes('.') && name !== '...')

    return { name: name.replace(/\/$/, ''), depth, isDir, comment }
  })
}

function getFileIcon(name: string, isDir: boolean, depth: number) {
  if (isDir) {
    const dirName = name.toLowerCase()
    if (depth === 0) return <FolderOpen className="h-4 w-4 text-blue-400 shrink-0" />
    if (dirName === 'api') return <Server className="h-4 w-4 text-green-400 shrink-0" />
    if (dirName === 'components' || dirName === 'ui') return <Layout className="h-4 w-4 text-purple-400 shrink-0" />
    if (dirName === 'lib' || dirName === 'utils') return <Braces className="h-4 w-4 text-orange-400 shrink-0" />
    if (dirName === 'services') return <Cog className="h-4 w-4 text-cyan-400 shrink-0" />
    if (dirName === 'auth') return <Shield className="h-4 w-4 text-red-400 shrink-0" />
    if (dirName === 'prisma') return <Database className="h-4 w-4 text-teal-400 shrink-0" />
    if (dirName === 'tests' || dirName === 'test') return <TestTube className="h-4 w-4 text-yellow-300 shrink-0" />
    if (dirName === 'admin') return <Shield className="h-4 w-4 text-red-400 shrink-0" />
    if (dirName === 'learner') return <BookOpen className="h-4 w-4 text-green-400 shrink-0" />
    if (dirName === 'trainer') return <BookOpen className="h-4 w-4 text-blue-300 shrink-0" />
    if (dirName === 'chatbot') return <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
    if (dirName === 'shared') return <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
    if (dirName === 'profile') return <Settings className="h-4 w-4 text-gray-400 shrink-0" />
    if (dirName === 'validations' || dirName === 'errors') return <Shield className="h-4 w-4 text-amber-400 shrink-0" />
    return <Folder className="h-4 w-4 text-yellow-400 shrink-0" />
  }

  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'tsx') return <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />
  if (ext === 'ts') return <FileCode className="h-3.5 w-3.5 text-blue-300 shrink-0" />
  if (ext === 'css') return <Palette className="h-3.5 w-3.5 text-pink-400 shrink-0" />
  if (ext === 'json') return <FileJson className="h-3.5 w-3.5 text-yellow-300 shrink-0" />
  if (ext === 'prisma') return <Database className="h-3.5 w-3.5 text-teal-400 shrink-0" />
  if (ext === 'yml' || ext === 'yaml') return <Settings className="h-3.5 w-3.5 text-red-300 shrink-0" />
  if (ext === 'md') return <FileText className="h-3.5 w-3.5 text-gray-300 shrink-0" />
  if (ext === 'mjs' || ext === 'js') return <FileCode className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
  if (ext === 'env') return <Shield className="h-3.5 w-3.5 text-green-300 shrink-0" />
  return <File className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
}

function getFileColor(name: string, isDir: boolean): string {
  if (isDir) return 'text-blue-300 font-medium'
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'tsx') return 'text-blue-300'
  if (ext === 'ts') return 'text-blue-200'
  if (ext === 'css') return 'text-pink-300'
  if (ext === 'json') return 'text-yellow-200'
  if (ext === 'prisma') return 'text-teal-300'
  if (ext === 'yml' || ext === 'yaml') return 'text-red-200'
  if (ext === 'md') return 'text-gray-300'
  return 'text-zinc-300'
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
          {getFileIcon(node.name, node.isDir, node.depth)}
          <span className={getFileColor(node.name, node.isDir)}>
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

function preprocessContent(markdown: string): { processed: string; trees: Record<string, string> } {
  const trees: Record<string, string> = {}
  let index = 0
  // Match code blocks without language (```) that contain tree characters
  const processed = markdown.replace(/```\n([\s\S]*?)```/g, (match, code: string) => {
    if (/[├└│─]/.test(code) && code.split('\n').length >= 3) {
      const key = `FILETREE${index++}END`
      trees[key] = code.trim()
      return key
    }
    return match
  })
  return { processed, trees }
}

export function DocsPageClient({ content }: DocsPageClientProps) {
  const { processed, trees } = useMemo(() => preprocessContent(content), [content])
  const toc = useMemo(() => generateToc(content), [content])
  const tocIds = useMemo(() => toc.map((t) => t.id), [toc])
  const activeId = useScrollSpy(tocIds)

  const headingComponent = (level: 1 | 2 | 3) =>
    function Heading({ children, ...props }: HTMLAttributes<HTMLHeadingElement> & ExtraProps) {
      const text = extractText(children)
      const id = slugify(text)
      const Tag = `h${level}` as const
      const Icon = level === 2 ? getTocIcon(text) : null
      return (
        <Tag id={id} {...props}>
          {Icon && (
            <Icon className="inline-block h-5 w-5 text-primary mr-2 -mt-0.5" />
          )}
          {children}
        </Tag>
      )
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
        <Card className="lg:sticky lg:top-20 overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent dark:from-primary/25 dark:via-primary/15 dark:to-transparent px-5 py-3.5 border-b">
            <h2 className="text-sm font-bold flex items-center justify-between text-primary">
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Sommaire
              </span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {toc.filter(t => t.level <= 2).length} sections
              </span>
            </h2>
          </div>
          <CardContent className="pt-2 pb-4 px-2">
            <nav className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-1 scroll-smooth">
              {toc.map((item, index) => {
                const isActive = activeId === item.id
                const Icon = item.level <= 2 ? getTocIcon(item.text) : null
                const isFirstLevel = item.level === 1
                const showDivider = isFirstLevel && index > 0

                return (
                  <div key={item.id}>
                    {showDivider && <div className="border-t border-dashed border-border/60 my-2 mx-2" />}
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className={cn(
                        'group relative flex items-center gap-2 py-1.5 transition-all duration-200 rounded-lg px-2.5',
                        isActive
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                      style={{ paddingLeft: isFirstLevel ? '10px' : `${(item.level - 1) * 14 + 10}px` }}
                    >
                      {/* Barre latérale active */}
                      {isActive && (
                        <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-full" />
                      )}
                      {Icon ? (
                        <Icon className={cn(
                          'h-3.5 w-3.5 shrink-0 transition-colors duration-200',
                          isActive ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-primary'
                        )} />
                      ) : item.level > 1 ? (
                        <ChevronRight className={cn(
                          'h-3 w-3 shrink-0 transition-all duration-200',
                          isActive ? 'text-primary rotate-90' : 'text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5'
                        )} />
                      ) : (
                        <div className={cn(
                          'w-2 h-2 rounded-full shrink-0 transition-all duration-200',
                          isActive ? 'bg-primary scale-110' : 'bg-muted-foreground/20 group-hover:bg-primary/50'
                        )} />
                      )}
                      <span className={cn(
                        'transition-colors duration-200',
                        isFirstLevel
                          ? 'text-[13px] font-semibold'
                          : item.level === 2
                            ? 'text-[12px]'
                            : 'text-[11px]',
                      )}>
                        {item.text}
                      </span>
                    </a>
                  </div>
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
                p: ({ children, ...props }) => {
                  const text = extractText(children).trim()
                  // Check if this paragraph is a file tree placeholder
                  const treeMatch = text.match(/^FILETREE(\d+)END$/)
                  if (treeMatch) {
                    const key = `FILETREE${treeMatch[1]}END`
                    if (trees[key]) return <FileTree code={trees[key]} />
                  }
                  return <p {...props}>{children}</p>
                },
              }}
            >
              {processed}
            </ReactMarkdown>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
