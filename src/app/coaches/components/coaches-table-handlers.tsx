import * as React from 'react'
import { Coach } from '@/db/schema'
import { useCoachesStore } from '@/store/coaches-store'
import { toast } from 'sonner'
import { columnToApiFieldMap, SortableField } from './coaches-table-utils'

interface UseCoachesTableHandlersProps {
  onRefetch?: () => void
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: 'asc' | 'desc'
  ) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
}

export const useCoachesTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseCoachesTableHandlersProps) => {
  const { deleteCoach } = useCoachesStore()
  const [editCoach, setEditCoach] = React.useState<Coach | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleEdit = React.useCallback((coach: Coach) => {
    setEditCoach(coach)
    setEditDialogOpen(true)
  }, [])

  const handleDelete = React.useCallback(
    async (coach: Coach) => {
      try {
        await deleteCoach(coach.id)
        toast.success('Coach deleted successfully')
        onRefetch?.()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete coach'
        )
      }
    },
    [deleteCoach, onRefetch]
  )

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditCoach(null)
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
    editCoach,
    editDialogOpen,
    setEditDialogOpen,
    setEditCoach,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  }
}

