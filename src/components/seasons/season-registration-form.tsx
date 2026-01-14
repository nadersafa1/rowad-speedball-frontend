'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { LoadingButton, FormError } from '@/components/forms'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import SeasonRegistrationSelector from './season-registration-selector'
import SeasonRegistrationPlayerTable from './season-registration-player-table'
import { useSeasonPlayerRegistrationsStore } from '@/store/season-player-registrations-store'
import { useOrganization } from '@/hooks/authorization/use-organization'
import { toast } from 'sonner'
import type { SeasonAgeGroup } from '@/db/schema'
import { CheckCircle2, AlertCircle } from 'lucide-react'

// Form validation schema
const registrationFormSchema = z.object({
  federationId: z.uuid('Please select a federation'),
  seasonId: z.uuid('Please select a season'),
  ageGroupIds: z.array(z.uuid()).min(1, 'Please select at least one age group'),
})

type RegistrationFormData = z.infer<typeof registrationFormSchema>

interface SeasonRegistrationFormProps {
  onSuccess?: () => void
}

export default function SeasonRegistrationForm({
  onSuccess,
}: SeasonRegistrationFormProps) {
  const { organizationId } = useOrganization()
  const { bulkCreateRegistrations, error, clearError } =
    useSeasonPlayerRegistrationsStore()
  const [selectedPlayers, setSelectedPlayers] = useState<
    { playerId: string; ageGroupIds: string[]; isFederationMember: boolean }[]
  >([])
  const [ageGroups, setAgeGroups] = useState<SeasonAgeGroup[]>([])
  const [seasonName, setSeasonName] = useState<string>('')
  const [maxAgeGroupsPerPlayer, setMaxAgeGroupsPerPlayer] = useState<number>(1)
  const [showReview, setShowReview] = useState(false)

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      federationId: '',
      seasonId: '',
      ageGroupIds: [],
    },
  })

  const { isSubmitting } = form.formState
  const watchedSeasonId = form.watch('seasonId')
  const watchedAgeGroupIds = form.watch('ageGroupIds')

  const handleSeasonChange = async (seasonId: string | null) => {
    if (seasonId) {
      try {
        // Fetch season details to get max age groups and name
        const response = await fetch(`/api/v1/seasons/${seasonId}`)
        const season = await response.json()
        setMaxAgeGroupsPerPlayer(season.maxAgeGroupsPerPlayer || 1)
        setSeasonName(season.name)
      } catch (error) {
        console.error('Failed to fetch season details:', error)
      }
    }
  }

  const handleAgeGroupsChange = async (ageGroupIds: string[]) => {
    if (ageGroupIds.length > 0 && watchedSeasonId) {
      try {
        // Fetch age group details
        const response = await fetch(
          `/api/v1/season-age-groups?seasonId=${watchedSeasonId}&limit=100`
        )
        const data = await response.json()
        setAgeGroups(data.data || [])
      } catch (error) {
        console.error('Failed to fetch age groups:', error)
      }
    }
  }

  const handleProceedToReview = () => {
    // Validate that players are selected
    if (selectedPlayers.length === 0) {
      toast.error('Please select at least one player to register')
      return
    }

    setShowReview(true)
  }

  const onSubmit = async (data: RegistrationFormData) => {
    clearError()

    if (!organizationId) {
      toast.error('Organization context not found')
      return
    }

    try {
      const result = await bulkCreateRegistrations({
        seasonId: data.seasonId,
        organizationId,
        playerIds: selectedPlayers.map((sp) => sp.playerId),
        seasonAgeGroupIds: Array.from(
          new Set(selectedPlayers.flatMap((sp) => sp.ageGroupIds))
        ),
      })

      toast.success(
        `Successfully submitted ${result.count} registration(s) for approval`
      )

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((err: any) => {
          toast.warning(`${err.playerName}: ${err.error}`)
        })
      }

      // Reset form
      form.reset()
      setSelectedPlayers([])
      setShowReview(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit registrations')
    }
  }

  const getTotalRegistrations = () => {
    return selectedPlayers.reduce((sum, sp) => sum + sp.ageGroupIds.length, 0)
  }

  if (showReview) {
    // Review and confirm step
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle2 className='h-5 w-5 text-green-600' />
            Review Registration
          </CardTitle>
          <CardDescription>
            Please review the registration details before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <div>
              <p className='text-sm font-semibold text-muted-foreground'>
                Season
              </p>
              <p className='text-lg'>{seasonName}</p>
            </div>

            <Separator />

            <div>
              <p className='text-sm font-semibold text-muted-foreground mb-2'>
                Age Groups Selected
              </p>
              <div className='flex flex-wrap gap-2'>
                {watchedAgeGroupIds.map((agId) => {
                  const ag = ageGroups.find((a) => a.id === agId)
                  return ag ? (
                    <Badge key={ag.id} variant='outline'>
                      {ag.code} - {ag.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>

            <Separator />

            <div>
              <p className='text-sm font-semibold text-muted-foreground mb-2'>
                Summary
              </p>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='text-muted-foreground'>Players Selected</p>
                  <p className='text-lg font-semibold'>
                    {selectedPlayers.length}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Total Registrations</p>
                  <p className='text-lg font-semibold'>
                    {getTotalRegistrations()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              After submission, registrations will be sent to the federation
              admin for review and approval. You will be notified once they are
              processed.
            </AlertDescription>
          </Alert>

          <FormError error={error} />

          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={() => setShowReview(false)}
              disabled={isSubmitting}
              className='flex-1'
            >
              Back to Edit
            </Button>
            <LoadingButton
              onClick={form.handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              className='flex-1'
            >
              Submit Registration
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Registration form step
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleProceedToReview)}
        className='space-y-8'
      >
        {/* Step 1: Season Selection */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5 text-rowad-600' />
              Step 1: Select Season and Age Groups
            </CardTitle>
            <CardDescription>
              Choose the federation, season, and age groups you want to register
              players for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeasonRegistrationSelector
              control={form.control}
              resetField={(name: string) => form.resetField(name as any)}
              onSeasonChange={handleSeasonChange}
              onAgeGroupsChange={handleAgeGroupsChange}
            />
          </CardContent>
        </Card>

        {/* Step 2: Player Selection */}
        {watchedSeasonId && watchedAgeGroupIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5 text-rowad-600' />
                Step 2: Select Players
              </CardTitle>
              <CardDescription>
                Choose which players to register for the selected age groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SeasonRegistrationPlayerTable
                organizationId={organizationId!}
                seasonId={watchedSeasonId}
                selectedAgeGroupIds={watchedAgeGroupIds}
                ageGroups={ageGroups}
                maxAgeGroupsPerPlayer={maxAgeGroupsPerPlayer}
                onSelectionChange={setSelectedPlayers}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {selectedPlayers.length > 0 && (
          <div className='flex justify-end'>
            <Button type='submit' size='lg' className='gap-2'>
              Proceed to Review
              <ArrowRight className='h-4 w-4' />
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
