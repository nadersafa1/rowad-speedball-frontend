import * as React from 'react'
import type { Federation } from '@/db/schema'
import { useFederationsStore } from '@/store/federations-store'
import { toast } from 'sonner'
import { columnToApiFieldMap, SortableField } from './federations-table-utils'

interface UseFederationsTableHandlersProps {
  onRefetch?: () => void
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: 'asc' | 'desc'
  ) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
}

export const useFederationsTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseFederationsTableHandlersProps) => {
  const { deleteFederation } = useFederationsStore()
  const [editFederation, setEditFederation] =
    React.useState<Federation | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleEdit = React.useCallback((federation: Federation) => {
    setEditFederation(federation)
    setEditDialogOpen(true)
  }, [])

  const handleDelete = React.useCallback(
    async (federation: Federation) => {
      try {
        await deleteFederation(federation.id)
        toast.success('Federation deleted successfully')
        onRefetch?.()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete federation'
        )
      }
    },
    [deleteFederation, onRefetch]
  )

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditFederation(null)
    onRefetch?.()
  }, [onRefetch])

  const handleSort = React.useCallback(
    (columnId: string) => {
      if (!onSortingChange) return
      const apiField = columnToApiFieldMap[columnId]
      if (!apiField) return

      if (sortBy === apiField) {
        const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
        onSortingChange(apiField, newOrder)
      } else {
        onSortingChange(apiField, 'desc')
      }
    },
    [onSortingChange, sortBy, sortOrder]
  )

  return {
    editFederation,
    editDialogOpen,
    setEditDialogOpen,
    setEditFederation,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  }
}

