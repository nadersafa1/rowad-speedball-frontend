'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { EventFormat } from '@/types'

interface EventTabsProps {
  eventFormat: EventFormat
  hasMatches: boolean
}

const EventTabs = ({ eventFormat, hasMatches }: EventTabsProps) => {
  return (
    <TabsList className='w-full overflow-x-auto flex-nowrap sm:flex-wrap'>
      <TabsTrigger value='overview' className='whitespace-nowrap'>
        Overview
      </TabsTrigger>
      <TabsTrigger value='registrations' className='whitespace-nowrap'>
        Registrations
      </TabsTrigger>
      <TabsTrigger value='groups' className='whitespace-nowrap'>
        {eventFormat === 'groups' ? 'Groups' : 'Seeds'}
      </TabsTrigger>
      {hasMatches && (
        <TabsTrigger value='matches' className='whitespace-nowrap'>
          Matches
        </TabsTrigger>
      )}
      {eventFormat === 'groups' && (
        <TabsTrigger value='standings' className='whitespace-nowrap'>
          Standings
        </TabsTrigger>
      )}
    </TabsList>
  )
}

export default EventTabs
