'use client'

import PlayerForm from '@/components/players/player-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageBreadcrumb } from '@/components/ui'
import { Plus, Volleyball } from 'lucide-react'
import { useState } from 'react'
import PlayersStats from './components/players-stats'
import PlayersTable from './components/players-table'
import { usePlayers } from './hooks/use-players'
import { PlayersFilters } from './types'
import { AgeGroup, Gender, Team } from './types/enums'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import Loading from '@/components/ui/loading'

const PlayersPage = () => {
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { isSystemAdmin, isCoach, isAdmin, isOwner } = context

  const [playerFormOpen, setPlayerFormOpen] = useState(false)

  // Local filter state
  const [filters, setFilters] = useState<PlayersFilters>({
    q: '',
    gender: Gender.ALL,
    ageGroup: AgeGroup.ALL,
    team: Team.ALL,
    organizationId: undefined,
    page: 1,
    limit: 25,
  })

  const {
    players,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = usePlayers(filters)

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
        icon={Volleyball}
        title='Players'
        description='Browse and manage all registered players'
        actionDialog={
          isSystemAdmin || isCoach || isAdmin || isOwner
            ? {
                open: playerFormOpen,
                onOpenChange: setPlayerFormOpen,
                trigger: (
                  <Button className='gap-2 bg-rowad-600 hover:bg-rowad-700'>
                    <Plus className='h-4 w-4' />
                    Create Player
                  </Button>
                ),
                content: (
                  <PlayerForm
                    onSuccess={() => {
                      setPlayerFormOpen(false)
                      refetch()
                    }}
                    onCancel={() => setPlayerFormOpen(false)}
                  />
                ),
              }
            : undefined
        }
      />

      {/* Players Table */}
      <Card className='mt-4 sm:mt-6'>
        <CardContent>
          <PlayersTable
            players={players}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => {
              setFilters({ ...filters, limit: pageSize, page: 1 })
            }}
            onSearchChange={(search) => {
              setFilters({ ...filters, q: search, page: 1 })
            }}
            searchValue={filters.q}
            gender={filters.gender}
            ageGroup={filters.ageGroup}
            onGenderChange={(gender) => {
              setFilters({ ...filters, gender, page: 1 })
            }}
            onAgeGroupChange={(ageGroup) => {
              setFilters({ ...filters, ageGroup, page: 1 })
            }}
            team={filters.team}
            onTeamChange={(team) => {
              setFilters({ ...filters, team, page: 1 })
            }}
            organizationId={filters.organizationId}
            onOrganizationChange={(organizationId) => {
              setFilters({ ...filters, organizationId, page: 1 })
            }}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortingChange={(sortBy, sortOrder) => {
              setFilters({
                ...filters,
                sortBy: sortBy as PlayersFilters['sortBy'],
                sortOrder,
                page: 1,
              })
            }}
            isLoading={isLoading}
            onRefetch={refetch}
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <PlayersStats />
    </div>
  )
}

export default PlayersPage
