import { useEffect, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
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
import { apiClient } from '@/lib/api-client'
import { ChampionshipWithFederation } from './championships-table-types'

interface ChampionshipsTableControlsProps {
  table: Table<ChampionshipWithFederation>
  searchValue: string
  onSearchChange?: (value: string) => void
  federationId?: string
  onFederationChange?: (federationId?: string) => void
}

export const ChampionshipsTableControls = ({
  table,
  searchValue,
  onSearchChange,
  federationId,
  onFederationChange,
}: ChampionshipsTableControlsProps) => {
  const [federations, setFederations] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isLoadingFederations, setIsLoadingFederations] = useState(false)

  useEffect(() => {
    const fetchFederations = async () => {
      setIsLoadingFederations(true)
      try {
        const response = (await apiClient.getFederations({ limit: 100 })) as {
          data: Array<{ id: string; name: string }>
        }
        setFederations(response.data || [])
      } catch (error) {
        console.error('Failed to fetch federations:', error)
      } finally {
        setIsLoadingFederations(false)
      }
    }
    fetchFederations()
  }, [])

  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      description: 'Description',
      startDate: 'Start Date',
      endDate: 'End Date',
      createdAt: 'Created',
      updatedAt: 'Updated',
    }
    return labels[columnId] || columnId
  }

  return (
    <div className='space-y-4'>
      {/* Row 1: Search and Column visibility */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by championship name...'
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

      {/* Row 2: Federation filter */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-1 w-full md:w-auto md:max-w-xs'>
          <Label htmlFor='federationId' className='block mb-2'>
            Federation
          </Label>
          <Select
            name='federationId'
            value={federationId || 'all'}
            onValueChange={(value: string) => {
              onFederationChange?.(value === 'all' ? undefined : value)
            }}
            disabled={isLoadingFederations}
          >
            <SelectTrigger className='w-full'>
              <SelectValue
                placeholder={
                  isLoadingFederations ? 'Loading...' : 'Select a Federation'
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Federations</SelectItem>
              {federations.map((fed) => (
                <SelectItem key={fed.id} value={fed.id}>
                  {fed.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

