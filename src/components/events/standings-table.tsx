'use client'

import type { Group, Registration } from '@/types'
import GroupStandingsTable from './group-standings-table'

interface StandingsTableProps {
  registrations: Registration[]
  groups: Group[]
}

const StandingsTable = ({ registrations, groups }: StandingsTableProps) => {
  // Filter registrations that have a groupId and group them
  const registrationsByGroup = registrations
    .filter((reg) => reg.groupId)
    .reduce((acc, reg) => {
      const groupId = reg.groupId!
      if (!acc[groupId]) {
        acc[groupId] = []
      }
      acc[groupId].push(reg)
      return acc
    }, {} as Record<string, Registration[]>)

  // Sort groups alphabetically by name
  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name))

  // Filter to only groups that have registrations
  const groupsWithRegistrations = sortedGroups.filter(
    (group) => registrationsByGroup[group.id]?.length > 0
  )

  if (groupsWithRegistrations.length === 0) {
    return (
      <div className='text-center text-muted-foreground py-8'>
        No group standings available. Create groups and assign registrations to
        see standings.
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {groupsWithRegistrations.map((group) => (
        <GroupStandingsTable
          key={group.id}
          groupName={group.name}
          registrations={registrationsByGroup[group.id]}
        />
      ))}
    </div>
  )
}

export default StandingsTable
