'use client'

import PlayerForm from '@/components/players/player-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, PageBreadcrumb } from '@/components/ui'
import { Plus, Volleyball } from 'lucide-react'
import { useState } from 'react'
import PlayersStats from './components/players-stats'
import PlayersTable from './components/players-table'
import PlayersTableRefactored from './components/players-table-refactored'
import { usePlayers } from './hooks/use-players'
import { PlayersFilters } from './types'
import { AgeGroup, Gender, Team } from './types/enums'
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'
import { Badge } from '@/components/ui/badge'

const PlayersPage = () => {
  const { canCreate } = usePlayerPermissions(null)

  const [playerFormOpen, setPlayerFormOpen] = useState(false)
  const [useNewTable, setUseNewTable] = useState(false)

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
      {/* Header */}
      <PageHeader
        icon={Volleyball}
        title='Players'
        description='Browse and manage all registered players'
        actionDialogs={
          canCreate
            ? [
                {
                  open: playerFormOpen,
                  onOpenChange: setPlayerFormOpen,
                  trigger: (
                    <Button size='sm' variant='outline' className='gap-2'>
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
                },
              ]
            : undefined
        }
      />

      {/* Table Implementation Toggle */}
      <div className='mt-4 sm:mt-6 flex items-center gap-3'>
        <span className='text-sm text-muted-foreground'>
          Table Implementation:
        </span>
        <Button
          variant={!useNewTable ? 'default' : 'outline'}
          size='sm'
          onClick={() => setUseNewTable(false)}
        >
          Current
        </Button>
        <Button
          variant={useNewTable ? 'default' : 'outline'}
          size='sm'
          onClick={() => setUseNewTable(true)}
        >
          Table-Core (New)
          <Badge className='ml-2' variant='secondary'>
            Test
          </Badge>
        </Button>
      </div>

      {/* Players Table */}
      <Card className='mt-4'>
        <CardContent>
          {!useNewTable ? (
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
          ) : (
            <PlayersTableRefactored
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
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <PlayersStats />
    </div>
  )
}

export default PlayersPage
