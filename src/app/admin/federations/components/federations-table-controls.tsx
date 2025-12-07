import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Table } from '@tanstack/react-table'
import type { Federation } from '@/db/schema'

interface FederationsTableControlsProps {
  table: Table<Federation>
  searchValue: string
  onSearchChange?: (value: string) => void
}

export const FederationsTableControls = ({
  table,
  searchValue,
  onSearchChange,
}: FederationsTableControlsProps) => {
  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      createdAt: 'Created',
      updatedAt: 'Updated',
    }
    return labels[columnId] || columnId
  }

  return (
    <div className='space-y-4'>
      {/* Row 1: Search input and Column visibility */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by federation name...'
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className='w-full md:max-w-md pl-10'
          />
        </div>
        {/* Column Visibility */}
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
    </div>
  )
}

