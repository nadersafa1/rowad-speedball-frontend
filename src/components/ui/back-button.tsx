'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  href: string
  longText: string
  shortText?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

const BackButton = ({
  href,
  longText,
  shortText = 'Back',
  variant = 'outline',
  size = 'sm',
  className,
}: BackButtonProps) => {
  return (
    <Link href={href}>
      <Button variant={variant} size={size} className={cn('gap-2', className)}>
        <ArrowLeft className='h-4 w-4' />
        <span className='hidden sm:inline'>{longText}</span>
        {shortText && <span className='sm:hidden'>{shortText}</span>}
      </Button>
    </Link>
  )
}

export default BackButton

