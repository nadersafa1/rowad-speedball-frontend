import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table } from '@tanstack/react-table'
import { RegistrationTableRow } from './test-event-registrations-table-types'
import { Group } from '@/types'
import { ChevronDown } from 'lucide-react'

interface TestEventRegistrationsTableControlsProps {
  table: Table<RegistrationTableRow>
  searchValue: string
  onSearchChange?: (value: string) => void
  heatId?: string | null
  clubId?: string | null
  groups: Group[]
  clubs: Array<{ id: string; name: string }>
  onHeatChange?: (heatId: string | null) => void
  onClubChange?: (clubId: string | null) => void
}

export const TestEventRegistrationsTableControls = ({
  table,
  searchValue,
  onSearchChange,
  heatId,
  clubId,
  groups,
  clubs,
  onHeatChange,
  onClubChange,
}: TestEventRegistrationsTableControlsProps) => {
  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      positionScores: 'Position Scores',
    }
    return labels[columnId] || columnId
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder="Search by player's name..."
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className='w-full md:max-w-md pl-10'
          />
        </div>
        <div className='w-full md:w-auto md:ml-auto'>
          <Label className='block mb-2 md:invisible md:h-0 md:mb-0'>
            Columns
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='w-full md:w-auto'>
                Columns <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {getColumnLabel(column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='heat' className='block mb-2'>
            Heat
          </Label>
          <Select
            name='heat'
            value={heatId || 'all'}
            onValueChange={(value) => {
              onHeatChange?.(value === 'all' ? null : value)
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a Heat' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Heats</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  Heat {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='club' className='block mb-2'>
            Club
          </Label>
          <Select
            name='club'
            value={clubId || 'all'}
            onValueChange={(value) => {
              onClubChange?.(value === 'all' ? null : value)
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a Club' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Clubs</SelectItem>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

