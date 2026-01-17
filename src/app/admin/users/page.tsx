'use client'

import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Users as UsersIcon } from 'lucide-react'
import { useState } from 'react'
import UsersTable from './components/users-table'
import { useUsers } from './hooks/use-users'
import { UserRoles, UsersFilters } from './types'
import { useRoles } from '@/hooks/authorization/use-roles'
import Unauthorized from '@/components/ui/unauthorized'

const UsersPage = () => {
  const { isSystemAdmin } = useRoles()

  // Local filter state
  const [filters, setFilters] = useState<UsersFilters>({
    q: '',
    role: undefined,
    page: 1,
    limit: 25,
  })

  const { users, isLoading, error, pagination, clearError, refetch } =
    useUsers(filters)

  if (!isSystemAdmin) {
    return <Unauthorized />
  }

  if (error) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent>
            <p className='text-destructive'>Error: {error}</p>
            <button onClick={clearError} className='mt-4'>
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      {/* Header */}
      <PageHeader
        icon={UsersIcon}
        title='Users'
        description='Manage system users, federation roles, and permissions'
      />

      {/* Users Table */}
      <Card className='mt-4'>
        <CardContent>
          <UsersTable
            users={users}
            pagination={pagination}
            onPageChange={(page) => {
              setFilters({ ...filters, page })
            }}
            onPageSizeChange={(pageSize) => {
              setFilters({ ...filters, limit: pageSize, page: 1 })
            }}
            onSearchChange={(search) => {
              setFilters({ ...filters, q: search, page: 1 })
            }}
            searchValue={filters.q}
            role={filters.role}
            onRoleChange={(role) => {
              setFilters({ ...filters, role, page: 1 })
            }}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={(sortBy, sortOrder) => {
              setFilters({
                ...filters,
                sortBy,
                sortOrder,
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

export default UsersPage
