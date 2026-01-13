'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  SortAsc,
  SortDesc,
  Users,
  Calendar,
} from 'lucide-react'
import { useSeasonsStore } from '@/store/seasons-store'
import SeasonForm from '@/components/seasons/season-form'
import type { Season } from '@/db/schema'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface SeasonsTableProps {
  onRefetch: () => void
}

export default function SeasonsTable({ onRefetch }: SeasonsTableProps) {
  const router = useRouter()
  const { seasons, isLoading, deleteSeason } = useSeasonsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'startYear' | 'seasonStartDate'>('startYear')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleEdit = (season: Season) => {
    setSelectedSeason(season)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (season: Season) => {
    setSeasonToDelete(season)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!seasonToDelete) return

    try {
      await deleteSeason(seasonToDelete.id)
      toast.success('Season deleted successfully')
      onRefetch()
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete season'
      if (errorMessage.includes('age groups') || errorMessage.includes('registrations')) {
        toast.error(
          'Cannot delete season with active age groups or registrations. Please remove them first.'
        )
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setDeleteDialogOpen(false)
      setSeasonToDelete(null)
    }
  }

  const handleManageAgeGroups = (season: Season) => {
    router.push(`/admin/seasons/${season.id}`)
  }

  const toggleSort = (column: 'name' | 'startYear' | 'seasonStartDate') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Filter and sort seasons
  const filteredSeasons = seasons
    .filter((season) => {
      // Status filter
      if (statusFilter !== 'all' && season.status !== statusFilter) {
        return false
      }

      // Search filter
      const query = searchQuery.toLowerCase()
      return (
        season.name.toLowerCase().includes(query) ||
        season.startYear.toString().includes(query) ||
        season.endYear.toString().includes(query)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'startYear') {
        comparison = a.startYear - b.startYear
      } else {
        comparison =
          new Date(a.seasonStartDate).getTime() - new Date(b.seasonStartDate).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'closed':
        return 'outline'
      case 'archived':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatRegistrationPeriod = (
    startDate: string | null,
    endDate: string | null
  ): string => {
    if (!startDate || !endDate) return 'Not set'
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  if (isLoading) {
    return (
      <div className='rounded-md border'>
        <div className='p-8 text-center text-muted-foreground'>Loading seasons...</div>
      </div>
    )
  }

  return (
    <>
      {/* Search and Filters */}
      <div className='mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4'>
        <div className='relative flex-1 w-full sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search seasons...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='draft'>Draft</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='closed'>Closed</SelectItem>
            <SelectItem value='archived'>Archived</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant='outline' className='text-sm'>
          {filteredSeasons.length} season{filteredSeasons.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2'
                  onClick={() => toggleSort('name')}
                >
                  Season
                  {sortBy === 'name' &&
                    (sortOrder === 'asc' ? (
                      <SortAsc className='ml-1 h-3 w-3' />
                    ) : (
                      <SortDesc className='ml-1 h-3 w-3' />
                    ))}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2'
                  onClick={() => toggleSort('startYear')}
                >
                  Years
                  {sortBy === 'startYear' &&
                    (sortOrder === 'asc' ? (
                      <SortAsc className='ml-1 h-3 w-3' />
                    ) : (
                      <SortDesc className='ml-1 h-3 w-3' />
                    ))}
                </Button>
              </TableHead>
              <TableHead className='hidden md:table-cell'>Season Dates</TableHead>
              <TableHead className='hidden lg:table-cell'>Registration Period 1</TableHead>
              <TableHead className='hidden xl:table-cell'>Registration Period 2</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSeasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-24 text-center'>
                  {searchQuery || statusFilter !== 'all'
                    ? 'No seasons found matching your filters.'
                    : 'No seasons yet. Create your first one!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSeasons.map((season) => (
                <TableRow key={season.id}>
                  <TableCell className='font-semibold'>{season.name}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {season.startYear}-{season.endYear}
                    </Badge>
                  </TableCell>
                  <TableCell className='hidden md:table-cell text-sm text-muted-foreground'>
                    {formatDate(season.seasonStartDate)} -{' '}
                    {formatDate(season.seasonEndDate)}
                  </TableCell>
                  <TableCell className='hidden lg:table-cell text-sm text-muted-foreground'>
                    {formatRegistrationPeriod(
                      season.firstRegistrationStartDate,
                      season.firstRegistrationEndDate
                    )}
                  </TableCell>
                  <TableCell className='hidden xl:table-cell text-sm text-muted-foreground'>
                    {formatRegistrationPeriod(
                      season.secondRegistrationStartDate,
                      season.secondRegistrationEndDate
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(season.status)}>
                      {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8'>
                          <MoreHorizontal className='h-4 w-4' />
                          <span className='sr-only'>Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleManageAgeGroups(season)}>
                          <Users className='mr-2 h-4 w-4' />
                          Manage Age Groups
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(season)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          Edit Season
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(season)}
                          className='text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <SeasonForm
          season={selectedSeason || undefined}
          onSuccess={() => {
            setEditDialogOpen(false)
            setSelectedSeason(null)
            onRefetch()
          }}
          onCancel={() => {
            setEditDialogOpen(false)
            setSelectedSeason(null)
          }}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Season</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{seasonToDelete?.name}</strong>?
              <br />
              <br />
              This will permanently delete the season and cannot be undone. This action will
              fail if the season has age groups or registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className='bg-destructive'>
              Delete Season
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
