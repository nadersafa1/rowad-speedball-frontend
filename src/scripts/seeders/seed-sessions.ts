import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
  trainingSessions,
  trainingSessionCoaches,
  trainingSessionAttendance,
} from '@/db/schema'
import type {
  SeededOrganization,
  SeededPlayer,
  SeededCoach,
  SeededTrainingSession,
} from './types'

const sessionTypes = [
  ['technique', 'conditioning'],
  ['tactical', 'match-play'],
  ['strength', 'agility'],
  ['recovery', 'flexibility'],
]

const ageGroups = [
  ['mini', 'U-09'],
  ['U-11', 'U-13'],
  ['U-15', 'U-17'],
  ['U-19', 'U-21', 'Seniors'],
]

const intensityLevels: Array<'high' | 'normal' | 'low'> = [
  'high',
  'normal',
  'low',
]

const attendanceStatuses: Array<
  'present' | 'late' | 'absent_excused' | 'absent_unexcused' | 'pending'
> = ['present', 'present', 'present', 'late', 'absent_excused', 'pending']

// Generate dates for the past 2 weeks
const generateSessionDates = (count: number): string[] => {
  const dates: string[] = []
  const today = new Date()

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 14)
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates.sort()
}

export const seedTrainingSessions = async (
  db: NodePgDatabase,
  organizations: SeededOrganization[],
  players: SeededPlayer[],
  coaches: SeededCoach[]
): Promise<SeededTrainingSession[]> => {
  console.log('🌱 Seeding training sessions...')

  const seededSessions: SeededTrainingSession[] = []
  const dates = generateSessionDates(12)
  let dateIndex = 0

  // Create 4 sessions per organization
  for (const org of organizations) {
    const orgCoaches = coaches.filter((c) => c.organizationId === org.id)
    const orgPlayers = players.filter((p) => p.organizationId === org.id)

    for (let i = 0; i < 4; i++) {
      const sessionDate = dates[dateIndex % dates.length]
      const sessionName = `${org.name} Training - ${new Date(sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

      const [createdSession] = await db
        .insert(trainingSessions)
        .values({
          name: sessionName,
          date: sessionDate,
          intensity: intensityLevels[i % intensityLevels.length],
          type: sessionTypes[i % sessionTypes.length],
          ageGroups: ageGroups[i % ageGroups.length],
          description: `Training session focusing on ${sessionTypes[i % sessionTypes.length].join(' and ')}`,
          organizationId: org.id,
        })
        .returning()

      seededSessions.push({
        id: createdSession.id,
        name: createdSession.name,
        organizationId: createdSession.organizationId,
        date: createdSession.date,
        intensity: createdSession.intensity as 'high' | 'normal' | 'low',
      })

      // Assign coaches to session
      for (const coach of orgCoaches) {
        await db.insert(trainingSessionCoaches).values({
          trainingSessionId: createdSession.id,
          coachId: coach.id,
        })
      }

      // Create attendance records for org players
      for (const player of orgPlayers) {
        const status =
          attendanceStatuses[
            Math.floor(Math.random() * attendanceStatuses.length)
          ]

        await db.insert(trainingSessionAttendance).values({
          trainingSessionId: createdSession.id,
          playerId: player.id,
          status,
        })
      }

      dateIndex++
    }
  }

  console.log(`✅ Created ${seededSessions.length} training sessions`)
  return seededSessions
}

