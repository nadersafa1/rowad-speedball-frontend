import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table as ReactTable } from '@tanstack/react-table'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'

interface ChampionshipEditionsTableControlsProps {
  table: ReactTable<ChampionshipEditionWithRelations>
  searchValue?: string
  onSearchChange?: (search: string) => void
  statusFilter?: 'draft' | 'published' | 'archived' | 'all'
  onStatusChange?: (status: 'draft' | 'published' | 'archived' | 'all') => void
}

export function ChampionshipEditionsTableControls({
  table,
  searchValue = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusChange,
}: ChampionshipEditionsTableControlsProps) {
  return (
    <div className='flex items-center gap-4'>
      {onSearchChange && (
        <Input
          placeholder='Search editions...'
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className='max-w-sm'
        />
      )}
      {onStatusChange && (
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='draft'>Draft</SelectItem>
            <SelectItem value='published'>Published</SelectItem>
            <SelectItem value='archived'>Archived</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
