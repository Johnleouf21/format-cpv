'use client'

import { useState, useRef, useCallback } from 'react'

export function useDrag() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; dragging: boolean }>({
    startX: 0, startY: 0, startPosX: 0, startPosY: 0, dragging: false,
  })
  const wasDraggingRef = useRef(false)

  const getDefaultPosition = useCallback(() => ({
    x: window.innerWidth - 24 - 56,
    y: window.innerHeight - 24 - 56,
  }), [])

  const getPanelPosition = useCallback(() => {
    const pos = position || getDefaultPosition()
    const panelW = Math.min(380, window.innerWidth - 32)
    const panelH = Math.min(520, window.innerHeight - 96)
    let x = pos.x + 56 - panelW
    let y = pos.y + 56 - panelH - 8

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

    if (!dragRef.current.dragging && Math.abs(dx) + Math.abs(dy) < 5) return
    dragRef.current.dragging = true

    const newX = Math.max(0, Math.min(dragRef.current.startPosX + dx, window.innerWidth - 56))
    const newY = Math.max(0, Math.min(dragRef.current.startPosY + dy, window.innerHeight - 56))
    setPosition({ x: newX, y: newY })
  }, [])

  const handlePointerUp = useCallback(() => {
    wasDraggingRef.current = dragRef.current.dragging
    dragRef.current = { startX: 0, startY: 0, startPosX: 0, startPosY: 0, dragging: false }
  }, [])

  const buttonPosition = position || (typeof window !== 'undefined' ? getDefaultPosition() : { x: 0, y: 0 })

  return {
    position,
    buttonPosition,
    wasDraggingRef,
    getPanelPosition,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
