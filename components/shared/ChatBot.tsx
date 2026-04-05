'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react'
import { getCategorySuggestions, getTopSuggestions } from '@/lib/chatbot/knowledge'
import { findAnswer } from '@/lib/chatbot/search'
import { renderMarkdown } from './chatbot/ChatMarkdown'
import { type ChatMessage, spaceToRole, roleLabels, STORAGE_KEY_PREFIX } from './chatbot/types'
import { useDrag } from './chatbot/useDrag'

// ─── Component ───────────────────────────────────────────────────────────────

interface ChatBotProps {
  userName: string
  currentSpace: 'admin' | 'trainer' | 'learner'
}

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

  const {
    position,
    wasDraggingRef,
    getPanelPosition,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useDrag()

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const toStore = messages.map(({ richText: _richText, ...rest }) => rest)
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
        showCategories: options?.showCategories,
      }])
    }, delay)
  }, [handleNavigate])

  function handleQuestion(question: string) {
    setExpandedCategory(null)
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
      addBotMessage(
        "Je n'ai pas trouvé de réponse exacte, mais voici des questions similaires :",
        { suggestions: similar.map((qa) => qa.question) },
      )
    } else {
      addBotMessage(
        "Je n'ai pas trouvé de réponse à votre question. Essayez de **reformuler** ou consultez les thèmes ci-dessous.",
        { suggestions: topSuggestions.slice(0, 3), showCategories: true },
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
          className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors duration-200 hover:scale-105 active:scale-95 group touch-none select-none cursor-grab active:cursor-grabbing"
          style={position ? { left: position.x, top: position.y } : { bottom: 24, right: 24 }}
          aria-label="Ouvrir l'assistant"
        >
          <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110 pointer-events-none" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary items-center justify-center text-[9px] font-bold text-white">?</span>
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
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Assistant FormaCPV</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <p className="text-[11px] text-primary-foreground/80">En ligne</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={handleClearHistory}
                  className="rounded-full px-2 py-1 text-[11px] hover:bg-white/20 transition-colors"
                  aria-label="Effacer l'historique"
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-2 max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed">
                        {msg.richText || msg.text}
                      </div>

                      {/* Feedback */}
                      {msg.id !== '0' && (
                        <div className="flex items-center gap-1 ml-1">
                          {msg.feedbackGiven ? (
                            <span className="text-[11px] text-muted-foreground">
                              {msg.feedbackGiven === 'up' ? 'Merci pour le retour !' : 'Merci, on va améliorer.'}
                            </span>
                          ) : (
                            <>
                              <button onClick={() => handleFeedback(msg.id, 'up')} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-green-600" aria-label="Utile">
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleFeedback(msg.id, 'down')} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500" aria-label="Pas utile">
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
                            <button key={s} onClick={() => !isTyping && handleQuestion(s)} disabled={isTyping} className="text-xs px-2.5 py-1.5 rounded-full border bg-background hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-colors text-left disabled:opacity-50">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Category suggestions */}
                      {msg.showCategories && allCategories && (
                        <div className="space-y-1 mt-2">
                          <p className="text-[11px] text-muted-foreground font-medium ml-1">Parcourir par thème :</p>
                          {allCategories.map((cat) => (
                            <div key={cat.label} className="border rounded-lg overflow-hidden">
                              <button onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)} className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                                {cat.label}
                                <ChevronDown className={`h-3 w-3 transition-transform ${expandedCategory === cat.label ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedCategory === cat.label && (
                                <div className="px-2 pb-2 space-y-1">
                                  {cat.questions.map((q) => (
                                    <button key={q} onClick={() => !isTyping && handleQuestion(q)} disabled={isTyping} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-primary/5 hover:text-primary transition-colors disabled:opacity-50">
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
                      <div className="rounded-2xl rounded-tr-sm bg-primary text-white px-3 py-2 text-sm">
                        {msg.text}
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
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
              className="rounded-full h-9 w-9 shrink-0 bg-primary hover:bg-primary/90"
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
