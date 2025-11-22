'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAdminPermission } from '@/hooks/use-admin-permission'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { toast } from 'sonner'
import { Intensity } from '../types/enums'
import type { TrainingSession, Coach } from '@/db/schema'
import TrainingSessionForm from '@/components/training-sessions/training-session-form'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
}

interface TrainingSessionsTableProps {
  trainingSessions: TrainingSessionWithCoaches[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange: (search: string) => void
  searchValue?: string
  intensity?: Intensity
  onIntensityChange?: (intensity: Intensity) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
}

const TrainingSessionsTable = ({
  trainingSessions,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  intensity = Intensity.ALL,
  onIntensityChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: TrainingSessionsTableProps) => {
  const { isAdmin } = useAdminPermission()
  const { deleteTrainingSession } = useTrainingSessionsStore()
  const [editSession, setEditSession] =
    useState<TrainingSessionWithCoaches | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleDelete = async (session: TrainingSessionWithCoaches) => {
    try {
      await deleteTrainingSession(session.id)
      toast.success('Training session deleted successfully')
      onRefetch?.()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete training session'
      )
    }
  }

  const handleEdit = (session: TrainingSessionWithCoaches) => {
    setEditSession(session)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditSession(null)
    onRefetch?.()
  }

  const handleSort = (field: string) => {
    if (!onSortingChange) return
    const newOrder =
      sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    onSortingChange(field, newOrder)
  }

  const formatType = (types: string[]) => {
    return types.map((t) => {
      const labels: Record<string, string> = {
        singles: 'Singles',
        men_doubles: 'Men Doubles',
        women_doubles: 'Women Doubles',
        mixed_doubles: 'Mixed Doubles',
        solo: 'Solo',
        relay: 'Relay',
      }
      return labels[t] || t
    })
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <Input
          placeholder='Search sessions...'
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className='max-w-sm'
        />
        {onIntensityChange && (
          <Select
            value={intensity}
            onValueChange={(value) => onIntensityChange(value as Intensity)}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by intensity' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Intensity.ALL}>All Intensities</SelectItem>
              <SelectItem value={Intensity.HIGH}>High</SelectItem>
              <SelectItem value={Intensity.NORMAL}>Normal</SelectItem>
              <SelectItem value={Intensity.LOW}>Low</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className='rounded-md border overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8'
                  onClick={() => handleSort('name')}
                >
                  Name
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8'
                  onClick={() => handleSort('intensity')}
                >
                  Intensity
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </Button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8'
                  onClick={() => handleSort('date')}
                >
                  Date
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </Button>
              </TableHead>
              <TableHead>Age Groups</TableHead>
              <TableHead>Coaches</TableHead>
              {isAdmin && <TableHead className='text-right'>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className='h-24 text-center'
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : trainingSessions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className='h-24 text-center'
                >
                  No training sessions found.
                </TableCell>
              </TableRow>
            ) : (
              trainingSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className='font-medium'>
                    <Link
                      href={`/training-sessions/${session.id}`}
                      className='hover:underline'
                    >
                      {session.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        session.intensity === 'high'
                          ? 'destructive'
                          : session.intensity === 'normal'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {session.intensity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {formatType(session.type).map((t, idx) => (
                        <Badge key={idx} variant='outline'>
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(session.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {session.ageGroups.map((ag, idx) => (
                        <Badge key={idx} variant='secondary'>
                          {ag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.coaches && session.coaches.length > 0 ? (
                      <span className='text-sm'>
                        {session.coaches.length} coach
                        {session.coaches.length > 1 ? 'es' : ''}
                      </span>
                    ) : (
                      <span className='text-sm text-muted-foreground'>None</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className='text-right'>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEdit(session)}
                            >
                              <Edit className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Training Session
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {session.name}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              onClick={() => handleDelete(session)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between'>
        <div className='text-sm text-muted-foreground'>
          Showing {pagination.page * pagination.limit - pagination.limit + 1} to{' '}
          {Math.min(
            pagination.page * pagination.limit,
            pagination.totalItems
          )}{' '}
          of {pagination.totalItems} sessions
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || isLoading}
          >
            Previous
          </Button>
          <span className='text-sm'>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {editSession && (
        <TrainingSessionForm
          trainingSession={{
            ...editSession,
            coaches: editSession.coaches || [],
          }}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setEditDialogOpen(false)
            setEditSession(null)
          }}
        />
      )}
    </div>
  )
}

export default TrainingSessionsTable

