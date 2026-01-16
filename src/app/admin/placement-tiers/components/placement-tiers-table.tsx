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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { MoreHorizontal, Pencil, Trash2, Search, SortAsc, SortDesc } from 'lucide-react'
import { usePlacementTiersStore } from '@/store/placement-tiers-store'
import PlacementTierForm from '@/components/placement-tiers/placement-tier-form'
import type { PlacementTier } from '@/db/schema'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface PlacementTiersTableProps {
  onRefetch: () => void
}

export default function PlacementTiersTable({ onRefetch }: PlacementTiersTableProps) {
  const { tiers, isLoading, deleteTier, pagination } = usePlacementTiersStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<PlacementTier | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tierToDelete, setTierToDelete] = useState<PlacementTier | null>(null)
  const [sortBy, setSortBy] = useState<'rank' | 'name'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleEdit = (tier: PlacementTier) => {
    setSelectedTier(tier)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (tier: PlacementTier) => {
    setTierToDelete(tier)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tierToDelete) return

    try {
      await deleteTier(tierToDelete.id)
      toast.success('Placement tier deleted successfully')
      onRefetch()
    } catch (error: any) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete placement tier'
      )
    } finally {
      setDeleteDialogOpen(false)
      setTierToDelete(null)
    }
  }

  const toggleSort = (column: 'rank' | 'name') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Filter and sort tiers
  const filteredTiers = tiers
    .filter((tier) => {
      const query = searchQuery.toLowerCase()
      return (
        tier.name.toLowerCase().includes(query) ||
        tier.displayName?.toLowerCase().includes(query) ||
        tier.description?.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'rank') {
        comparison = a.rank - b.rank
      } else {
        comparison = a.name.localeCompare(b.name)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (isLoading) {
    return (
      <div className='rounded-md border'>
        <div className='p-8 text-center text-muted-foreground'>
          Loading placement tiers...
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Search and Filters */}
      <div className='mb-4 flex items-center gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search placement tiers...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        <Badge variant='outline' className='text-sm'>
          {filteredTiers.length} tier{filteredTiers.length !== 1 ? 's' : ''}
        </Badge>
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
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2'
                  onClick={() => toggleSort('name')}
                >
                  Name
                  {sortBy === 'name' &&
                    (sortOrder === 'asc' ? (
                      <SortAsc className='ml-1 h-3 w-3' />
                    ) : (
                      <SortDesc className='ml-1 h-3 w-3' />
                    ))}
                </Button>
              </TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead className='hidden md:table-cell'>Description</TableHead>
              <TableHead className='hidden lg:table-cell'>Created At</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  {searchQuery
                    ? 'No placement tiers found matching your search.'
                    : 'No placement tiers yet. Create your first one!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <Badge variant='secondary'>{tier.rank}</Badge>
                  </TableCell>
                  <TableCell className='font-mono font-semibold'>
                    {tier.name}
                  </TableCell>
                  <TableCell>{tier.displayName || '-'}</TableCell>
                  <TableCell className='hidden md:table-cell max-w-xs truncate'>
                    {tier.description || '-'}
                  </TableCell>
                  <TableCell className='hidden lg:table-cell text-muted-foreground'>
                    {formatDate(tier.createdAt)}
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
                        <DropdownMenuItem onClick={() => handleEdit(tier)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(tier)}
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
        <PlacementTierForm
          tier={selectedTier || undefined}
          onSuccess={() => {
            setEditDialogOpen(false)
            setSelectedTier(null)
            onRefetch()
          }}
          onCancel={() => {
            setEditDialogOpen(false)
            setSelectedTier(null)
          }}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the placement tier{' '}
              <span className='font-semibold'>{tierToDelete?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTierToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
