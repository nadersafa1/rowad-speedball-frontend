'use client'

import { useEffect, useState } from 'react'
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { apiClient } from '@/lib/api-client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Calendar, Users } from 'lucide-react'
import type { Control } from 'react-hook-form'
import type { SeasonAgeGroup } from '@/db/schema'

interface SeasonRegistrationSelectorProps {
  control: Control<any>
  resetField?: (name: string) => void
  onFederationChange?: (federationId: string | null) => void
  onSeasonChange?: (seasonId: string | null) => void
  onAgeGroupsChange?: (ageGroupIds: string[]) => void
}

export default function SeasonRegistrationSelector({
  control,
  resetField,
  onFederationChange,
  onSeasonChange,
  onAgeGroupsChange,
}: SeasonRegistrationSelectorProps) {
  const [ageGroups, setAgeGroups] = useState<SeasonAgeGroup[]>([])
  const [isLoadingAgeGroups, setIsLoadingAgeGroups] = useState(false)
  const [selectedFederationId, setSelectedFederationId] = useState<string | null>(null)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  // Load age groups when season changes
  useEffect(() => {
    const loadAgeGroups = async () => {
      if (!selectedSeasonId) {
        setAgeGroups([])
        return
      }

      setIsLoadingAgeGroups(true)
      try {
        const response = await apiClient.getSeasonAgeGroups({
          seasonId: selectedSeasonId,
          sortBy: 'displayOrder',
          sortOrder: 'asc',
        })
        setAgeGroups(response.data || [])
      } catch (error) {
        console.error('Failed to load age groups:', error)
        setAgeGroups([])
      } finally {
        setIsLoadingAgeGroups(false)
      }
    }

    loadAgeGroups()
  }, [selectedSeasonId])

  const formatAgeRange = (ageGroup: SeasonAgeGroup): string => {
    if (ageGroup.minAge !== null && ageGroup.maxAge !== null) {
      return `Ages ${ageGroup.minAge}-${ageGroup.maxAge}`
    }
    if (ageGroup.minAge !== null) {
      return `Ages ${ageGroup.minAge}+`
    }
    if (ageGroup.maxAge !== null) {
      return `Up to ${ageGroup.maxAge}`
    }
    return 'All ages'
  }

  return (
    <div className='space-y-6'>
      {/* Federation Selector */}
      <FormField
        control={control}
        name='federationId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Federation *</FormLabel>
            <FormControl>
              <BaseCombobox
                value={field.value}
                onChange={(value: string | string[] | null) => {
                  const singleValue = Array.isArray(value) ? value[0] : value
                  field.onChange(singleValue)
                  setSelectedFederationId(singleValue)
                  // Reset dependent fields
                  if (resetField) {
                    resetField('seasonId')
                    resetField('ageGroupIds')
                  }
                  setSelectedSeasonId(null)
                  setAgeGroups([])
                  onFederationChange?.(singleValue)
                }}
                fetchItems={async (query, page, limit) => {
                  try {
                    const response = await apiClient.getFederations({
                      q: query,
                      page: page || 1,
                      limit: limit || 20,
                      sortBy: 'name',
                      sortOrder: 'asc',
                    })
                    return {
                      items: response.data || [],
                      hasMore: (response as any).hasMore || false,
                    }
                  } catch (error) {
                    console.error('Failed to fetch federations:', error)
                    return { items: [], hasMore: false }
                  }
                }}
                formatLabel={(federation: any) => federation.name}
                placeholder='Select a federation...'
                searchPlaceholder='Search federations...'
                emptyMessage='No federations found'
                disabled={false}
              />
            </FormControl>
            <FormDescription>
              Select the federation you want to register players for
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Season Selector (depends on federation) */}
      <FormField
        control={control}
        name='seasonId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Season *</FormLabel>
            <FormControl>
              <BaseCombobox
                value={field.value}
                onChange={(value: string | string[] | null) => {
                  const singleValue = Array.isArray(value) ? value[0] : value
                  field.onChange(singleValue)
                  setSelectedSeasonId(singleValue)
                  // Reset dependent fields
                  if (resetField) {
                    resetField('ageGroupIds')
                  }
                  onSeasonChange?.(singleValue)
                }}
                fetchItems={async (query, page, limit) => {
                  if (!selectedFederationId) {
                    return { items: [], hasMore: false }
                  }
                  const response = await apiClient.getSeasons({
                    federationId: selectedFederationId,
                    status: 'active',
                    page: page || 1,
                    limit: limit || 20,
                  })
                  return {
                    items: response.data || [],
                    hasMore: (response as any).hasMore || false,
                  }
                }}
                formatLabel={(season: any) => (
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    <span>{season.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      ({season.startYear}-{season.endYear})
                    </span>
                  </div>
                )}
                formatSelectedLabel={(season: any) => season.name}
                placeholder='Select a season...'
                searchPlaceholder='Search seasons...'
                emptyMessage='No active seasons found for this federation'
                disabled={!selectedFederationId}
              />
            </FormControl>
            <FormDescription>
              Select an active season for player registration
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Age Groups Selector (multi-select checkboxes) */}
      {selectedSeasonId && (
        <FormField
          control={control}
          name='ageGroupIds'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age Groups *</FormLabel>
              {isLoadingAgeGroups ? (
                <div className='rounded-md border p-4 text-center text-sm text-muted-foreground'>
                  Loading age groups...
                </div>
              ) : ageGroups.length === 0 ? (
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    No age groups defined for this season. Please contact the
                    federation administrator.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className='rounded-md border p-4 space-y-3'>
                    {ageGroups.map((ageGroup) => (
                      <FormField
                        key={ageGroup.id}
                        control={control}
                        name='ageGroupIds'
                        render={({ field: checkboxField }) => (
                          <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                            <FormControl>
                              <Checkbox
                                checked={checkboxField.value?.includes(ageGroup.id)}
                                onCheckedChange={(checked) => {
                                  const current = checkboxField.value || []
                                  const updated = checked
                                    ? [...current, ageGroup.id]
                                    : current.filter((id: string) => id !== ageGroup.id)
                                  checkboxField.onChange(updated)
                                  onAgeGroupsChange?.(updated)
                                }}
                              />
                            </FormControl>
                            <div className='flex-1'>
                              <FormLabel className='font-normal cursor-pointer'>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-2'>
                                    <span className='font-semibold font-mono text-sm'>
                                      {ageGroup.code}
                                    </span>
                                    <span>-</span>
                                    <span>{ageGroup.name}</span>
                                  </div>
                                  <span className='text-xs text-muted-foreground'>
                                    {formatAgeRange(ageGroup)}
                                  </span>
                                </div>
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Select one or more age groups for player registration. Players
                    outside the age range will receive warnings but can still be
                    registered.
                  </FormDescription>
                </>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {!selectedFederationId && (
        <Alert>
          <Users className='h-4 w-4' />
          <AlertDescription>
            Please select a federation to continue with season registration
          </AlertDescription>
        </Alert>
      )}

      {selectedFederationId && !selectedSeasonId && (
        <Alert>
          <Calendar className='h-4 w-4' />
          <AlertDescription>
            Please select a season to view available age groups
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
