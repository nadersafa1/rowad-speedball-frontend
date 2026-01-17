'use client'

import { PageHeader, Unauthorized } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ClubsSortBy } from '@/config/tables/clubs.config'
import { useRoles } from '@/hooks/authorization/use-roles'
import { SortOrder } from '@/types'
import { Building2, Plus } from 'lucide-react'
import { useState } from 'react'
import ClubsTable from './components/clubs-table'
import { useClubs } from './hooks/use-clubs'
import { CreateOrganizationDialog } from './_components/create-organization-dialog'

const ClubsPage = () => {
  const { isSystemAdmin } = useRoles()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Local filter state
  const [filters, setFilters] = useState<{
    q: string
    page: number
    limit: number
    sortBy: ClubsSortBy
    sortOrder: SortOrder
  }>({
    q: '',
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: SortOrder.DESC,
  })

  const {
    clubs,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useClubs(filters)

  if (!isSystemAdmin) return <Unauthorized />

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
      <PageHeader
        icon={Building2}
        title='Clubs'
        description='Manage clubs and assign admins/coaches'
        actionDialogs={[
          {
            open: createDialogOpen,
            onOpenChange: setCreateDialogOpen,
            trigger: (
              <Button size='sm' variant='outline' className='gap-2'>
                <Plus className='h-4 w-4' />
                Create Club
              </Button>
            ),
            content: (
              <CreateOrganizationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={() => {
                  setCreateDialogOpen(false)
                  refetch()
                }}
              />
            ),
          },
        ]}
      />

      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <ClubsTable
            clubs={clubs}
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
                sortBy: sortBy || 'createdAt',
                sortOrder: sortOrder || SortOrder.DESC,
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

export default ClubsPage
