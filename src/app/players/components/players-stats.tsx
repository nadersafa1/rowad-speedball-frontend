import { Card, CardContent } from '@/components/ui/card'
import { usePlayersStore } from '@/store/players-store'
import React from 'react'

const PlayersStats = () => {
  const { pagination, stats } = usePlayersStore()

  if (!stats) {
    return null
  }

  return (
    <Card className='mt-8'>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
          <div>
            <p className='text-2xl font-bold'>{pagination.totalItems}</p>
            <p className='text-muted-foreground text-sm'>Total Players</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.maleCount}</p>
            <p className='text-muted-foreground text-sm'>Male</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.femaleCount}</p>
            <p className='text-muted-foreground text-sm'>Female</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.ageGroupsCount}</p>
            <p className='text-muted-foreground text-sm'>Age Groups</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlayersStats
