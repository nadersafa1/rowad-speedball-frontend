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
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  SortAsc,
  SortDesc,
  ExternalLink,
} from 'lucide-react'
import { usePointsSchemasStore } from '@/store/points-schemas-store'
import PointsSchemaForm from '@/components/points-schemas/points-schema-form'
import type { PointsSchema } from '@/db/schema'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface PointsSchemasTableProps {
  onRefetch: () => void
}

export default function PointsSchemasTable({
  onRefetch,
}: PointsSchemasTableProps) {
  const router = useRouter()
  const { schemas, isLoading, deleteSchema, pagination } =
    usePointsSchemasStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState<PointsSchema | null>(
    null
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [schemaToDelete, setSchemaToDelete] = useState<PointsSchema | null>(
    null
  )
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleEdit = (schema: PointsSchema) => {
    setSelectedSchema(schema)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (schema: PointsSchema) => {
    setSchemaToDelete(schema)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!schemaToDelete) return

    try {
      await deleteSchema(schemaToDelete.id)
      toast.success('Points schema deleted successfully')
      onRefetch()
    } catch (error: any) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete points schema'
      )
    } finally {
      setDeleteDialogOpen(false)
      setSchemaToDelete(null)
    }
  }

  const toggleSort = (column: 'name' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder(column === 'name' ? 'asc' : 'desc')
    }
  }

  // Filter and sort schemas
  const filteredSchemas = schemas
    .filter((schema) => {
      const query = searchQuery.toLowerCase()
      return (
        schema.name.toLowerCase().includes(query) ||
        schema.description?.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (isLoading) {
    return (
      <div className='rounded-md border'>
        <div className='p-8 text-center text-muted-foreground'>
          Loading points schemas...
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
            placeholder='Search points schemas...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        <Badge variant='outline' className='text-sm'>
          {filteredSchemas.length} schema
          {filteredSchemas.length !== 1 ? 's' : ''}
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
                  Name
                  {sortBy === 'name' &&
                    (sortOrder === 'asc' ? (
                      <SortAsc className='ml-1 h-3 w-3' />
                    ) : (
                      <SortDesc className='ml-1 h-3 w-3' />
                    ))}
                </Button>
              </TableHead>
              <TableHead className='hidden md:table-cell'>
                Description
              </TableHead>
              <TableHead className='hidden lg:table-cell'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2'
                  onClick={() => toggleSort('createdAt')}
                >
                  Created At
                  {sortBy === 'createdAt' &&
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
            {filteredSchemas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='h-24 text-center'>
                  {searchQuery
                    ? 'No points schemas found matching your search.'
                    : 'No points schemas yet. Create your first one!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSchemas.map((schema) => (
                <TableRow key={schema.id}>
                  <TableCell className='font-semibold'>
                    <button
                      onClick={() =>
                        router.push(`/admin/points-schemas/${schema.id}`)
                      }
                      className='flex items-center gap-2 hover:text-rowad-600 transition-colors'
                    >
                      {schema.name}
                      <ExternalLink className='h-3 w-3' />
                    </button>
                  </TableCell>
                  <TableCell className='hidden md:table-cell max-w-xs truncate'>
                    {schema.description || '-'}
                  </TableCell>
                  <TableCell className='hidden lg:table-cell text-muted-foreground'>
                    {formatDate(schema.createdAt)}
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
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/points-schemas/${schema.id}`)
                          }
                        >
                          <ExternalLink className='mr-2 h-4 w-4' />
                          View Entries
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(schema)}>
                          <Pencil className='mr-2 h-4 w-4' />
                          Edit Schema
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(schema)}
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
        <PointsSchemaForm
          schema={selectedSchema || undefined}
          onSuccess={() => {
            setEditDialogOpen(false)
            setSelectedSchema(null)
            onRefetch()
          }}
          onCancel={() => {
            setEditDialogOpen(false)
            setSelectedSchema(null)
          }}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the points schema "
              {schemaToDelete?.name}". This action cannot be undone.
              {schemaToDelete && (
                <div className='mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800'>
                  <p className='text-sm text-amber-900 dark:text-amber-100'>
                    <strong>Warning:</strong> This schema cannot be deleted if
                    it is being used by any events. Remove it from all events
                    first.
                  </p>
                </div>
              )}
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
