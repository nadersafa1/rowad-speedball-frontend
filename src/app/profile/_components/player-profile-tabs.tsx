'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EnhancedPlayerProfile from './enhanced-player-profile'
import PlayerProfileForm from './player-profile-form'
import type { Player } from '@/types'

interface PlayerProfileTabsProps {
  player: Player
  userId: string
}

const PlayerProfileTabs = ({ player, userId }: PlayerProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview')

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'overview' | 'edit')}
      className='w-full'
    >
      <TabsList className='grid w-full grid-cols-2'>
        <TabsTrigger value='overview'>Overview</TabsTrigger>
        <TabsTrigger value='edit'>Edit Profile</TabsTrigger>
      </TabsList>
      <TabsContent value='overview' className='mt-6'>
        <EnhancedPlayerProfile
          player={player}
          userId={userId}
          onEditClick={() => setActiveTab('edit')}
        />
      </TabsContent>
      <TabsContent value='edit' className='mt-6'>
        <PlayerProfileForm player={player} />
      </TabsContent>
    </Tabs>
  )
}

export default PlayerProfileTabs
