'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react'
import { type CategorySuggestions, getCategorySuggestions, getTopSuggestions } from '@/lib/chatbot/knowledge'
import { findAnswer } from '@/lib/chatbot/search'

// ─── Simple markdown renderer ───────────────────────────────────────────────

function renderMarkdown(text: string, onNavigate?: (href: string) => void): React.ReactNode[] {
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
              className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
            >
              {match[2]}
            </button>
          )
        } else {
          parts.push(
            <a key={match.index} href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
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

// ─── Component ───────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  text: string
  richText?: React.ReactNode[]
  suggestions?: string[]
  categorySuggestions?: CategorySuggestions[]
  showCategories?: boolean
  feedbackGiven?: 'up' | 'down'
}

interface ChatBotProps {
  userName: string
  currentSpace: 'admin' | 'trainer' | 'learner'
}

const spaceToRole: Record<string, string> = {
  admin: 'ADMIN',
  trainer: 'TRAINER',
  learner: 'LEARNER',
}

const roleLabels: Record<string, string> = {
  ADMIN: 'administrateur',
  TRAINER: 'formateur',
  LEARNER: 'apprenant',
}

const STORAGE_KEY_PREFIX = 'formacpv-chatbot-'

export function ChatBot({ userName, currentSpace }: ChatBotProps) {
  const userRole = spaceToRole[currentSpace] || 'LEARNER'
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // ─── Drag logic ──────────────────────────────────────────────────────────
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; dragging: boolean }>({
    startX: 0, startY: 0, startPosX: 0, startPosY: 0, dragging: false,
  })

  const getDefaultPosition = useCallback(() => ({
    x: window.innerWidth - 24 - 56, // right-6 (24px) - button width (56px)
    y: window.innerHeight - 24 - 56, // bottom-6 (24px) - button height (56px)
  }), [])

  const getPanelPosition = useCallback(() => {
    const pos = position || getDefaultPosition()
    // Panel is 380px wide, 520px tall — anchor from bottom-right corner of button
    const panelW = Math.min(380, window.innerWidth - 32)
    const panelH = Math.min(520, window.innerHeight - 96)
    let x = pos.x + 56 - panelW // align right edge with button right edge
    let y = pos.y + 56 - panelH - 8 // above the button

    // Clamp to viewport
    x = Math.max(16, Math.min(x, window.innerWidth - panelW - 16))
    y = Math.max(16, Math.min(y, window.innerHeight - panelH - 16))
    return { x, y, w: panelW, h: panelH }
  }, [position, getDefaultPosition])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const pos = position || getDefaultPosition()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      dragging: false,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [position, getDefaultPosition])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.startX === 0 && dragRef.current.startY === 0) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    // Only start dragging after 5px movement to distinguish from clicks
    if (!dragRef.current.dragging && Math.abs(dx) + Math.abs(dy) < 5) return
    dragRef.current.dragging = true

    const newX = Math.max(0, Math.min(dragRef.current.startPosX + dx, window.innerWidth - 56))
    const newY = Math.max(0, Math.min(dragRef.current.startPosY + dy, window.innerHeight - 56))
    setPosition({ x: newX, y: newY })
  }, [])

  const wasDraggingRef = useRef(false)

  const handlePointerUp = useCallback(() => {
    wasDraggingRef.current = dragRef.current.dragging
    dragRef.current = { startX: 0, startY: 0, startPosX: 0, startPosY: 0, dragging: false }
  }, [])

  const handleNavigate = useCallback((href: string) => {
    router.push(href)
    setIsOpen(false)
  }, [router])

  const topSuggestions = useMemo(() => getTopSuggestions(userRole), [userRole])
  const allCategories = useMemo(() => getCategorySuggestions(userRole), [userRole])

  // Load messages from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${currentSpace}`)
      if (stored) {
        const parsed: ChatMessage[] = JSON.parse(stored)
        // Re-render markdown for bot messages
        const restored = parsed.map((msg) => ({
          ...msg,
          richText: msg.type === 'bot' ? renderMarkdown(msg.text, handleNavigate) : undefined,
          suggestions: msg.suggestions || undefined,
          categorySuggestions: msg.categorySuggestions || undefined,
        }))
        setMessages(restored)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Save without richText (not serializable)
        const toStore = messages.map(({ richText, ...rest }) => rest)
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${currentSpace}`, JSON.stringify(toStore))
      } catch {
        // ignore
      }
    }
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Animate open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShowPanel(true))
      })
    } else {
      setShowPanel(false)
    }
  }, [isOpen])

  // Init welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const firstName = userName?.split(' ')[0] || ''
      setMessages([{
        id: '0',
        type: 'bot',
        text: `Bonjour${firstName ? ` ${firstName}` : ''} ! 👋 Je suis l'assistant FormaCPV. Comment puis-je vous aider en tant qu'${roleLabels[userRole] || 'utilisateur'} ?`,
        richText: renderMarkdown(`Bonjour${firstName ? ` **${firstName}**` : ''} ! 👋 Je suis l'assistant FormaCPV.\n\nComment puis-je vous aider en tant qu'**${roleLabels[userRole] || 'utilisateur'}** ?`, handleNavigate),
        suggestions: topSuggestions,
        showCategories: true,
        categorySuggestions: allCategories,
      }])
    }
  }, [isOpen, messages.length, userName, userRole, topSuggestions, allCategories])

  const addBotMessage = useCallback((text: string, options?: {
    suggestions?: string[]
    categorySuggestions?: CategorySuggestions[]
    showCategories?: boolean
  }) => {
    setIsTyping(true)
    const delay = Math.min(300 + text.length * 3, 1200)
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        text,
        richText: renderMarkdown(text, handleNavigate),
        suggestions: options?.suggestions,
        categorySuggestions: options?.categorySuggestions,
        showCategories: options?.showCategories,
      }])
    }, delay)
  }, [])

  function handleQuestion(question: string) {
    setExpandedCategory(null)

    // Add user message
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      text: question,
    }])

    const { best, similar } = findAnswer(question, userRole)

    if (best) {
      const followUp = topSuggestions
        .filter((s) => s !== question && s !== best.question)
        .slice(0, 2)
      followUp.push("J'ai un autre problème")

      addBotMessage(best.answer, { suggestions: followUp })
    } else if (similar.length > 0) {
      // "Did you mean?" suggestions
      const didYouMean = similar.map((qa) => qa.question)
      addBotMessage(
        "Je n'ai pas trouvé de réponse exacte, mais voici des questions similaires :",
        { suggestions: didYouMean },
      )
    } else {
      addBotMessage(
        "Je n'ai pas trouvé de réponse à votre question. Essayez de **reformuler** ou consultez les thèmes ci-dessous.",
        {
          suggestions: topSuggestions.slice(0, 3),
          categorySuggestions: allCategories,
          showCategories: true,
        },
      )
    }
  }

  function handleFeedback(messageId: string, feedback: 'up' | 'down') {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedbackGiven: feedback } : msg
      )
    )
  }

  function handleClearHistory() {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentSpace}`)
    setMessages([])
    setExpandedCategory(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    handleQuestion(input.trim())
    setInput('')
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          data-tour="chatbot"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => {
            if (!wasDraggingRef.current) setIsOpen(true)
            wasDraggingRef.current = false
          }}
          className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors duration-200 hover:scale-105 active:scale-95 group touch-none select-none cursor-grab active:cursor-grabbing"
          style={position ? { left: position.x, top: position.y } : { bottom: 24, right: 24 }}
          aria-label="Ouvrir l'assistant"
        >
          <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110 pointer-events-none" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 items-center justify-center text-[9px] font-bold text-white">?</span>
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (() => {
        const pp = getPanelPosition()
        return (
        <div
          className={`fixed z-50 flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
            showPanel
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
          style={{ left: pp.x, top: pp.y, width: pp.w, height: pp.h }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Assistant FormaCPV</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <p className="text-[11px] text-blue-100">En ligne</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={handleClearHistory}
                  className="rounded-full px-2 py-1 text-[11px] hover:bg-white/20 transition-colors"
                  title="Effacer l'historique"
                >
                  Effacer
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {msg.type === 'bot' ? (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-2 max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed">
                        {msg.richText || msg.text}
                      </div>

                      {/* Feedback buttons */}
                      {msg.id !== '0' && (
                        <div className="flex items-center gap-1 ml-1">
                          {msg.feedbackGiven ? (
                            <span className="text-[11px] text-muted-foreground">
                              {msg.feedbackGiven === 'up' ? 'Merci pour le retour !' : 'Merci, on va améliorer.'}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleFeedback(msg.id, 'up')}
                                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-green-600"
                                aria-label="Utile"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'down')}
                                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                                aria-label="Pas utile"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Quick suggestions */}
                      {msg.suggestions && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => !isTyping && handleQuestion(s)}
                              disabled={isTyping}
                              className="text-xs px-2.5 py-1.5 rounded-full border bg-background hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors text-left disabled:opacity-50"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Category suggestions */}
                      {msg.showCategories && msg.categorySuggestions && (
                        <div className="space-y-1 mt-2">
                          <p className="text-[11px] text-muted-foreground font-medium ml-1">Parcourir par thème :</p>
                          {msg.categorySuggestions.map((cat) => (
                            <div key={cat.label} className="border rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                              >
                                {cat.label}
                                <ChevronDown className={`h-3 w-3 transition-transform ${expandedCategory === cat.label ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedCategory === cat.label && (
                                <div className="px-2 pb-2 space-y-1">
                                  {cat.questions.map((q) => (
                                    <button
                                      key={q}
                                      onClick={() => !isTyping && handleQuestion(q)}
                                      disabled={isTyping}
                                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="flex gap-2 max-w-[85%]">
                      <div className="rounded-2xl rounded-tr-sm bg-blue-600 text-white px-3 py-2 text-sm">
                        {msg.text}
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t shrink-0 bg-background">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 text-sm rounded-full"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700"
              disabled={!input.trim() || isTyping}
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
        )
      })()}
    </>
  )
}
