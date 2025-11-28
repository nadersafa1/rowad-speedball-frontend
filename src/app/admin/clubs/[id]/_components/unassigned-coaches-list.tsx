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
import type { Coach } from '@/db/schema'
import type { PaginatedResponse } from '@/types/api/pagination'

interface UnassignedCoachesListProps {
  organizationId: string
}

export const UnassignedCoachesList = ({
  organizationId,
}: UnassignedCoachesListProps) => {
  const router = useRouter()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCoaches()
  }, [])

  const fetchCoaches = async () => {
    setIsLoading(true)
    try {
      const response = (await apiClient.getCoaches({
        unassigned: 'true',
        limit: 100,
      })) as PaginatedResponse<Coach>
      setCoaches(response.data || [])
    } catch (error) {
      console.error('Failed to fetch unassigned coaches:', error)
      toast.error('Failed to load unassigned coaches')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLink = async (coachId: string) => {
    setLinkingId(coachId)
    try {
      // Update coach organizationId
      await apiClient.updateCoach(coachId, { organizationId })

      // If coach has userId, add user as member with 'coach' role
      const coach = coaches.find((c) => c.id === coachId)
      if (coach?.userId) {
        const response = await fetch(
          `/api/v1/organizations/${organizationId}/members`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: coach.userId,
              role: 'coach',
            }),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to add user as member')
        }
      }

      toast.success('Coach linked to organization successfully')
      router.refresh()
      fetchCoaches()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to link coach'
      )
    } finally {
      setLinkingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <LoadingSwap isLoading={true}>Loading coaches...</LoadingSwap>
      </div>
    )
  }

  if (coaches.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No unassigned coaches found
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Has User</TableHead>
            <TableHead className='w-[150px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coaches.map((coach) => (
            <TableRow key={coach.id}>
              <TableCell className='font-medium'>{coach.name}</TableCell>
              <TableCell>
                <Badge variant='outline'>
                  {coach.gender === 'male' ? 'M' : 'F'}
                </Badge>
              </TableCell>
              <TableCell>
                {coach.userId ? (
                  <Badge variant='secondary'>Yes</Badge>
                ) : (
                  <Badge variant='outline'>No</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  size='sm'
                  onClick={() => handleLink(coach.id)}
                  disabled={linkingId === coach.id}
                >
                  <LoadingSwap isLoading={linkingId === coach.id}>
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

