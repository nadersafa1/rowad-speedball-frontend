import * as React from 'react'
import { Player, SortOrder } from '@/types'
import { usePlayersStore } from '@/store/players-store'
import { toast } from 'sonner'
import { columnToApiFieldMap, SortableField } from './players-table-utils'

interface UsePlayersTableHandlersProps {
  onRefetch?: () => void
  onSortingChange?: (sortBy?: SortableField, sortOrder?: SortOrder) => void
  sortBy?: SortableField
  sortOrder?: SortOrder
}

export const usePlayersTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UsePlayersTableHandlersProps) => {
  const { deletePlayer } = usePlayersStore()
  const [editPlayer, setEditPlayer] = React.useState<Player | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleEdit = React.useCallback((player: Player) => {
    setEditPlayer(player)
    setEditDialogOpen(true)
  }, [])

  const handleDelete = React.useCallback(
    async (player: Player) => {
      try {
        await deletePlayer(player.id)
        toast.success('Player deleted successfully')
        onRefetch?.()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete player'
        )
      }
    },
    [deletePlayer, onRefetch]
  )

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditPlayer(null)
    onRefetch?.()
  }, [onRefetch])

  const handleSort = React.useCallback(
    (columnId: string) => {
      if (!onSortingChange) return
      const apiField = columnToApiFieldMap[columnId]
      if (!apiField) return

      if (sortBy === apiField) {
        const newOrder =
          sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
        onSortingChange(apiField, newOrder)
      } else {
        onSortingChange(apiField, SortOrder.DESC)
      }
    },
    [onSortingChange, sortBy, sortOrder]
  )

  return {
    editPlayer,
    editDialogOpen,
    setEditDialogOpen,
    setEditPlayer,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  }
}
