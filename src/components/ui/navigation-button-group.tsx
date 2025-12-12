'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from './button'
import { ButtonGroup } from './button-group'

const NavigationButtonGroup = () => {
  const router = useRouter()

  return (
    <ButtonGroup orientation='horizontal'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => router.back()}
        aria-label='Go back'
      >
        <ArrowLeft className='h-4 w-4' />
      </Button>
      <Button
        variant='outline'
        size='sm'
        asChild
        aria-label='Go to home'
      >
        <Link href='/'>
          <Home className='h-4 w-4' />
        </Link>
      </Button>
    </ButtonGroup>
  )
}

export default NavigationButtonGroup

