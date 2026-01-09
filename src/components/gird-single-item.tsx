import React from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ArrowRight, LucideIcon } from 'lucide-react'
import Link from 'next/link'

const GridSingleItem = ({
  href,
  title,
  description,
  Icon,
}: {
  href: string
  title: string
  description: string
  Icon: LucideIcon
}) => {
  return (
    <Link href={href} className='group h-full block'>
      <Card className='h-full flex flex-col transition-all hover:shadow-lg hover:border-primary/50'>
        <CardHeader className='p-4 flex-1 flex items-center'>
          <div className='flex items-center justify-between w-full'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors'>
                <Icon className='h-6 w-6 text-primary' />
              </div>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <ArrowRight className='h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}

export default GridSingleItem
