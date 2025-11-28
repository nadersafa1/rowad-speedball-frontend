'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { apiClient } from '@/lib/api-client'
import type { Player } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'
import { calculateAge } from '@/db/schema'

interface UnassignedPlayersListProps {
  organizationId: string
}

export const UnassignedPlayersList = ({
  organizationId,
}: UnassignedPlayersListProps) => {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    setIsLoading(true)
    try {
      const response = (await apiClient.getPlayers({
        unassigned: 'true',
        limit: 100,
      })) as PaginatedResponse<Player>
      setPlayers(response.data || [])
    } catch (error) {
      console.error('Failed to fetch unassigned players:', error)
      toast.error('Failed to load unassigned players')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLink = async (playerId: string) => {
    setLinkingId(playerId)
    try {
      // Update player organizationId
      await apiClient.updatePlayer(playerId, { organizationId })

      // If player has userId, add user as member with 'player' role
      const player = players.find((p) => p.id === playerId)
      if (player?.userId) {
        const response = await fetch(
          `/api/v1/organizations/${organizationId}/members`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: player.userId,
              role: 'player',
            }),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to add user as member')
        }
      }

      toast.success('Player linked to organization successfully')
      router.refresh()
      fetchPlayers()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to link player'
      )
    } finally {
      setLinkingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <LoadingSwap isLoading={true}>Loading players...</LoadingSwap>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No unassigned players found
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Has User</TableHead>
            <TableHead className='w-[150px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className='font-medium'>{player.name}</TableCell>
              <TableCell>{calculateAge(player.dateOfBirth)}</TableCell>
              <TableCell>
                <Badge variant='outline'>
                  {player.gender === 'male' ? 'M' : 'F'}
                </Badge>
              </TableCell>
              <TableCell>
                {player.userId ? (
                  <Badge variant='secondary'>Yes</Badge>
                ) : (
                  <Badge variant='outline'>No</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  size='sm'
                  onClick={() => handleLink(player.id)}
                  disabled={linkingId === player.id}
                >
                  <LoadingSwap isLoading={linkingId === player.id}>
                    Link to Club
                  </LoadingSwap>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

