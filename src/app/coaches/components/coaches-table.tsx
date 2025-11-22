'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useCoachesStore } from '@/store/coaches-store'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Gender } from '../types/enums'
import type { Coach } from '@/db/schema'
import CoachForm from '@/components/coaches/coach-form'

interface CoachesTableProps {
  coaches: Coach[]
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
  gender?: Gender
  onGenderChange?: (gender: Gender) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
}

const CoachesTable = ({
  coaches,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  searchValue = '',
  gender = Gender.ALL,
  onGenderChange,
  sortBy,
  sortOrder,
  onSortingChange,
  isLoading = false,
  onRefetch,
}: CoachesTableProps) => {
  const { isAdmin } = useAdminPermission()
  const { deleteCoach } = useCoachesStore()
  const router = useRouter()
  const [editCoach, setEditCoach] = useState<Coach | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleDelete = async (coach: Coach) => {
    try {
      await deleteCoach(coach.id)
      toast.success('Coach deleted successfully')
      onRefetch?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete coach'
      )
    }
  }

  const handleEdit = (coach: Coach) => {
    setEditCoach(coach)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditCoach(null)
    onRefetch?.()
  }

  const handleSort = (field: string) => {
    if (!onSortingChange) return
    const newOrder =
      sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    onSortingChange(field, newOrder)
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <Input
          placeholder='Search coaches...'
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className='max-w-sm'
        />
        {onGenderChange && (
          <Select
            value={gender}
            onValueChange={(value) => onGenderChange(value as Gender)}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Gender.ALL}>All Genders</SelectItem>
              <SelectItem value={Gender.MALE}>Male</SelectItem>
              <SelectItem value={Gender.FEMALE}>Female</SelectItem>
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
                  onClick={() => handleSort('gender')}
                >
                  Gender
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </Button>
              </TableHead>
              <TableHead>Created</TableHead>
              {isAdmin && <TableHead className='text-right'>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className='h-24 text-center'>
                  Loading...
                </TableCell>
              </TableRow>
            ) : coaches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className='h-24 text-center'>
                  No coaches found.
                </TableCell>
              </TableRow>
            ) : (
              coaches.map((coach) => (
                <TableRow key={coach.id}>
                  <TableCell className='font-medium'>
                    <Link
                      href={`/coaches/${coach.id}`}
                      className='hover:underline'
                    >
                      {coach.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {coach.gender === 'male' ? 'Male' : 'Female'}
                  </TableCell>
                  <TableCell>
                    {new Date(coach.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => handleEdit(coach)}>
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
                            <AlertDialogTitle>Delete Coach</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {coach.name}? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                              onClick={() => handleDelete(coach)}
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
          {Math.min(pagination.page * pagination.limit, pagination.totalItems)}{' '}
          of {pagination.totalItems} coaches
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

      {editCoach && (
        <CoachForm
          coach={editCoach}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setEditDialogOpen(false)
            setEditCoach(null)
          }}
        />
      )}
    </div>
  )
}

export default CoachesTable

