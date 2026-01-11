'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFederationsStore } from '@/store/federations-store'
import { apiClient } from '@/lib/api-client'
import { useOrganization } from '@/hooks/authorization/use-organization'
import { toast } from 'sonner'
import { Loader2, Users } from 'lucide-react'
import { BulkApplyPlayerTable } from './components/bulk-apply-player-table'
import Loading from '@/components/ui/loading'
import Unauthorized from '@/components/ui/unauthorized'

interface PlayerWithEligibility {
  id: string
  name: string
  dateOfBirth: string
  gender: string
  isEligible: boolean
  ineligibilityReason: string | null
}

const BulkFederationApplyPage = () => {
  const router = useRouter()
  const { isOwner, isAdmin, isLoading: isOrgLoading } = useOrganization()
  const {
    federations,
    fetchFederations,
    isLoading: isFederationsLoading,
  } = useFederationsStore()

  const [selectedFederationId, setSelectedFederationId] = useState<string>('')
  const [players, setPlayers] = useState<PlayerWithEligibility[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [showIneligible, setShowIneligible] = useState(false)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch federations on mount
  useEffect(() => {
    fetchFederations({ sortBy: 'name', sortOrder: 'asc', limit: 100 })
  }, [fetchFederations])

  // Fetch eligible players when federation is selected
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedFederationId) {
        setPlayers([])
        setSelectedPlayerIds([])
        return
      }

      setIsLoadingPlayers(true)
      try {
        const response = await apiClient.getEligibleFederationPlayers(
          selectedFederationId
        )
        setPlayers(response.players)
        setSelectedPlayerIds([])
      } catch (error) {
        toast.error('Failed to load players')
        setPlayers([])
      } finally {
        setIsLoadingPlayers(false)
      }
    }

    fetchPlayers()
  }, [selectedFederationId])

  // Filter players based on showIneligible toggle
  const filteredPlayers = useMemo(() => {
    if (showIneligible) {
      return players
    }
    return players.filter((p) => p.isEligible)
  }, [players, showIneligible])

  const handleSubmit = async () => {
    if (!selectedFederationId || selectedPlayerIds.length === 0) {
      toast.error('Please select a federation and at least one player')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await apiClient.bulkCreateFederationPlayerRequests({
        federationId: selectedFederationId,
        playerIds: selectedPlayerIds,
      })

      toast.success(
        `Successfully submitted ${result.count} federation membership ${result.count === 1 ? 'request' : 'requests'}`
      )
      router.push('/players')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit requests'

      // Try to parse validation errors
      try {
        const parsed = JSON.parse(errorMessage)
        if (parsed.validationErrors) {
          const count = parsed.validationErrors.length
          toast.error(
            `Validation failed for ${count} player${count === 1 ? '' : 's'}. Please review and try again.`
          )
        } else {
          toast.error(errorMessage)
        }
      } catch {
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isOrgLoading) return <Loading />

  // Only org owners/admins can access
  if (!isOwner && !isAdmin) {
    return <Unauthorized />
  }

  const selectedCount = selectedPlayerIds.length
  const eligibleCount = players.filter((p) => p.isEligible).length

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <div className='mb-6'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
            <Users className='h-5 w-5 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Bulk Federation Application
            </h1>
            <p className='text-sm text-muted-foreground'>
              Apply for federation membership for multiple players at once
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-6'>
        {/* Federation Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Federation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <Label htmlFor='federation-select'>Federation</Label>
              {isFederationsLoading ? (
                <div className='flex items-center justify-center py-4'>
                  <Loader2 className='h-6 w-6 animate-spin' />
                </div>
              ) : (
                <Select
                  value={selectedFederationId}
                  onValueChange={setSelectedFederationId}
                >
                  <SelectTrigger id='federation-select'>
                    <SelectValue placeholder='Select a federation' />
                  </SelectTrigger>
                  <SelectContent>
                    {federations.map((federation) => (
                      <SelectItem key={federation.id} value={federation.id}>
                        {federation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Player Selection */}
        {selectedFederationId && (
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>
                  Select Players ({selectedCount} selected, {eligibleCount}{' '}
                  eligible)
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <Switch
                    checked={showIneligible}
                    onCheckedChange={setShowIneligible}
                    id='show-ineligible'
                  />
                  <Label htmlFor='show-ineligible' className='cursor-pointer'>
                    Show ineligible players
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPlayers ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                </div>
              ) : filteredPlayers.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>
                  {showIneligible
                    ? 'No players in your organization'
                    : 'No eligible players found. Toggle "Show ineligible players" to see all players.'}
                </p>
              ) : (
                <BulkApplyPlayerTable
                  players={filteredPlayers}
                  selectedPlayerIds={selectedPlayerIds}
                  onSelectionChange={setSelectedPlayerIds}
                  showIneligible={showIneligible}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Actions */}
        {selectedFederationId && filteredPlayers.length > 0 && (
          <div className='flex justify-end gap-3'>
            <Button
              variant='outline'
              onClick={() => router.push('/players')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedCount === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Submitting...
                </>
              ) : (
                `Submit ${selectedCount} Request${selectedCount !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BulkFederationApplyPage
