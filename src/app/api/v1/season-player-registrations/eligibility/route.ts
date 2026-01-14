import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  players,
  seasons,
  seasonAgeGroups,
  seasonPlayerRegistrations,
  federationMembers,
} from '@/db/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { getOrganizationContext } from '@/lib/organization-helpers'

// Request schema
const eligibilityRequestSchema = z.object({
  playerIds: z.array(z.uuid()),
  seasonId: z.uuid(),
})

// Calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--
  }
  return age
}

// Determine age warning type with blocking status
function getAgeWarningType(
  playerAge: number,
  minAge: number | null,
  maxAge: number | null
): {
  warningType: 'too_young' | 'too_old' | null
  warningLevel: 'soft' | 'hard' | null
  isBlocked: boolean
} {
  if (minAge === null && maxAge === null) {
    return { warningType: null, warningLevel: null, isBlocked: false }
  }

  // Hard block for too old
  if (maxAge !== null && playerAge > maxAge) {
    return { warningType: 'too_old', warningLevel: 'hard', isBlocked: true }
  }

  // Soft warning for too young
  if (minAge !== null && playerAge < minAge) {
    return { warningType: 'too_young', warningLevel: 'soft', isBlocked: false }
  }

  return { warningType: null, warningLevel: null, isBlocked: false }
}

// POST /api/v1/season-player-registrations/eligibility - Check player eligibility
export async function POST(request: NextRequest) {
  try {
    const context = await getOrganizationContext()

    // Authenticated users can check eligibility
    if (!context.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { playerIds, seasonId } = eligibilityRequestSchema.parse(body)

    if (playerIds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Fetch season details
    const season = await db.query.seasons.findFirst({
      where: eq(seasons.id, seasonId),
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Fetch players
    const playerList = await db.query.players.findMany({
      where: inArray(players.id, playerIds),
    })

    // Fetch age groups for this season
    const ageGroupList = await db.query.seasonAgeGroups.findMany({
      where: eq(seasonAgeGroups.seasonId, seasonId),
    })

    // Check federation membership for each player
    const federationMembershipMap: Record<
      string,
      { isMember: boolean; federationIdNumber: string | null }
    > = {}

    for (const player of playerList) {
      const membership = await db.query.federationMembers.findFirst({
        where: and(
          eq(federationMembers.playerId, player.id),
          eq(federationMembers.federationId, season.federationId),
          eq(federationMembers.status, 'active')
        ),
      })

      federationMembershipMap[player.id] = {
        isMember: !!membership,
        federationIdNumber: membership?.federationIdNumber || null,
      }
    }

    // Count existing registrations for each player in this season
    const registrationCounts: Record<string, number> = {}

    for (const player of playerList) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(seasonPlayerRegistrations)
        .where(
          and(
            eq(seasonPlayerRegistrations.playerId, player.id),
            eq(seasonPlayerRegistrations.seasonId, seasonId),
            inArray(seasonPlayerRegistrations.status, ['pending', 'approved'])
          )
        )

      registrationCounts[player.id] = Number(countResult[0]?.count ?? 0)
    }

    // Build eligibility data for each player
    const eligibilityData = playerList.map((player) => {
      const playerAge = calculateAge(new Date(player.dateOfBirth))
      const membership = federationMembershipMap[player.id]
      const currentRegistrationCount = registrationCounts[player.id]
      const maxRegistrationsAllowed = season.maxAgeGroupsPerPlayer

      // Check eligibility for each age group
      const ageGroupEligibility: Record<
        string,
        {
          isEligible: boolean
          isBlocked: boolean
          ageWarningType: 'too_young' | 'too_old' | null
          warningLevel: 'soft' | 'hard' | null
        }
      > = {}

      for (const ageGroup of ageGroupList) {
        const warningResult = getAgeWarningType(
          playerAge,
          ageGroup.minAge,
          ageGroup.maxAge
        )

        ageGroupEligibility[ageGroup.id] = {
          isEligible: !warningResult.isBlocked, // False if blocked
          isBlocked: warningResult.isBlocked,
          ageWarningType: warningResult.warningType,
          warningLevel: warningResult.warningLevel,
        }
      }

      return {
        playerId: player.id,
        playerName: player.name,
        playerAge,
        isFederationMember: membership.isMember,
        federationIdNumber: membership.federationIdNumber,
        ageGroupEligibility,
        currentRegistrationCount,
        maxRegistrationsAllowed,
      }
    })

    return NextResponse.json({ data: eligibilityData })
  } catch (error) {
    console.error('Error checking eligibility:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    )
  }
}
