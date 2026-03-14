'use client'

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { Check } from 'lucide-react'
import { getVideoEmbedUrl } from '@/lib/utils/media'

interface ModuleContentProps {
  content: string
}

export function ModuleContent({ content }: ModuleContentProps) {
  return (
    <div className="notion-content max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          // Video embeds - responsive 16:9 iframe (custom HTML tag via rehype-raw)
          ...{ 'video-embed': ({ src, title }: { src?: string; title?: string }) => {
            if (!src) return null
            const embedUrl = getVideoEmbedUrl(src)
            return (
              <figure className="my-8">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    title={title || 'Vidéo'}
                    className="absolute inset-0 w-full h-full rounded-lg shadow-xl border border-border/50"
                    allowFullScreen
                    allow="autoplay; encrypted-media; fullscreen"
                  />
                </div>
                {title && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
                    {title}
                  </figcaption>
                )}
              </figure>
            )
          }},
          // Headings - Notion-like sizes and weights
          h1: ({ children, ...props }) => (
            <h1
              className="text-[2.5rem] font-bold mt-10 mb-4 leading-tight tracking-tight text-foreground first:mt-0"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className="text-[1.875rem] font-semibold mt-10 mb-4 leading-tight tracking-tight text-foreground border-b border-border pb-2"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className="text-[1.5rem] font-semibold mt-8 mb-3 leading-snug text-foreground"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              className="text-[1.25rem] font-medium mt-6 mb-2 leading-snug text-foreground"
              {...props}
            >
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5
              className="text-[1.125rem] font-medium mt-5 mb-2 leading-snug text-foreground"
              {...props}
            >
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6
              className="text-base font-medium mt-4 mb-2 leading-snug text-muted-foreground uppercase tracking-wide text-sm"
              {...props}
            >
              {children}
            </h6>
          ),

          // Paragraphs - proper spacing like Notion
          p: ({ children, ...props }) => (
            <p
              className="text-[1.0625rem] leading-[1.8] my-[1.25em] text-foreground/90"
              {...props}
            >
              {children}
            </p>
          ),

          // Strong and emphasis
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),

          // Links - Notion-like underline on hover
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 transition-colors"
              {...props}
            >
              {children}
            </a>
          ),

          // Lists - Notion-style spacing and bullets
          ul: ({ children, className, ...props }) => {
            // Check if it's a task list
            const isTaskList = className?.includes('contains-task-list')
            return (
              <ul
                className={`my-[1.25em] space-y-1 ${isTaskList ? 'list-none pl-0' : 'list-disc pl-6 marker:text-foreground/50'}`}
                {...props}
              >
                {children}
              </ul>
            )
          },
          ol: ({ children, ...props }) => (
            <ol
              className="my-[1.25em] space-y-1 pl-6 list-decimal marker:text-foreground/50 marker:font-medium"
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, className, ...props }) => {
            // Check if this is a task list item
            const isTaskItem = className?.includes('task-list-item')

            if (isTaskItem) {
              const childArray = Array.isArray(children) ? children : [children]
              // Find the checkbox input
              let isChecked = false
              const filteredChildren = childArray.filter((child) => {
                if (typeof child === 'object' && child !== null && 'type' in child) {
                  if (child.type === 'input' && child.props?.type === 'checkbox') {
                    isChecked = child.props?.checked || false
                    return false
                  }
                }
                return true
              })

              return (
                <li className="flex items-start gap-3 py-0.5 list-none" {...props}>
                  <span className={`flex-shrink-0 w-[18px] h-[18px] mt-[3px] rounded border-2 ${
                    isChecked
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  } flex items-center justify-center`}>
                    {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className={`text-[1.0625rem] leading-[1.8] ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground/90'}`}>
                    {filteredChildren}
                  </span>
                </li>
              )
            }

            // Default list item (works for both ul and ol)
            return (
              <li
                className="py-0.5 text-[1.0625rem] leading-[1.8] text-foreground/90 pl-2"
                {...props}
              >
                {children}
              </li>
            )
          },

          // Blockquotes - Notion callout style
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="my-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg"
              {...props}
            >
              <div className="text-[1.0625rem] leading-[1.8] text-amber-900 [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                {children}
              </div>
            </blockquote>
          ),

          // Code - inline and blocks
          code: ({ className, children, ...props }) => {
            const isCodeBlock = className?.includes('language-')

            if (isCodeBlock) {
              return (
                <code
                  className={`${className} block text-sm`}
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 text-[0.9em] font-mono bg-red-50 text-red-600 rounded"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ children, ...props }) => (
            <pre
              className="my-6 p-4 bg-[#2d2d2d] text-[#ccc] rounded-lg overflow-x-auto text-sm leading-relaxed font-mono shadow-lg"
              {...props}
            >
              {children}
            </pre>
          ),

          // Horizontal rule - Notion divider style
          hr: ({ ...props }) => (
            <hr
              className="my-8 border-none h-[1px] bg-border"
              {...props}
            />
          ),

          // Images - nice shadow and rounded corners like Notion
          img: ({ src, alt, ...props }) => (
            <figure className="my-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || ''}
                className="rounded-lg shadow-xl max-w-full h-auto mx-auto border border-border/50"
                loading="lazy"
                {...props}
              />
              {alt && (
                <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),

          // Tables - Notion-like clean style
          table: ({ children, ...props }) => (
            <div className="my-8 overflow-x-auto rounded-lg border border-border shadow-sm">
              <table className="w-full border-collapse text-[0.9375rem]" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-muted/60" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="divide-y divide-border bg-white" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="hover:bg-muted/30 transition-colors" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th
              className="px-4 py-3 text-left font-semibold text-foreground text-sm uppercase tracking-wide"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className="px-4 py-3 text-foreground/90"
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
