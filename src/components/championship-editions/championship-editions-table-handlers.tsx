import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'

interface UseChampionshipEditionsTableHandlersProps {
  onRefetch?: () => void
  onSortingChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function useChampionshipEditionsTableHandlers({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseChampionshipEditionsTableHandlersProps) {
  const router = useRouter()
  const { deleteEdition } = useChampionshipEditionsStore()
  const [editEdition, setEditEdition] =
    React.useState<ChampionshipEditionWithRelations | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleEdit = (edition: ChampionshipEditionWithRelations) => {
    setEditEdition(edition)
    setEditDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this championship edition?')) {
      return
    }

    try {
      await deleteEdition(id)
      toast.success('Championship edition deleted successfully')
      onRefetch?.()
    } catch (error: any) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete championship edition'
      )
    }
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditEdition(null)
    onRefetch?.()
  }

  const handleSort = (field: string) => {
    if (!onSortingChange) return

    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      onSortingChange(field, newOrder)
    } else {
      onSortingChange(field, 'desc')
    }
  }

  return {
    editEdition,
    editDialogOpen,
    setEditDialogOpen,
    setEditEdition,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  }
}
