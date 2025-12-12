'use client'

import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: (e: KeyboardEvent) => void
  description?: string
}

/**
 * Hook for handling keyboard shortcuts.
 * Supports common actions like Enter to submit, Esc to cancel.
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = e.key === shortcut.key || e.code === shortcut.key
        const ctrlMatches = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey
        const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatches = shortcut.alt ? e.altKey : !e.altKey
        const metaMatches = shortcut.meta ? e.metaKey : !e.metaKey

        if (
          keyMatches &&
          ctrlMatches &&
          shiftMatches &&
          altMatches &&
          metaMatches
        ) {
          // Don't trigger if user is typing in an input
          const target = e.target as HTMLElement
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            // Allow Enter in textareas, but not in inputs (unless it's a search)
            if (shortcut.key === 'Enter' && target.tagName === 'TEXTAREA') {
              continue
            }
            if (shortcut.key === 'Enter' && target.tagName === 'INPUT') {
              continue
            }
            // Allow Esc always
            if (shortcut.key === 'Escape') {
              shortcut.handler(e)
              e.preventDefault()
              return
            }
            continue
          }

          shortcut.handler(e)
          e.preventDefault()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

/**
 * Common keyboard shortcuts for forms and dialogs.
 */
export const COMMON_SHORTCUTS = {
  submit: (handler: () => void): KeyboardShortcut => ({
    key: 'Enter',
    handler: () => handler(),
    description: 'Enter to submit',
  }),
  cancel: (handler: () => void): KeyboardShortcut => ({
    key: 'Escape',
    handler: () => handler(),
    description: 'Esc to cancel',
  }),
} as const
