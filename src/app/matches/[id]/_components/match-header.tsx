'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MatchHeader = () => {
  const router = useRouter()

  return (
    <div className='flex items-center gap-4'>
      <Button variant='ghost' onClick={() => router.back()}>
        <ArrowLeft className='h-4 w-4 mr-2' />
        Back
      </Button>
      <div>
        <h1 className='text-2xl font-bold'>Live Match Scoring</h1>
      </div>
    </div>
  )
}

export default MatchHeader

