'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from './button'

const BackButton = ({ backTo }: { backTo?: string }) => {
  const router = useRouter()

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => (backTo ? router.push(backTo) : router.back())}
      aria-label='Go back'
    >
      <ArrowLeft className='h-4 w-4' />
      <span className='hidden sm:inline'>Back</span>
    </Button>
  )
}

export default BackButton
