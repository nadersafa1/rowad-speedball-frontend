import { Card, CardContent } from '@/components/ui/card'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import React from 'react'

const TrainingSessionsStats = () => {
  const { pagination, stats } = useTrainingSessionsStore()

  if (!stats) {
    return null
  }

  return (
    <Card className='mt-8'>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
          <div>
            <p className='text-2xl font-bold'>{pagination.totalItems}</p>
            <p className='text-muted-foreground text-sm'>Total Sessions</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.highIntensityCount}</p>
            <p className='text-muted-foreground text-sm'>High Intensity</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.normalIntensityCount}</p>
            <p className='text-muted-foreground text-sm'>Normal Intensity</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.lowIntensityCount}</p>
            <p className='text-muted-foreground text-sm'>Low Intensity</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TrainingSessionsStats

