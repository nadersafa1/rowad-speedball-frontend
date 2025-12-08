'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import type { Registration } from '@/types'
import { StandingsTableHeader } from './standings-table-header'
import { StandingsTableRow } from './standings-table-row'

interface GroupStandingsTableProps {
  groupName: string
  registrations: Registration[]
}

const GroupStandingsTable = ({
  groupName,
  registrations,
}: GroupStandingsTableProps) => {
  // Sort by points (desc), then sets difference, then matches won
  const sortedRegistrations = [...registrations].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const aSetsDiff = a.setsWon - a.setsLost
    const bSetsDiff = b.setsWon - b.setsLost
    if (bSetsDiff !== aSetsDiff) return bSetsDiff - aSetsDiff
    return b.matchesWon - a.matchesWon
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Group {groupName} Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <StandingsTableHeader />
            <TableBody>
              {sortedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className='text-center text-muted-foreground px-2 sm:px-4'
                  >
                    No registrations in this group
                  </TableCell>
                </TableRow>
              ) : (
                sortedRegistrations.map((reg, index) => (
                  <StandingsTableRow
                    key={reg.id}
                    registration={reg}
                    position={index + 1}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default GroupStandingsTable
