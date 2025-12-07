import * as React from 'react'
import { useChampionshipsStore } from '@/store/championships-store'
import { toast } from 'sonner'
import { columnToApiFieldMap, SortableField } from './championships-table-utils'
import { ChampionshipWithFederation } from './championships-table-types'

interface UseChampionshipsTableHandlersProps {
  onRefetch?: () => void
  onSortingChange?: (sortBy?: SortableField, sortOrder?: 'asc' | 'desc') => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
}

export const useChampionshipsTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseChampionshipsTableHandlersProps) => {
  const { deleteChampionship } = useChampionshipsStore()
  const [editChampionship, setEditChampionship] =
    React.useState<ChampionshipWithFederation | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleEdit = React.useCallback(
    (championship: ChampionshipWithFederation) => {
      setEditChampionship(championship)
      setEditDialogOpen(true)
    },
    []
  )

  const handleDelete = React.useCallback(
    async (championship: ChampionshipWithFederation) => {
      try {
        await deleteChampionship(championship.id)
        toast.success('Championship deleted successfully')
        onRefetch?.()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to delete championship'
        )
      }
    },
    [deleteChampionship, onRefetch]
  )

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditChampionship(null)
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
    editChampionship,
    editDialogOpen,
    setEditDialogOpen,
    setEditChampionship,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  }
}
