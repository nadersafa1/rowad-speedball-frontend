// Points Calculation Utilities

import { db } from '@/lib/db'
import { registrations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface SetResult {
  registration1Score: number
  registration2Score: number
}

/**
 * Calculates match points for both registrations
 */
export const calculateMatchPoints = (
  winnerId: string,
  registration1Id: string,
  registration2Id: string,
  pointsPerWin: number,
  pointsPerLoss: number
): {
  registration1Points: number
  registration2Points: number
  registration1Won: boolean
  registration2Won: boolean
} => {
  const registration1Won = winnerId === registration1Id
  const registration2Won = winnerId === registration2Id

  return {
    registration1Points: registration1Won ? pointsPerWin : pointsPerLoss,
    registration2Points: registration2Won ? pointsPerWin : pointsPerLoss,
    registration1Won,
    registration2Won,
  }
}

/**
 * Calculates set points won/lost for both registrations
 */
export const calculateSetPoints = (
  setResults: SetResult[],
  registration1Id: string,
  registration2Id: string
): {
  registration1SetsWon: number
  registration1SetsLost: number
  registration2SetsWon: number
  registration2SetsLost: number
} => {
  let registration1SetsWon = 0
  let registration1SetsLost = 0
  let registration2SetsWon = 0
  let registration2SetsLost = 0

  for (const set of setResults) {
    if (set.registration1Score > set.registration2Score) {
      registration1SetsWon++
      registration2SetsLost++
    } else if (set.registration2Score > set.registration1Score) {
      registration2SetsWon++
      registration1SetsLost++
    }
    // If equal, neither wins (shouldn't happen based on validation, but handle it)
  }

  return {
    registration1SetsWon,
    registration1SetsLost,
    registration2SetsWon,
    registration2SetsLost,
  }
}

/**
 * Updates registration standings after a match
 */
export const updateRegistrationStandings = async (
  registration1Id: string,
  registration2Id: string,
  matchResult: {
    registration1Won: boolean
    registration1Points: number
    registration2Won: boolean
    registration2Points: number
  },
  setResults: {
    registration1SetsWon: number
    registration1SetsLost: number
    registration2SetsWon: number
    registration2SetsLost: number
  }
): Promise<void> => {
  // Update registration 1
  const reg1Result = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registration1Id))
    .limit(1)

  if (reg1Result.length > 0) {
    const reg1 = reg1Result[0]
    await db
      .update(registrations)
      .set({
        matchesWon: reg1.matchesWon + (matchResult.registration1Won ? 1 : 0),
        matchesLost: reg1.matchesLost + (matchResult.registration1Won ? 0 : 1),
        setsWon: reg1.setsWon + setResults.registration1SetsWon,
        setsLost: reg1.setsLost + setResults.registration1SetsLost,
        points: reg1.points + matchResult.registration1Points,
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, registration1Id))
  }

  // Update registration 2
  const reg2Result = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registration2Id))
    .limit(1)

  if (reg2Result.length > 0) {
    const reg2 = reg2Result[0]
    await db
      .update(registrations)
      .set({
        matchesWon: reg2.matchesWon + (matchResult.registration2Won ? 1 : 0),
        matchesLost: reg2.matchesLost + (matchResult.registration2Won ? 0 : 1),
        setsWon: reg2.setsWon + setResults.registration2SetsWon,
        setsLost: reg2.setsLost + setResults.registration2SetsLost,
        points: reg2.points + matchResult.registration2Points,
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, registration2Id))
  }
}
