'use client'

import React from 'react'

export function renderMarkdown(text: string, onNavigate?: (href: string) => void): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  function renderInline(str: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index))
      }
      if (match[1]) {
        parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>)
      } else if (match[2] && match[3]) {
        const href = match[3]
        const isInternal = href.startsWith('/')
        if (isInternal && onNavigate) {
          parts.push(
            <button
              key={match.index}
              onClick={() => onNavigate(href)}
              className="text-primary underline hover:text-primary/80 cursor-pointer"
            >
              {match[2]}
            </button>
          )
        } else {
          parts.push(
            <a key={match.index} href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
              {match[2]}
            </a>
          )
        }
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex))
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
    } else {
      flushList()
      if (trimmed === '') {
        // Skip empty lines but add spacing via margins
      } else {
        elements.push(<p key={key++} className="my-1">{renderInline(trimmed)}</p>)
      }
    }
  }
  flushList()

  return elements
}
