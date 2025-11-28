import { Card, CardContent } from '@/components/ui/card'
import { useTestsStore } from '@/store/tests-store'
import React from 'react'

const TestsStats = () => {
  const { pagination, stats } = useTestsStore()

  if (!stats) {
    return null
  }

  return (
    <Card className='mt-8'>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-center'>
          <div>
            <p className='text-2xl font-bold'>{pagination.totalItems}</p>
            <p className='text-muted-foreground text-sm'>Total Tests</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.publicCount}</p>
            <p className='text-muted-foreground text-sm'>Public</p>
          </div>
          <div>
            <p className='text-2xl font-bold'>{stats.privateCount}</p>
            <p className='text-muted-foreground text-sm'>Private</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TestsStats

