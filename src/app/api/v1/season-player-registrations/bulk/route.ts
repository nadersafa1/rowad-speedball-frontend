import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  seasonPlayerRegistrations,
  players,
  seasons,
  seasonAgeGroups,
} from '@/db/schema'
import { eq, and, or, sql, inArray } from 'drizzle-orm'
import {
  bulkCreateSeasonPlayerRegistrationsSchema,
  type BulkCreateSeasonPlayerRegistrationsInput,
} from '@/types/api/seasons.schemas'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { calculateAge } from '@/db/schema'
import { checkSeasonRegistrationCreateAuthorization } from '@/lib/authorization/helpers/season-registration-authorization'

interface PlayerWithEligibility {
  id: string
  name: string
  dateOfBirth: string
  currentAge: number
  ageGroups: Array<{
    ageGroupId: string
    ageGroupCode: string
    ageGroupName: string
    minAge: number | null
    maxAge: number | null
    isEligible: boolean
    warningType: 'too_young' | 'too_old' | 'outside_range' | null
    alreadyRegistered: boolean
  }>
}

// POST /api/v1/season-player-registrations/bulk - Bulk create registrations
export async function POST(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Check authorization
    const authError = await checkSeasonRegistrationCreateAuthorization(context)
    if (authError) return authError

    const body = (await request.json()) as BulkCreateSeasonPlayerRegistrationsInput

    const validatedData = bulkCreateSeasonPlayerRegistrationsSchema.parse(body)

    // Verify organization access
    if (
      context.organization?.id &&
      validatedData.organizationId !== context.organization.id &&
      !context.isSystemAdmin
    ) {
      return NextResponse.json(
        { error: 'Cannot create registration for different organization' },
        { status: 403 }
      )
    }

    // Verify season exists and is active
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, validatedData.seasonId),
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.status !== 'active') {
      return NextResponse.json(
        { error: 'Season is not active for registration' },
        { status: 400 }
      )
    }

    // Fetch all age groups
    const ageGroups = await db.query.seasonAgeGroups.findMany({
      where: inArray(seasonAgeGroups.id, validatedData.seasonAgeGroupIds),
    })

    if (ageGroups.length !== validatedData.seasonAgeGroupIds.length) {
      return NextResponse.json(
        { error: 'One or more age groups not found' },
        { status: 404 }
      )
    }

    // Fetch all players with their current registrations
    const playersData = await db.query.players.findMany({
      where: inArray(players.id, validatedData.playerIds),
    })

    if (playersData.length !== validatedData.playerIds.length) {
      return NextResponse.json(
        { error: 'One or more players not found' },
        { status: 404 }
      )
    }

    // Get existing registrations for these players in this season
    const existingRegistrations =
      await db.query.seasonPlayerRegistrations.findMany({
        where: and(
          eq(seasonPlayerRegistrations.seasonId, validatedData.seasonId),
          inArray(seasonPlayerRegistrations.playerId, validatedData.playerIds)
        ),
      })

    // Build a map of player -> age groups they're already registered for
    const existingRegMap = new Map<string, Set<string>>()
    existingRegistrations.forEach((reg) => {
      if (!existingRegMap.has(reg.playerId)) {
        existingRegMap.set(reg.playerId, new Set())
      }
      existingRegMap.get(reg.playerId)!.add(reg.seasonAgeGroupId)
    })

    // Prepare registrations to create
    const registrationsToCreate = []
    const errors = []

    for (const player of playersData) {
      if (!player.dateOfBirth) {
        errors.push({
          playerId: player.id,
          playerName: player.name,
          error: 'Player has no date of birth',
        })
        continue
      }

      const currentAge = calculateAge(player.dateOfBirth)
      const playerExistingRegs = existingRegMap.get(player.id) || new Set()

      // Check max age groups limit
      const totalRegsForPlayer = playerExistingRegs.size + validatedData.seasonAgeGroupIds.length

      if (totalRegsForPlayer > season.maxAgeGroupsPerPlayer) {
        errors.push({
          playerId: player.id,
          playerName: player.name,
          error: `Would exceed max age groups limit (${season.maxAgeGroupsPerPlayer})`,
        })
        continue
      }

      for (const ageGroup of ageGroups) {
        // Skip if already registered
        if (playerExistingRegs.has(ageGroup.id)) {
          continue
        }

        // Determine age warning and blocking
        let ageWarningShown = false
        let ageWarningType: 'too_young' | 'too_old' | null = null

        // HARD BLOCK: Too old (age > maxAge)
        if (ageGroup.maxAge !== null && currentAge > ageGroup.maxAge) {
          // Skip this registration - player is blocked
          errors.push({
            playerId: player.id,
            playerName: player.name,
            ageGroupId: ageGroup.id,
            ageGroupName: ageGroup.name,
            error: `Player age (${currentAge}) exceeds maximum age (${ageGroup.maxAge})`,
          })
          continue // Skip to next age group
        }

        // SOFT WARNING: Too young (age < minAge)
        if (ageGroup.minAge !== null && currentAge < ageGroup.minAge) {
          ageWarningShown = true
          ageWarningType = 'too_young'
        }

        registrationsToCreate.push({
          seasonId: validatedData.seasonId,
          playerId: player.id,
          seasonAgeGroupId: ageGroup.id,
          organizationId: validatedData.organizationId,
          playerAgeAtRegistration: currentAge,
          ageWarningShown,
          ageWarningType,
          status: 'pending' as const,
        })
      }
    }

    // Create all registrations in a transaction
    let createdRegistrations: any[] = []

    if (registrationsToCreate.length > 0) {
      createdRegistrations = await db
        .insert(seasonPlayerRegistrations)
        .values(registrationsToCreate)
        .returning()
    }

    return NextResponse.json(
      {
        success: true,
        count: createdRegistrations.length,
        registrations: createdRegistrations,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating bulk registrations:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create bulk registrations' },
      { status: 500 }
    )
  }
}
