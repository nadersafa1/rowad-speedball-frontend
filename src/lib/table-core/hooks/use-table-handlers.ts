/**
 * Table Core - useTableHandlers Hook
 * Consolidates common table operations (edit, delete, view, select)
 * Manages dialog states and provides standardized handler functions
 */

'use client'

import { useCallback, useState } from 'react'
import { BaseTableEntity } from '../types'

export interface UseTableHandlersOptions<TData extends BaseTableEntity> {
  onEdit?: (item: TData) => void | Promise<void>
  onDelete?: (item: TData) => void | Promise<void>
  onView?: (item: TData) => void | Promise<void>
  onSelect?: (items: TData[]) => void | Promise<void>
  onRefetch?: () => void | Promise<void>
  // Custom delete handler that receives the item ID
  deleteItem?: (id: string) => Promise<void>
}

export interface UseTableHandlersReturn<TData extends BaseTableEntity> {
  // Edit handlers
  editingItem: TData | null
  editDialogOpen: boolean
  handleEdit: (item: TData) => void
  handleEditSuccess: () => void
  handleEditCancel: () => void
  setEditDialogOpen: (open: boolean) => void

  // Delete handlers
  deletingItem: TData | null
  deleteDialogOpen: boolean
  isDeleting: boolean
  handleDelete: (item: TData) => void
  handleDeleteConfirm: () => Promise<void>
  handleDeleteCancel: () => void
  setDeleteDialogOpen: (open: boolean) => void
  setIsDeleting: (deleting: boolean) => void

  // View handlers
  viewingItem: TData | null
  viewDialogOpen: boolean
  handleView: (item: TData) => void
  handleViewClose: () => void
  setViewDialogOpen: (open: boolean) => void

  // Selection handlers (for bulk operations)
  selectedItems: TData[]
  handleSelect: (item: TData) => void
  handleSelectAll: (items: TData[]) => void
  handleClearSelection: () => void
  setSelectedItems: (items: TData[]) => void
}

export function useTableHandlers<TData extends BaseTableEntity>({
  onEdit,
  onDelete,
  deleteItem,
  onView,
  onSelect,
  onRefetch,
}: UseTableHandlersOptions<TData> = {}): UseTableHandlersReturn<TData> {
  // Edit state
  const [editingItem, setEditingItem] = useState<TData | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Delete state
  const [deletingItem, setDeletingItem] = useState<TData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // View state
  const [viewingItem, setViewingItem] = useState<TData | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Selection state
  const [selectedItems, setSelectedItems] = useState<TData[]>([])

  // Edit handlers
  const handleEdit = useCallback(
    (item: TData) => {
      setEditingItem(item)
      setEditDialogOpen(true)
      onEdit?.(item)
    },
    [onEdit]
  )

  const handleEditSuccess = useCallback(async () => {
    setEditDialogOpen(false)
    setEditingItem(null)
    await onRefetch?.()
  }, [onRefetch])

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false)
    setEditingItem(null)
  }, [])

  // Delete handlers
  const handleDelete = useCallback(
    (item: TData) => {
      setDeletingItem(item)
      setDeleteDialogOpen(true)
      onDelete?.(item)
    },
    [onDelete]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    try {
      // Use deleteItem if provided (for store-based deletes), otherwise use onDelete
      if (deleteItem) {
        await deleteItem(deletingItem.id)
      } else if (onDelete) {
        await onDelete(deletingItem)
      }
      setDeleteDialogOpen(false)
      setDeletingItem(null)
      await onRefetch?.()
    } catch (error) {
      console.error('Delete failed:', error)
      // Error handling could be added here (toast, etc.)
    } finally {
      setIsDeleting(false)
    }
  }, [deletingItem, onDelete, deleteItem, onRefetch])

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false)
    setDeletingItem(null)
  }, [])

  // View handlers
  const handleView = useCallback(
    (item: TData) => {
      setViewingItem(item)
      setViewDialogOpen(true)
      onView?.(item)
    },
    [onView]
  )

  const handleViewClose = useCallback(() => {
    setViewDialogOpen(false)
    setViewingItem(null)
  }, [])

  // Selection handlers
  const handleSelect = useCallback(
    (item: TData) => {
      setSelectedItems((prev) => {
        const isSelected = prev.some((i) => i.id === item.id)
        const newSelection = isSelected
          ? prev.filter((i) => i.id !== item.id)
          : [...prev, item]
        onSelect?.(newSelection)
        return newSelection
      })
    },
    [onSelect]
  )

  const handleSelectAll = useCallback(
    (items: TData[]) => {
      setSelectedItems(items)
      onSelect?.(items)
    },
    [onSelect]
  )

  const handleClearSelection = useCallback(() => {
    setSelectedItems([])
    onSelect?.([])
  }, [onSelect])

  return {
    // Edit
    editingItem,
    editDialogOpen,
    handleEdit,
    handleEditSuccess,
    handleEditCancel,
    setEditDialogOpen,

    // Delete
    deletingItem,
    deleteDialogOpen,
    isDeleting,
    handleDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
    setDeleteDialogOpen,
    setIsDeleting,

    // View
    viewingItem,
    viewDialogOpen,
    handleView,
    handleViewClose,
    setViewDialogOpen,

    // Selection
    selectedItems,
    handleSelect,
    handleSelectAll,
    handleClearSelection,
    setSelectedItems,
  }
}
