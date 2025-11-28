import { Card, CardContent } from '@/components/ui/card'
import { useCoachesStore } from '@/store/coaches-store'
import React from 'react'

const CoachesStats = () => {
  const { pagination, stats } = useCoachesStore()

  if (!stats) {
    return null
  }

  return (
    <Card className='mt-8'>
      <CardContent>
        <div className='grid grid-cols-3 gap-4 text-center'>
          <div>
            <p className='text-2xl font-bold'>{pagination.totalItems}</p>
            <p className='text-muted-foreground text-sm'>Total Coaches</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.maleCount}</p>
            <p className='text-muted-foreground text-sm'>Male</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.femaleCount}</p>
            <p className='text-muted-foreground text-sm'>Female</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CoachesStats

