import * as React from 'react'
import { TrainingSession, Coach } from '@/db/schema'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { toast } from 'sonner'
import { columnToApiFieldMap, SortableField } from './training-sessions-table-utils'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

interface UseTrainingSessionsTableHandlersProps {
  onRefetch?: () => void
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: 'asc' | 'desc'
  ) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
}

export const useTrainingSessionsTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseTrainingSessionsTableHandlersProps) => {
  const { deleteTrainingSession } = useTrainingSessionsStore()
  const [editSession, setEditSession] =
    React.useState<TrainingSessionWithCoaches | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleEdit = React.useCallback(
    (session: TrainingSessionWithCoaches) => {
      setEditSession(session)
      setEditDialogOpen(true)
    },
    []
  )

  const handleDelete = React.useCallback(
    async (session: TrainingSessionWithCoaches) => {
      try {
        await deleteTrainingSession(session.id)
        toast.success('Training session deleted successfully')
        onRefetch?.()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete training session'
        )
      }
    },
    [deleteTrainingSession, onRefetch]
  )

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditSession(null)
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
    editSession,
    editDialogOpen,
    setEditDialogOpen,
    setEditSession,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  }
}

