'use client'

import FederationForm from '@/components/federations/federation-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageBreadcrumb } from '@/components/ui'
import { Plus, Building2 } from 'lucide-react'
import { useState } from 'react'
import FederationsTable from './components/federations-table'
import { useFederations } from './hooks/use-federations'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useFederationPermissions } from '@/hooks/authorization/use-federation-permissions'
import Loading from '@/components/ui/loading'

const FederationsPage = () => {
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { canCreate } = useFederationPermissions(null)

  const [federationFormOpen, setFederationFormOpen] = useState(false)

  // Local filter state
  const [filters, setFilters] = useState({
    q: '',
    page: 1,
    limit: 25,
    sortBy: 'createdAt' as 'name' | 'createdAt' | 'updatedAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  })

  const {
    federations,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useFederations(filters)

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
      {/* <div className='mb-4'>
        <PageBreadcrumb />
      </div> */}
      {/* Header */}
      <PageHeader
        icon={Building2}
        title='Federations'
        description='Browse and manage all federations'
        actionDialogs={
          canCreate
            ? [
                {
                  open: federationFormOpen,
                  onOpenChange: setFederationFormOpen,
                  trigger: (
                    <Button size='sm' variant='outline' className='gap-2'>
                      <Plus className='h-4 w-4' />
                      Create Federation
                    </Button>
                  ),
                  content: (
                    <FederationForm
                      onSuccess={() => {
                        setFederationFormOpen(false)
                        refetch()
                      }}
                      onCancel={() => setFederationFormOpen(false)}
                    />
                  ),
                },
              ]
            : undefined
        }
      />

      {/* Federations Table */}
      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <FederationsTable
            federations={federations}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => {
              setFilters({ ...filters, limit: pageSize, page: 1 })
            }}
            onSearchChange={(search) => {
              setFilters({ ...filters, q: search, page: 1 })
            }}
            searchValue={filters.q}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={(sortBy, sortOrder) => {
              setFilters({
                ...filters,
                sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
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

export default FederationsPage
