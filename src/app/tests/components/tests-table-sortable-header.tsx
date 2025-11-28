import { ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SortableField = 'name' | 'dateConducted' | 'createdAt' | 'updatedAt'

interface SortableHeaderProps {
  label: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  field: SortableField
  onSort?: (columnId: string) => void
}

export const SortableHeader = ({
  label,
  sortBy,
  sortOrder,
  field,
  onSort,
}: SortableHeaderProps) => {
  const isSorted = sortBy === field
  const isAsc = isSorted && sortOrder === 'asc'
  const isDesc = isSorted && sortOrder === 'desc'

  return (
    <Button variant='ghost' onClick={() => onSort?.(field)}>
      {label}
      {isSorted ? (
        isAsc ? (
          <ArrowUp className='ml-2 h-4 w-4' />
        ) : (
          <ArrowDown className='ml-2 h-4 w-4' />
        )
      ) : (
        <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
      )}
    </Button>
  )
}

