/**
 * Table Core - useTableNavigation Hook
 * Handles table row click navigation with keyboard support
 */

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, KeyboardEvent, MouseEvent } from 'react'
import { BaseTableEntity, TableRoutingConfig } from '../types'

export interface UseTableNavigationOptions {
  routing: TableRoutingConfig
  enabled?: boolean
  onNavigate?: (id: string) => void
}

export interface UseTableNavigationReturn<TData extends BaseTableEntity> {
  handleRowClick: (item: TData) => void
  handleRowKeyDown: (item: TData, event: KeyboardEvent<HTMLTableRowElement>) => void
  getRowProps: (item: TData) => {
    onClick: (e: MouseEvent<HTMLTableRowElement>) => void
    onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => void
    className: string
    tabIndex: number
    role: string
    'aria-label': string
  }
}

export function useTableNavigation<TData extends BaseTableEntity>(
  options: UseTableNavigationOptions
): UseTableNavigationReturn<TData> {
  const { routing, enabled = true, onNavigate } = options
  const router = useRouter()

  const handleRowClick = useCallback(
    (item: TData) => {
      if (!enabled) return

      const path = routing.detailPath(item.id)
      onNavigate?.(item.id)
      router.push(path)
    },
    [enabled, routing, onNavigate, router]
  )

  const handleRowKeyDown = useCallback(
    (item: TData, event: KeyboardEvent<HTMLTableRowElement>) => {
      if (!enabled) return

      // Handle Enter or Space key
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleRowClick(item)
      }
    },
    [enabled, handleRowClick]
  )

  const getRowProps = useCallback(
    (item: TData) => ({
      onClick: (e: MouseEvent<HTMLTableRowElement>) => {
        // Don't navigate if clicking on an actual interactive element
        const target = e.target as HTMLElement

        // Only block if we clicked directly on these elements
        if (
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('button') ||
          target.closest('a')
        ) {
          return
        }
        handleRowClick(item)
      },
      onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) =>
        handleRowKeyDown(item, e),
      className: enabled
        ? 'cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none'
        : '',
      tabIndex: enabled ? 0 : -1,
      role: 'button' as const,
      'aria-label': `View details for ${item.id}`,
    }),
    [enabled, handleRowClick, handleRowKeyDown]
  )

  return {
    handleRowClick,
    handleRowKeyDown,
    getRowProps,
  }
}
