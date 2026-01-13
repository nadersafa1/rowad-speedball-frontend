'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
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
import { MoreHorizontal, Pencil, Trash2, Plus, AlertCircle } from 'lucide-react'
import { useSeasonAgeGroupsStore } from '@/store/season-age-groups-store'
import AgeGroupForm from './age-group-form'
import type { SeasonAgeGroup } from '@/db/schema'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AgeGroupsManagementProps {
  seasonId: string
}

export default function AgeGroupsManagement({ seasonId }: AgeGroupsManagementProps) {
  const { ageGroups, fetchAgeGroups, deleteAgeGroup, isLoading } = useSeasonAgeGroupsStore()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<SeasonAgeGroup | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ageGroupToDelete, setAgeGroupToDelete] = useState<SeasonAgeGroup | null>(null)

  useEffect(() => {
    if (seasonId) {
      fetchAgeGroups({ seasonId, sortBy: 'displayOrder', sortOrder: 'asc' })
    }
  }, [seasonId, fetchAgeGroups])

  const handleEdit = (ageGroup: SeasonAgeGroup) => {
    setSelectedAgeGroup(ageGroup)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (ageGroup: SeasonAgeGroup) => {
    setAgeGroupToDelete(ageGroup)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ageGroupToDelete) return

    try {
      await deleteAgeGroup(ageGroupToDelete.id)
      toast.success('Age group deleted successfully')
      fetchAgeGroups({ seasonId, sortBy: 'displayOrder', sortOrder: 'asc' })
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete age group'
      if (errorMessage.includes('registrations')) {
        toast.error(
          'Cannot delete age group with active registrations. Please remove registrations first.'
        )
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setDeleteDialogOpen(false)
      setAgeGroupToDelete(null)
    }
  }

  const refetchAgeGroups = () => {
    fetchAgeGroups({ seasonId, sortBy: 'displayOrder', sortOrder: 'asc' })
  }

  const formatAgeRange = (minAge: number | null, maxAge: number | null): string => {
    if (minAge !== null && maxAge !== null) {
      return `${minAge}-${maxAge} years`
    }
    if (minAge !== null) {
      return `${minAge}+ years`
    }
    if (maxAge !== null) {
      return `Up to ${maxAge} years`
    }
    return 'No restrictions'
  }

  const hasNoRestrictions = (minAge: number | null, maxAge: number | null): boolean => {
    return minAge === null && maxAge === null
  }

  if (isLoading) {
    return (
      <div className='rounded-md border'>
        <div className='p-8 text-center text-muted-foreground'>Loading age groups...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header Section */}
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Age Groups</h3>
          <p className='text-sm text-muted-foreground'>
            Define age categories for player registration
          </p>
        </div>
        <Button size='sm' onClick={() => setCreateDialogOpen(true)} className='gap-2'>
          <Plus className='h-4 w-4' />
          Add Age Group
        </Button>
      </div>

      {/* Info Card */}
      {ageGroups.length === 0 && (
        <Card className='mb-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'>
          <CardHeader>
            <CardTitle className='text-base text-blue-900 dark:text-blue-100'>
              No Age Groups Yet
            </CardTitle>
            <CardDescription className='text-blue-700 dark:text-blue-300'>
              Age groups define the categories players can register for in this season
            </CardDescription>
          </CardHeader>
          <CardContent className='text-sm text-blue-900 dark:text-blue-100'>
            <p>
              Create age groups like "Under 16", "Under 19", or "Seniors". You can set
              optional age restrictions for each group, or leave them unrestricted for
              flexibility.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[80px]'>Order</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className='hidden md:table-cell'>Age Range</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ageGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  No age groups yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              ageGroups.map((ageGroup) => (
                <TableRow key={ageGroup.id}>
                  <TableCell>
                    <Badge variant='outline'>{ageGroup.displayOrder}</Badge>
                  </TableCell>
                  <TableCell className='font-mono font-semibold'>
                    {ageGroup.code}
                  </TableCell>
                  <TableCell className='font-medium'>{ageGroup.name}</TableCell>
                  <TableCell className='hidden md:table-cell'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-muted-foreground'>
                        {formatAgeRange(ageGroup.minAge, ageGroup.maxAge)}
                      </span>
                      {hasNoRestrictions(ageGroup.minAge, ageGroup.maxAge) && (
                        <AlertCircle className='h-4 w-4 text-yellow-600' />
                      )}
                    </div>
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
                        <DropdownMenuItem onClick={() => handleEdit(ageGroup)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(ageGroup)}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <AgeGroupForm
          seasonId={seasonId}
          onSuccess={() => {
            setCreateDialogOpen(false)
            refetchAgeGroups()
          }}
          onCancel={() => setCreateDialogOpen(false)}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AgeGroupForm
          seasonId={seasonId}
          ageGroup={selectedAgeGroup || undefined}
          onSuccess={() => {
            setEditDialogOpen(false)
            setSelectedAgeGroup(null)
            refetchAgeGroups()
          }}
          onCancel={() => {
            setEditDialogOpen(false)
            setSelectedAgeGroup(null)
          }}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Age Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{ageGroupToDelete?.name}</strong>?
              <br />
              <br />
              This will permanently delete the age group and cannot be undone. This action
              will fail if the age group has active registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className='bg-destructive'>
              Delete Age Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
