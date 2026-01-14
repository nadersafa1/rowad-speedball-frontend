// Season-related business logic helpers
import { db } from '@/lib/db'
import {
  seasons,
  seasonAgeGroups,
  seasonPlayerRegistrations,
  federationMembers,
  players,
  type Season,
  type SeasonAgeGroup,
  calculateAge,
} from '@/db/schema'
import { eq, and, or, sql } from 'drizzle-orm'

/**
 * Check if a season is currently in a registration period
 */
export function isSeasonInRegistrationPeriod(season: Season): boolean {
  const now = new Date()

  // Check first registration period
  if (season.firstRegistrationStartDate && season.firstRegistrationEndDate) {
    const firstStart = new Date(season.firstRegistrationStartDate)
    const firstEnd = new Date(season.firstRegistrationEndDate)

    if (now >= firstStart && now <= firstEnd) {
      return true
    }
  }

  // Check second registration period
  if (season.secondRegistrationStartDate && season.secondRegistrationEndDate) {
    const secondStart = new Date(season.secondRegistrationStartDate)
    const secondEnd = new Date(season.secondRegistrationEndDate)

    if (now >= secondStart && now <= secondEnd) {
      return true
    }
  }

  return false
}

/**
 * Get the current active registration period number (1 or 2), or null if none
 */
export function getCurrentRegistrationPeriod(season: Season): 1 | 2 | null {
  const now = new Date()

  // Check first registration period
  if (season.firstRegistrationStartDate && season.firstRegistrationEndDate) {
    const firstStart = new Date(season.firstRegistrationStartDate)
    const firstEnd = new Date(season.firstRegistrationEndDate)

    if (now >= firstStart && now <= firstEnd) {
      return 1
    }
  }

  // Check second registration period
  if (season.secondRegistrationStartDate && season.secondRegistrationEndDate) {
    const secondStart = new Date(season.secondRegistrationStartDate)
    const secondEnd = new Date(season.secondRegistrationEndDate)

    if (now >= secondStart && now <= secondEnd) {
      return 2
    }
  }

  return null
}

/**
 * Check if a player's age fits within an age group's restrictions
 */
export interface AgeEligibilityResult {
  isEligible: boolean // false if age > maxAge (blocked)
  isBlocked: boolean // true if hard block applied (age > maxAge)
  warningType: 'too_young' | 'too_old' | null
  warningLevel: 'soft' | 'hard' | null // 'soft' for too_young, 'hard' for too_old
  message: string | null
}

export function checkAgeEligibility(
  playerAge: number,
  ageGroup: SeasonAgeGroup
): AgeEligibilityResult {
  // If no age restrictions, player can register without warning
  if (ageGroup.minAge === null && ageGroup.maxAge === null) {
    return {
      isEligible: true,
      isBlocked: false,
      warningType: null,
      warningLevel: null,
      message: null,
    }
  }

  // HARD BLOCK: Too old (age > maxAge)
  if (ageGroup.maxAge !== null && playerAge > ageGroup.maxAge) {
    return {
      isEligible: false, // BLOCKED - cannot register
      isBlocked: true,
      warningType: 'too_old',
      warningLevel: 'hard',
      message: `Player cannot register: age ${playerAge} exceeds maximum age of ${ageGroup.maxAge} for ${ageGroup.name}`,
    }
  }

  // SOFT WARNING: Too young (age < minAge)
  if (ageGroup.minAge !== null && playerAge < ageGroup.minAge) {
    return {
      isEligible: true, // Allow but warn
      isBlocked: false,
      warningType: 'too_young',
      warningLevel: 'soft',
      message: `Player is ${playerAge} years old, which is below the recommended minimum age of ${ageGroup.minAge} for ${ageGroup.name}`,
    }
  }

  // Within age range
  return {
    isEligible: true,
    isBlocked: false,
    warningType: null,
    warningLevel: null,
    message: null,
  }
}

/**
 * Check if a player is eligible to register for a season
 */
export interface PlayerSeasonEligibilityResult {
  canRegister: boolean
  reason?: string
  currentRegistrationCount?: number
  maxAllowed?: number
}

export async function checkPlayerSeasonEligibility(
  playerId: string,
  seasonId: string
): Promise<PlayerSeasonEligibilityResult> {
  // Fetch season
  const season = await db.query.seasons.findFirst({
    where: eq(seasons.id, seasonId),
  })

  if (!season) {
    return {
      canRegister: false,
      reason: 'Season not found',
    }
  }

  if (season.status !== 'active') {
    return {
      canRegister: false,
      reason: 'Season is not active for registration',
    }
  }

  // Check if season is in a registration period
  if (!isSeasonInRegistrationPeriod(season)) {
    return {
      canRegister: false,
      reason: 'Season is not currently in a registration period',
    }
  }

  // Count current registrations for this player in this season
  const registrationsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(seasonPlayerRegistrations)
    .where(
      and(
        eq(seasonPlayerRegistrations.seasonId, seasonId),
        eq(seasonPlayerRegistrations.playerId, playerId),
        or(
          eq(seasonPlayerRegistrations.status, 'pending'),
          eq(seasonPlayerRegistrations.status, 'approved')
        )
      )
    )

  const currentCount = Number(registrationsCount[0]?.count ?? 0)

  if (currentCount >= season.maxAgeGroupsPerPlayer) {
    return {
      canRegister: false,
      reason: `Player has already registered for the maximum number of age groups (${season.maxAgeGroupsPerPlayer})`,
      currentRegistrationCount: currentCount,
      maxAllowed: season.maxAgeGroupsPerPlayer,
    }
  }

  return {
    canRegister: true,
    currentRegistrationCount: currentCount,
    maxAllowed: season.maxAgeGroupsPerPlayer,
  }
}

/**
 * Check if a player is already registered for a specific age group in a season
 */
export async function checkExistingRegistration(
  playerId: string,
  seasonId: string,
  ageGroupId: string
): Promise<boolean> {
  const existing = await db.query.seasonPlayerRegistrations.findFirst({
    where: and(
      eq(seasonPlayerRegistrations.playerId, playerId),
      eq(seasonPlayerRegistrations.seasonId, seasonId),
      eq(seasonPlayerRegistrations.seasonAgeGroupId, ageGroupId)
    ),
  })

  return existing !== undefined
}

/**
 * Check if a player is a federation member
 */
export async function checkFederationMembership(
  playerId: string,
  federationId: string
): Promise<{
  isMember: boolean
  membershipDetails?: {
    id: string
    federationIdNumber: string
    status: string
  }
}> {
  const member = await db.query.federationMembers.findFirst({
    where: and(
      eq(federationMembers.playerId, playerId),
      eq(federationMembers.federationId, federationId)
    ),
  })

  if (!member) {
    return { isMember: false }
  }

  return {
    isMember: true,
    membershipDetails: {
      id: member.id,
      federationIdNumber: member.federationIdNumber,
      status: member.status,
    },
  }
}

/**
 * Get eligible players for a season with age group details
 */
export interface PlayerEligibilityInfo {
  id: string
  name: string
  dateOfBirth: string | null
  currentAge: number | null
  ageGroups: Array<{
    id: string
    code: string
    name: string
    minAge: number | null
    maxAge: number | null
    eligibility: AgeEligibilityResult
    alreadyRegistered: boolean
  }>
}

export async function getPlayersEligibilityForSeason(
  playerIds: string[],
  seasonId: string
): Promise<PlayerEligibilityInfo[]> {
  // Fetch players
  const playersData = await db.query.players.findMany({
    where: sql`${players.id} = ANY(${playerIds})`,
  })

  // Fetch season age groups
  const ageGroups = await db.query.seasonAgeGroups.findMany({
    where: eq(seasonAgeGroups.seasonId, seasonId),
    orderBy: (seasonAgeGroups, { asc }) => [asc(seasonAgeGroups.displayOrder)],
  })

  // Fetch existing registrations
  const existingRegs = await db.query.seasonPlayerRegistrations.findMany({
    where: and(
      eq(seasonPlayerRegistrations.seasonId, seasonId),
      sql`${seasonPlayerRegistrations.playerId} = ANY(${playerIds})`
    ),
  })

  // Build map of player -> age groups they're registered for
  const regMap = new Map<string, Set<string>>()
  existingRegs.forEach((reg) => {
    if (!regMap.has(reg.playerId)) {
      regMap.set(reg.playerId, new Set())
    }
    regMap.get(reg.playerId)!.add(reg.seasonAgeGroupId)
  })

  // Build eligibility info for each player
  const eligibilityInfo: PlayerEligibilityInfo[] = playersData.map((player) => {
    const playerRegs = regMap.get(player.id) || new Set()
    let currentAge: number | null = null

    if (player.dateOfBirth) {
      currentAge = calculateAge(player.dateOfBirth)
    }

    const ageGroupsInfo = ageGroups.map((ageGroup) => {
      let eligibility: AgeEligibilityResult = {
        isEligible: true,
        isBlocked: false,
        warningLevel: null,
        warningType: null,
        message: null,
      }

      if (currentAge !== null) {
        eligibility = checkAgeEligibility(currentAge, ageGroup)
      }

      return {
        id: ageGroup.id,
        code: ageGroup.code,
        name: ageGroup.name,
        minAge: ageGroup.minAge,
        maxAge: ageGroup.maxAge,
        eligibility,
        alreadyRegistered: playerRegs.has(ageGroup.id),
      }
    })

    return {
      id: player.id,
      name: player.name,
      dateOfBirth: player.dateOfBirth,
      currentAge,
      ageGroups: ageGroupsInfo,
    }
  })

  return eligibilityInfo
}

/**
 * Format season name from start and end years
 */
export function formatSeasonName(startYear: number, endYear: number): string {
  return `${startYear}-${endYear} Season`
}

/**
 * Parse season name to get start and end years
 */
export function parseSeasonName(
  seasonName: string
): { startYear: number; endYear: number } | null {
  const match = seasonName.match(/(\d{4})-(\d{4})/)
  if (!match) return null

  return {
    startYear: parseInt(match[1]),
    endYear: parseInt(match[2]),
  }
}
