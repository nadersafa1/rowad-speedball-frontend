'use client'

import ChampionshipForm from '@/components/championships/championship-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageBreadcrumb } from '@/components/ui'
import { Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import ChampionshipsTable from './components/championships-table'
import { useChampionships } from './hooks/use-championships'
import { ChampionshipsFilters } from './types'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { useChampionshipPermissions } from '@/hooks/use-championship-permissions'
import Loading from '@/components/ui/loading'

const ChampionshipsPage = () => {
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { canCreate } = useChampionshipPermissions(null)

  const [championshipFormOpen, setChampionshipFormOpen] = useState(false)

  // Local filter state
  const [filters, setFilters] = useState<ChampionshipsFilters>({
    q: '',
    federationId: undefined,
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const {
    championships,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useChampionships(filters)

  if (isOrganizationContextLoading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent>
            <p className='text-destructive'>Error: {error}</p>
            <Button onClick={clearError} className='mt-4'>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <div className='mb-4'>
        <PageBreadcrumb />
      </div>
      {/* Header */}
      <PageHeader
        icon={Trophy}
        title='Championships'
        description='Browse and manage federation championships'
        actionDialog={
          canCreate
            ? {
                open: championshipFormOpen,
                onOpenChange: setChampionshipFormOpen,
                trigger: (
                  <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
                    <Plus className='h-4 w-4' />
                    Create Championship
                  </Button>
                ),
                content: (
                  <ChampionshipForm
                    onSuccess={() => {
                      setChampionshipFormOpen(false)
                      refetch()
                    }}
                    onCancel={() => setChampionshipFormOpen(false)}
                  />
                ),
              }
            : undefined
        }
      />

      {/* Championships Table */}
      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <ChampionshipsTable
            championships={championships}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => {
              setFilters({ ...filters, limit: pageSize, page: 1 })
            }}
            onSearchChange={(search) => {
              setFilters({ ...filters, q: search, page: 1 })
            }}
            searchValue={filters.q}
            federationId={filters.federationId}
            onFederationChange={(federationId) => {
              setFilters({ ...filters, federationId, page: 1 })
            }}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={(sortBy, sortOrder) => {
              setFilters({
                ...filters,
                sortBy: sortBy as ChampionshipsFilters['sortBy'],
                sortOrder: sortOrder || 'desc',
                page: 1,
              })
            }}
            isLoading={isLoading}
            onRefetch={refetch}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default ChampionshipsPage

