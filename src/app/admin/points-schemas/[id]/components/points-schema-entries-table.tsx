'use client'

import { useState } from 'react'
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
import { MoreHorizontal, Pencil, Trash2, SortAsc, SortDesc } from 'lucide-react'
import { usePointsSchemaEntriesStore } from '@/store/points-schema-entries-store'
import PointsSchemaEntryForm from '@/components/points-schemas/points-schema-entry-form'
import { toast } from 'sonner'

interface PointsSchemaEntriesTableProps {
  pointsSchemaId: string
  onRefetch: () => void
}

export default function PointsSchemaEntriesTable({
  pointsSchemaId,
  onRefetch,
}: PointsSchemaEntriesTableProps) {
  const { entries, isLoading, deleteEntry } = usePointsSchemaEntriesStore()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<any | null>(null)
  const [sortBy, setSortBy] = useState<'rank' | 'points'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleEdit = (entry: any) => {
    setSelectedEntry(entry)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (entry: any) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return

    try {
      await deleteEntry(entryToDelete.id)
      toast.success('Points entry deleted successfully')
      onRefetch()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete points entry')
    } finally {
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  const toggleSort = (column: 'rank' | 'points') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Sort entries
  const sortedEntries = [...entries].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'rank') {
      comparison = (a.placementTier?.rank || 0) - (b.placementTier?.rank || 0)
    } else {
      comparison = a.points - b.points
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Get existing tier IDs for the form
  const existingTierIds = entries.map((e) => e.placementTierId)

  if (isLoading) {
    return (
      <div className='rounded-md border'>
        <div className='p-8 text-center text-muted-foreground'>
          Loading points entries...
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Table Header Info */}
      <div className='mb-4 flex items-center justify-between'>
        <Badge variant='outline' className='text-sm'>
          {sortedEntries.length} entr{sortedEntries.length !== 1 ? 'ies' : 'y'}
        </Badge>
        {sortedEntries.length > 0 && (
          <div className='text-sm text-muted-foreground'>
            Total points range: {Math.min(...entries.map((e) => e.points))} -{' '}
            {Math.max(...entries.map((e) => e.points))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2'
                  onClick={() => toggleSort('rank')}
                >
                  Rank
                  {sortBy === 'rank' &&
                    (sortOrder === 'asc' ? (
                      <SortAsc className='ml-1 h-3 w-3' />
                    ) : (
                      <SortDesc className='ml-1 h-3 w-3' />
                    ))}
                </Button>
              </TableHead>
              <TableHead>Tier Name</TableHead>
              <TableHead className='hidden md:table-cell'>
                Display Name
              </TableHead>
              <TableHead className='w-[120px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2'
                  onClick={() => toggleSort('points')}
                >
                  Points
                  {sortBy === 'points' &&
                    (sortOrder === 'asc' ? (
                      <SortAsc className='ml-1 h-3 w-3' />
                    ) : (
                      <SortDesc className='ml-1 h-3 w-3' />
                    ))}
                </Button>
              </TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  No points entries yet. Create your first one to define how
                  points are awarded!
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant='secondary'>
                      {entry.placementTier?.rank || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-mono font-semibold'>
                    {entry.placementTier?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {entry.placementTier?.displayName || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className='font-semibold text-base'
                    >
                      {entry.points}
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
                        <DropdownMenuItem onClick={() => handleEdit(entry)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          Edit Points
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(entry)}
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
        <PointsSchemaEntryForm
          pointsSchemaId={pointsSchemaId}
          entry={selectedEntry || undefined}
          existingTierIds={existingTierIds}
          onSuccess={() => {
            setEditDialogOpen(false)
            setSelectedEntry(null)
            onRefetch()
          }}
          onCancel={() => {
            setEditDialogOpen(false)
            setSelectedEntry(null)
          }}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the points entry for &quot;
              {entryToDelete?.placementTier?.name}&quot; (
              {entryToDelete?.points} points). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
