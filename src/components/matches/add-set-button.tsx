'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AddSetButtonProps {
  matchId: string
  currentSetCount: number
  bestOf: number
  allSetsPlayed: boolean
  onCreateSet: (matchId: string, setNumber?: number) => Promise<void>
}

const AddSetButton = ({
  matchId,
  currentSetCount,
  bestOf,
  allSetsPlayed,
  onCreateSet,
}: AddSetButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const canAddSet = currentSetCount < bestOf && allSetsPlayed

  const handleAddSet = async () => {
    if (!canAddSet || isLoading) return

    setIsLoading(true)
    try {
      await onCreateSet(matchId)
      toast.success('Set created successfully')
    } catch (error: any) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create set'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!canAddSet) {
    return null
  }

  return (
    <Button
      onClick={handleAddSet}
      disabled={isLoading}
      className='w-full h-12 sm:h-14 text-base sm:text-lg font-semibold'
      size='lg'
    >
      <Plus className='mr-2 h-5 w-5 sm:h-6 sm:w-6' />
      {isLoading ? 'Creating Set...' : 'Add Set'}
    </Button>
  )
}

export default AddSetButton
