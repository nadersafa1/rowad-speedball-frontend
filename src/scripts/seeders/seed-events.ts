import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { events, registrations, registrationPlayers } from '@/db/schema'
import type { SeededOrganization, SeededPlayer } from './types'
import type { EventType } from '@/types/event-types'

export interface SeededEvent {
  id: string
  name: string
  organizationId: string | null
  eventType: EventType
  gender: 'male' | 'female' | 'mixed'
  bestOf: number
}

export interface SeededRegistration {
  id: string
  eventId: string
  playerIds: string[]
}

// Event templates - only singles, doubles, and singles-teams
const eventTemplates: Array<{
  name: string
  eventType: EventType
  gender: 'male' | 'female' | 'mixed'
  format: 'groups' | 'single-elimination' | 'groups-knockout'
  bestOf: number
  minPlayers: number
  maxPlayers: number
}> = [
  {
    name: 'Men Singles Championship',
    eventType: 'singles',
    gender: 'male',
    format: 'groups',
    bestOf: 3,
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    name: 'Women Singles Championship',
    eventType: 'singles',
    gender: 'female',
    format: 'groups',
    bestOf: 3,
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    name: 'Men Doubles Tournament',
    eventType: 'doubles',
    gender: 'male',
    format: 'groups',
    bestOf: 3,
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    name: 'Women Doubles Tournament',
    eventType: 'doubles',
    gender: 'female',
    format: 'groups',
    bestOf: 3,
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    name: 'Mixed Doubles Tournament',
    eventType: 'doubles',
    gender: 'mixed',
    format: 'groups',
    bestOf: 5,
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    name: 'Men Singles Teams Championship',
    eventType: 'singles-teams',
    gender: 'male',
    format: 'groups',
    bestOf: 3,
    minPlayers: 2,
    maxPlayers: 4,
  },
]

// Generate event dates
const generateEventDates = (
  daysFromNow: number,
  duration: number
): string[] => {
  const dates: string[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + daysFromNow)
  for (let i = 0; i < duration; i++) {
    const eventDate = new Date(startDate)
    eventDate.setDate(eventDate.getDate() + i)
    dates.push(eventDate.toISOString().split('T')[0])
  }
  return dates
}

// Generate registration dates
const generateRegistrationDates = (
  eventStartDays: number
): { start: string; end: string } => {
  const today = new Date()
  const regStart = new Date(today)
  regStart.setDate(regStart.getDate() - 7)
  const regEnd = new Date(today)
  regEnd.setDate(regEnd.getDate() + eventStartDays - 2)
  return {
    start: regStart.toISOString().split('T')[0],
    end: regEnd.toISOString().split('T')[0],
  }
}

// Helper to create registration with players in junction table
const createRegistrationWithPlayers = async (
  db: NodePgDatabase,
  eventId: string,
  playerIds: string[]
): Promise<SeededRegistration> => {
  const [createdReg] = await db
    .insert(registrations)
    .values({ eventId })
    .returning()

  // Insert players into junction table
  await db.insert(registrationPlayers).values(
    playerIds.map((playerId, index) => ({
      registrationId: createdReg.id,
      playerId,
      position: index + 1,
    }))
  )

  return {
    id: createdReg.id,
    eventId,
    playerIds,
  }
}

export const seedEvents = async (
  db: NodePgDatabase,
  organizations: SeededOrganization[],
  players: SeededPlayer[]
): Promise<{
  events: SeededEvent[]
  registrations: SeededRegistration[]
}> => {
  console.log('🌱 Seeding events...')

  const seededEvents: SeededEvent[] = []
  const seededRegistrations: SeededRegistration[] = []

  let eventIndex = 0

  for (const org of organizations) {
    const orgPlayers = players.filter((p) => p.organizationId === org.id)
    const malePlayers = orgPlayers.filter((p) => p.gender === 'male')
    const femalePlayers = orgPlayers.filter((p) => p.gender === 'female')

    for (const template of eventTemplates) {
      const daysFromNow = 7 + eventIndex * 14
      const eventDates = generateEventDates(daysFromNow, 2)
      const regDates = generateRegistrationDates(daysFromNow)

      const [createdEvent] = await db
        .insert(events)
        .values({
          name: `${org.name} - ${template.name}`,
          eventType: template.eventType,
          gender: template.gender,
          format: template.format,
          visibility: 'public',
          registrationStartDate: regDates.start,
          registrationEndDate: regDates.end,
          eventDates: eventDates,
          bestOf: template.bestOf,
          pointsPerWin: 3,
          pointsPerLoss: 0,
          completed: false,
          organizationId: org.id,
          minPlayers: template.minPlayers,
          maxPlayers: template.maxPlayers,
        })
        .returning()

      seededEvents.push({
        id: createdEvent.id,
        name: createdEvent.name,
        organizationId: createdEvent.organizationId,
        eventType: createdEvent.eventType as SeededEvent['eventType'],
        gender: createdEvent.gender as 'male' | 'female' | 'mixed',
        bestOf: createdEvent.bestOf,
      })

      // Single player events: solo, singles
      if (template.maxPlayers === 1) {
        const eligiblePlayers =
          template.gender === 'male' ? malePlayers : femalePlayers

        // Determine registration count (5-25)
        const minRegs = 5
        const maxRegs = Math.min(25, eligiblePlayers.length)
        const registrationCount =
          maxRegs >= minRegs
            ? minRegs + Math.floor(Math.random() * (maxRegs - minRegs + 1))
            : eligiblePlayers.length

        // Shuffle and select players
        const shuffledPlayers = [...eligiblePlayers].sort(
          () => Math.random() - 0.5
        )
        const selectedPlayers = shuffledPlayers.slice(0, registrationCount)

        for (const player of selectedPlayers) {
          const seededReg = await createRegistrationWithPlayers(
            db,
            createdEvent.id,
            [player.id]
          )
          seededRegistrations.push(seededReg)
        }
      } else {
        // Multi-player events: doubles, singles-teams, solo-teams, relay
        if (template.gender === 'mixed') {
          // Mixed events: need equal distribution of males and females
          // For doubles (2 players): 1 male + 1 female
          // For relay (4 players): 2 males + 2 females, etc.
          const shuffledMales = [...malePlayers].sort(() => Math.random() - 0.5)
          const shuffledFemales = [...femalePlayers].sort(
            () => Math.random() - 0.5
          )

          // For mixed events, we need equal number of males and females per team
          const playersPerGender = Math.ceil(template.maxPlayers / 2)
          const maxTeams = Math.min(
            Math.floor(shuffledMales.length / playersPerGender),
            Math.floor(shuffledFemales.length / playersPerGender)
          )
          const minRegs = 5
          const maxRegs = Math.min(25, maxTeams)
          const teamCount =
            maxRegs >= minRegs
              ? minRegs + Math.floor(Math.random() * (maxRegs - minRegs + 1))
              : maxTeams

          for (let i = 0; i < teamCount; i++) {
            const teamPlayers = []
            // Add males
            for (let j = 0; j < playersPerGender; j++) {
              const male = shuffledMales[i * playersPerGender + j]
              if (male) teamPlayers.push(male)
            }
            // Add females
            for (let j = 0; j < playersPerGender; j++) {
              const female = shuffledFemales[i * playersPerGender + j]
              if (female) teamPlayers.push(female)
            }
            // Only create registration if we have enough players
            if (teamPlayers.length === template.maxPlayers) {
              const seededReg = await createRegistrationWithPlayers(
                db,
                createdEvent.id,
                teamPlayers.map((p) => p.id)
              )
              seededRegistrations.push(seededReg)
            }
          }
        } else {
          // Same gender multi-player events: doubles, singles-teams, solo-teams, relay
          const eligiblePlayers =
            template.gender === 'male' ? malePlayers : femalePlayers

          const shuffledPlayers = [...eligiblePlayers].sort(
            () => Math.random() - 0.5
          )

          // Number of teams (need maxPlayers players per team)
          const maxTeams = Math.floor(
            shuffledPlayers.length / template.maxPlayers
          )
          const minRegs = 5
          const maxRegs = Math.min(25, maxTeams)
          const teamCount =
            maxRegs >= minRegs
              ? minRegs + Math.floor(Math.random() * (maxRegs - minRegs + 1))
              : maxTeams

          for (let i = 0; i < teamCount; i++) {
            const teamPlayers = []
            for (let j = 0; j < template.maxPlayers; j++) {
              const player = shuffledPlayers[i * template.maxPlayers + j]
              if (player) {
                teamPlayers.push(player)
              }
            }
            // Only create registration if we have enough players for the team
            if (teamPlayers.length >= template.minPlayers) {
              const seededReg = await createRegistrationWithPlayers(
                db,
                createdEvent.id,
                teamPlayers.map((p) => p.id)
              )
              seededRegistrations.push(seededReg)
            }
          }
        }
      }

      eventIndex++
    }
  }

  console.log(`✅ Created ${seededEvents.length} events`)
  console.log(`✅ Created ${seededRegistrations.length} registrations`)

  return {
    events: seededEvents,
    registrations: seededRegistrations,
  }
}
