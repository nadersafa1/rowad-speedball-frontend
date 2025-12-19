'use client'

import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { EventFormat } from '@/types'

interface EventTabsProps {
  eventFormat: EventFormat
}

const EventTabs = ({ eventFormat }: EventTabsProps) => {
  const isTestEvent = eventFormat === 'tests'
  const isGroupsFormat = eventFormat === 'groups'

  return (
    <TabsList className='w-full overflow-x-auto flex-nowrap sm:flex-wrap'>
      <TabsTrigger value='overview' className='whitespace-nowrap'>
        Overview
      </TabsTrigger>
      <TabsTrigger value='registrations' className='whitespace-nowrap'>
        Registrations
      </TabsTrigger>
      {isGroupsFormat ? (
        <TabsTrigger value='groups' className='whitespace-nowrap'>
          Groups
        </TabsTrigger>
      ) : (
        <TabsTrigger value='seeds' className='whitespace-nowrap'>
          Seeds
        </TabsTrigger>
      )}

      {isTestEvent ? (
        <TabsTrigger value='heats' className='whitespace-nowrap'>
          Heats
        </TabsTrigger>
      ) : (
        <TabsTrigger value='matches' className='whitespace-nowrap'>
          Matches
        </TabsTrigger>
      )}
      {(isGroupsFormat || isTestEvent) && (
        <TabsTrigger value='standings' className='whitespace-nowrap'>
          Standings
        </TabsTrigger>
      )}
    </TabsList>
  )
}

export default EventTabs
