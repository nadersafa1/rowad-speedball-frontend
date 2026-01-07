'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useChampionshipsStore } from '@/store/championships-store'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowLeft, Edit } from 'lucide-react'
import LoadingState from '@/components/shared/loading-state'
import ChampionshipEditionsTable from '@/components/championship-editions/championship-editions-table'
import { ChampionshipEditionForm } from '@/components/championship-editions/championship-edition-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const ChampionshipDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const championshipId = params.id as string

  const { context } = useOrganizationContext()
  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = context

  const {
    selectedChampionship,
    fetchChampionship,
    isLoading: championshipLoading,
  } = useChampionshipsStore()

  const {
    editions,
    fetchEditions,
    isLoading: editionsLoading,
    pagination,
  } = useChampionshipEditionsStore()

  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'draft' | 'published' | 'archived' | 'all'
  >('all')
  const [sortBy, setSortBy] = useState('year')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Fetch championship and editions on mount
  useEffect(() => {
    if (championshipId) {
      fetchChampionship(championshipId)
    }
  }, [championshipId, fetchChampionship])

  // Fetch editions with filters
  const fetchData = useCallback(() => {
    if (championshipId) {
      fetchEditions({
        championshipId,
        q: searchValue,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: sortBy as any,
        sortOrder,
        page,
        limit,
      })
    }
  }, [
    championshipId,
    searchValue,
    statusFilter,
    sortBy,
    sortOrder,
    page,
    limit,
    fetchEditions,
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleSearchChange = (search: string) => {
    setSearchValue(search)
    setPage(1)
  }

  const handleStatusChange = (
    status: 'draft' | 'published' | 'archived' | 'all'
  ) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleSortingChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    fetchData()
  }

  const canEdit = isSystemAdmin || isFederationAdmin || isFederationEditor

  if (championshipLoading && !selectedChampionship) {
    return <LoadingState message='Loading championship...' />
  }

  if (!selectedChampionship) {
    return (
      <div className='container mx-auto p-6'>
        <p>Championship not found</p>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push('/championships')}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Championships
            </Button>
          </div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold'>{selectedChampionship.name}</h1>
            <Badge
              variant={
                selectedChampionship.competitionScope === 'clubs'
                  ? 'default'
                  : 'secondary'
              }
            >
              {selectedChampionship.competitionScope === 'clubs'
                ? 'Clubs'
                : 'Open'}
            </Badge>
          </div>
          {selectedChampionship.description && (
            <p className='text-muted-foreground'>
              {selectedChampionship.description}
            </p>
          )}
          {(selectedChampionship as any).federationName && (
            <p className='text-sm text-muted-foreground'>
              Federation: {(selectedChampionship as any).federationName}
            </p>
          )}
        </div>
        <div className='flex gap-2'>
          {canEdit && (
            <Button
              onClick={() => router.push(`/championships/${championshipId}/edit`)}
            >
              <Edit className='h-4 w-4 mr-2' />
              Edit Championship
            </Button>
          )}
        </div>
      </div>

      {/* Championship Editions Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Championship Editions</CardTitle>
            {canEdit && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Add Edition
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ChampionshipEditionsTable
            editions={editions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearchChange={handleSearchChange}
            searchValue={searchValue}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortingChange={handleSortingChange}
            isLoading={editionsLoading}
            onRefetch={fetchData}
            championshipId={championshipId}
          />
        </CardContent>
      </Card>

      {/* Create Edition Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Create Championship Edition</DialogTitle>
            <DialogDescription>
              Add a new edition for {selectedChampionship.name}
            </DialogDescription>
          </DialogHeader>
          <ChampionshipEditionForm
            championshipId={championshipId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChampionshipDetailPage
