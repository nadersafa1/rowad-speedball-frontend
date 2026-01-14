'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  AlertCircle,
  CheckCircle2,
  Info,
  User,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { Player, SeasonAgeGroup } from '@/db/schema'
import { calculateAge } from '@/db/schema'

interface PlayerEligibility {
  playerId: string
  playerName: string
  playerAge: number
  isFederationMember: boolean
  federationIdNumber: string | null
  ageGroupEligibility: Record<
    string,
    {
      isEligible: boolean
      isBlocked: boolean
      ageWarningType: 'too_young' | 'too_old' | null
      warningLevel: 'soft' | 'hard' | null
    }
  >
  currentRegistrationCount: number
  maxRegistrationsAllowed: number
}

interface SeasonRegistrationPlayerTableProps {
  organizationId: string
  seasonId: string | null
  selectedAgeGroupIds: string[]
  ageGroups: SeasonAgeGroup[]
  maxAgeGroupsPerPlayer: number
  onSelectionChange: (selectedPlayers: {
    playerId: string
    ageGroupIds: string[]
    isFederationMember: boolean
  }[]) => void
}

export default function SeasonRegistrationPlayerTable({
  organizationId,
  seasonId,
  selectedAgeGroupIds,
  ageGroups,
  maxAgeGroupsPerPlayer,
  onSelectionChange,
}: SeasonRegistrationPlayerTableProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [eligibilityData, setEligibilityData] = useState<
    Record<string, PlayerEligibility>
  >({})
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlayerAgeGroups, setSelectedPlayerAgeGroups] = useState<
    Record<string, string[]>
  >({})

  // Fetch players and eligibility
  useEffect(() => {
    const fetchPlayersAndEligibility = async () => {
      if (!organizationId || !seasonId || selectedAgeGroupIds.length === 0) {
        setPlayers([])
        setEligibilityData({})
        return
      }

      setIsLoading(true)
      try {
        // Fetch organization players
        const playersResponse = await apiClient.getPlayers({
          organizationId,
          limit: 100,
        })
        const orgPlayers = playersResponse.data || []
        setPlayers(orgPlayers)

        // Fetch eligibility data
        if (orgPlayers.length > 0) {
          const playerIds = orgPlayers.map((p) => p.id)
          const eligibilityResponse: any = await apiClient.post(
            '/season-player-registrations/eligibility',
            {
              playerIds,
              seasonId,
            }
          )

          const eligibilityMap: Record<string, PlayerEligibility> = {}
          if (eligibilityResponse?.data) {
            eligibilityResponse.data.forEach((item: any) => {
              eligibilityMap[item.playerId] = item
            })
          }
          setEligibilityData(eligibilityMap)
        }
      } catch (error) {
        console.error('Failed to fetch players or eligibility:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayersAndEligibility()
  }, [organizationId, seasonId, selectedAgeGroupIds])

  // Filter players by search
  const filteredPlayers = players.filter((player) => {
    const query = searchQuery.toLowerCase()
    return player.name.toLowerCase().includes(query)
  })

  const handlePlayerSelection = (playerId: string, checked: boolean) => {
    setSelectedPlayerAgeGroups((prev) => {
      const updated = { ...prev }
      if (checked) {
        // Select all selected age groups for this player
        updated[playerId] = selectedAgeGroupIds
      } else {
        delete updated[playerId]
      }

      // Notify parent
      const selections = Object.entries(updated).map(([pid, ageGroupIds]) => ({
        playerId: pid,
        ageGroupIds,
        isFederationMember: eligibilityData[pid]?.isFederationMember || false,
      }))
      onSelectionChange(selections)

      return updated
    })
  }

  const handleAgeGroupToggle = (
    playerId: string,
    ageGroupId: string,
    checked: boolean
  ) => {
    setSelectedPlayerAgeGroups((prev) => {
      const updated = { ...prev }
      const current = updated[playerId] || []

      if (checked) {
        updated[playerId] = [...current, ageGroupId]
      } else {
        updated[playerId] = current.filter((id) => id !== ageGroupId)
        // Remove player entirely if no age groups selected
        if (updated[playerId].length === 0) {
          delete updated[playerId]
        }
      }

      // Notify parent
      const selections = Object.entries(updated).map(([pid, ageGroupIds]) => ({
        playerId: pid,
        ageGroupIds,
        isFederationMember: eligibilityData[pid]?.isFederationMember || false,
      }))
      onSelectionChange(selections)

      return updated
    })
  }

  const getAgeWarningBadge = (
    warningType: 'too_young' | 'too_old' | null,
    warningLevel: 'soft' | 'hard' | null
  ) => {
    if (!warningType) return null

    const variants = {
      too_young: {
        text: 'Too Young',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-300',
      },
      too_old: {
        text: 'Too Old (Blocked)',
        className: 'bg-red-50 text-red-700 border-red-500',
      },
    }

    const variant = variants[warningType]
    return (
      <Badge variant='outline' className={`text-xs ${variant.className}`}>
        <AlertCircle className='h-3 w-3 mr-1' />
        {variant.text}
      </Badge>
    )
  }

  const isPlayerFullyRegistered = (playerId: string): boolean => {
    const eligibility = eligibilityData[playerId]
    if (!eligibility) return false
    return (
      eligibility.currentRegistrationCount >= eligibility.maxRegistrationsAllowed
    )
  }

  const canSelectAgeGroup = (playerId: string, ageGroupId: string): boolean => {
    const selectedForPlayer = selectedPlayerAgeGroups[playerId] || []
    const eligibility = eligibilityData[playerId]
    if (!eligibility) return true

    // Check if adding this would exceed the max
    const currentCount = eligibility.currentRegistrationCount
    const pendingCount = selectedForPlayer.length
    return currentCount + pendingCount < eligibility.maxRegistrationsAllowed
  }

  if (!seasonId || selectedAgeGroupIds.length === 0) {
    return (
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>
          Please select a season and at least one age group to view eligible players
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className='rounded-md border p-8 text-center text-muted-foreground'>
        Loading players and checking eligibility...
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <Alert>
        <User className='h-4 w-4' />
        <AlertDescription>
          No players found in your organization. Please add players first.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder='Search players...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription className='text-sm'>
          <strong>Age Restrictions:</strong> Players exceeding the maximum age are blocked
          from registration. Players below minimum age show warnings but can register
          (subject to federation admin approval). Players can register for up to{' '}
          {maxAgeGroupsPerPlayer} age group(s).
        </AlertDescription>
      </Alert>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[50px]'>Select</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className='w-[80px]'>Age</TableHead>
              <TableHead className='hidden md:table-cell'>Federation Member</TableHead>
              <TableHead>Age Groups</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  No players found matching your search
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => {
                const eligibility = eligibilityData[player.id]
                const isFullyRegistered = isPlayerFullyRegistered(player.id)
                const playerAge = calculateAge(player.dateOfBirth)
                const isPlayerSelected = !!selectedPlayerAgeGroups[player.id]

                return (
                  <TableRow key={player.id}>
                    {/* Select Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={isPlayerSelected}
                        onCheckedChange={(checked) =>
                          handlePlayerSelection(player.id, !!checked)
                        }
                        disabled={isFullyRegistered}
                      />
                    </TableCell>

                    {/* Player Name */}
                    <TableCell className='font-medium'>{player.name}</TableCell>

                    {/* Age */}
                    <TableCell>
                      <Badge variant='outline'>{playerAge}</Badge>
                    </TableCell>

                    {/* Federation Member Status */}
                    <TableCell className='hidden md:table-cell'>
                      {eligibility?.isFederationMember ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant='default' className='gap-1'>
                                <CheckCircle2 className='h-3 w-3' />
                                Member
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Federation ID: {eligibility.federationIdNumber}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant='secondary'>Not a Member</Badge>
                      )}
                    </TableCell>

                    {/* Age Groups with Eligibility */}
                    <TableCell>
                      <div className='flex flex-wrap gap-2'>
                        {selectedAgeGroupIds.map((ageGroupId) => {
                          const ageGroup = ageGroups.find((ag) => ag.id === ageGroupId)
                          if (!ageGroup) return null

                          const ageGroupElig =
                            eligibility?.ageGroupEligibility[ageGroupId]
                          const isSelected =
                            selectedPlayerAgeGroups[player.id]?.includes(ageGroupId)
                          const canSelect = canSelectAgeGroup(player.id, ageGroupId)
                          const isBlocked = ageGroupElig?.isBlocked || false

                          return (
                            <TooltipProvider key={ageGroupId}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className='flex items-center gap-1'>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) =>
                                        handleAgeGroupToggle(
                                          player.id,
                                          ageGroupId,
                                          !!checked
                                        )
                                      }
                                      disabled={isBlocked || (!canSelect && !isSelected)}
                                    />
                                    <span
                                      className={`text-xs font-mono ${
                                        isBlocked
                                          ? 'line-through text-muted-foreground'
                                          : ''
                                      }`}
                                    >
                                      {ageGroup.code}
                                    </span>
                                    {ageGroupElig?.ageWarningType &&
                                      getAgeWarningBadge(
                                        ageGroupElig.ageWarningType,
                                        ageGroupElig.warningLevel
                                      )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className='space-y-1'>
                                    <p className='font-semibold'>{ageGroup.name}</p>
                                    <p className='text-xs'>
                                      Age Range:{' '}
                                      {ageGroup.minAge !== null && ageGroup.maxAge !== null
                                        ? `${ageGroup.minAge}-${ageGroup.maxAge}`
                                        : 'No restrictions'}
                                    </p>
                                    <p className='text-xs'>Player Age: {playerAge}</p>
                                    {isBlocked && (
                                      <p className='text-xs text-red-600 font-semibold'>
                                        Registration blocked: Player exceeds maximum age
                                      </p>
                                    )}
                                    {ageGroupElig?.ageWarningType === 'too_young' && (
                                      <p className='text-xs text-yellow-600'>
                                        Warning: Player is below minimum age (approval may be
                                        required)
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                      </div>
                      {isFullyRegistered && (
                        <p className='text-xs text-destructive mt-1'>
                          Max registrations reached ({eligibility?.currentRegistrationCount}/
                          {eligibility?.maxRegistrationsAllowed})
                        </p>
                      )}
                    </TableCell>

                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <span>
          {Object.keys(selectedPlayerAgeGroups).length} player(s) selected
        </span>
        <span>{filteredPlayers.length} total players</span>
      </div>
    </div>
  )
}
