import * as React from 'react'
import { Test } from '@/types'
import { useTestsStore } from '@/store/tests-store'
import { toast } from 'sonner'
import { SortableField } from './tests-table-types'

interface UseTestsTableHandlersProps {
  onRefetch?: () => void
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: 'asc' | 'desc'
  ) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
}

const columnToApiFieldMap: Record<string, SortableField> = {
  name: 'name',
  dateConducted: 'dateConducted',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
}

export const useTestsTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseTestsTableHandlersProps) => {
  const { deleteTest } = useTestsStore()
  const [editTest, setEditTest] = React.useState<Test | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleEdit = React.useCallback((test: Test) => {
    setEditTest(test)
    setEditDialogOpen(true)
  }, [])

  const handleDelete = React.useCallback(
    async (test: Test) => {
      try {
        await deleteTest(test.id)
        toast.success('Test deleted successfully')
        onRefetch?.()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete test'
        )
      }
    },
    [deleteTest, onRefetch]
  )

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false)
    setEditTest(null)
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
    editTest,
    editDialogOpen,
    setEditDialogOpen,
    setEditTest,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  }
}

