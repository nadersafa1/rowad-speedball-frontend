'use client'

import { ChampionshipEditionForm } from '@/components/championship-editions/championship-edition-form'
import ChampionshipEditionsTableRefactored from '@/components/championship-editions/championship-editions-table-refactored'
import LoadingState from '@/components/shared/loading-state'
import { SinglePageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFederation } from '@/hooks/authorization/use-federation'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { useChampionshipsStore } from '@/store/championships-store'
import { Edit, Plus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

const ChampionshipDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const championshipId = params.id as string

  const { isSystemAdmin, isFederationAdmin, isFederationEditor } = useFederation()

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
  const [sortBy, setSortBy] = useState('status')
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

  const handleSortingChange = (
    newSortBy?: string,
    newSortOrder?: 'asc' | 'desc'
  ) => {
    if (newSortBy && newSortOrder) {
      setSortBy(newSortBy)
      setSortOrder(newSortOrder)
    }
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
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader
        backTo='/championships'
        actionButtons={
          canEdit
            ? [
                {
                  label: 'Edit Championship',
                  icon: Edit,
                  buttonClassName: 'gap-2',
                  onClick: () =>
                    router.push(`/championships/${championshipId}/edit`),
                },
              ]
            : undefined
        }
      />

      {/* Championship Header */}
      <div className='mb-6'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>
            {selectedChampionship.name}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {selectedChampionship.description || 'Manage championship details'}
          </p>
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
          <ChampionshipEditionsTableRefactored
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
            federationId={selectedChampionship?.federationId || ''}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChampionshipDetailPage
