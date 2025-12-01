import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { events, registrations } from '@/db/schema'
import type { SeededOrganization, SeededPlayer } from './types'

export interface SeededEvent {
  id: string
  name: string
  organizationId: string | null
  eventType: 'singles' | 'doubles'
  gender: 'male' | 'female' | 'mixed'
  bestOf: number
}

export interface SeededRegistration {
  id: string
  eventId: string
  player1Id: string
  player2Id: string | null
}

// Event templates
const eventTemplates: Array<{
  name: string
  eventType: 'singles' | 'doubles'
  gender: 'male' | 'female' | 'mixed'
  groupMode: 'single' | 'multiple'
  bestOf: number
}> = [
  {
    name: 'Men Singles Championship',
    eventType: 'singles',
    gender: 'male',
    groupMode: 'multiple',
    bestOf: 3,
  },
  {
    name: 'Women Singles Championship',
    eventType: 'singles',
    gender: 'female',
    groupMode: 'single',
    bestOf: 3,
  },
  {
    name: 'Men Doubles Tournament',
    eventType: 'doubles',
    gender: 'male',
    groupMode: 'multiple',
    bestOf: 3,
  },
  {
    name: 'Women Doubles Tournament',
    eventType: 'doubles',
    gender: 'female',
    groupMode: 'single',
    bestOf: 3,
  },
  {
    name: 'Mixed Doubles Tournament',
    eventType: 'doubles',
    gender: 'mixed',
    groupMode: 'multiple',
    bestOf: 5,
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
          groupMode: template.groupMode,
          visibility: 'public',
          registrationStartDate: regDates.start,
          registrationEndDate: regDates.end,
          eventDates: eventDates,
          bestOf: template.bestOf,
          pointsPerWin: 3,
          pointsPerLoss: 0,
          completed: false,
          organizationId: org.id,
        })
        .returning()

      seededEvents.push({
        id: createdEvent.id,
        name: createdEvent.name,
        organizationId: createdEvent.organizationId,
        eventType: createdEvent.eventType as 'singles' | 'doubles',
        gender: createdEvent.gender as 'male' | 'female' | 'mixed',
        bestOf: createdEvent.bestOf,
      })

      if (template.eventType === 'singles') {
        // Singles: filter by gender
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
          const [createdReg] = await db
            .insert(registrations)
            .values({
              eventId: createdEvent.id,
              player1Id: player.id,
              player2Id: null,
            })
            .returning()

          seededRegistrations.push({
            id: createdReg.id,
            eventId: createdEvent.id,
            player1Id: player.id,
            player2Id: null,
          })
        }
      } else {
        // Doubles: handle based on gender type
        if (template.gender === 'mixed') {
          // Mixed doubles: pair 1 male + 1 female
          const shuffledMales = [...malePlayers].sort(() => Math.random() - 0.5)
          const shuffledFemales = [...femalePlayers].sort(
            () => Math.random() - 0.5
          )

          // Number of pairs is limited by the smaller group
          const maxPairs = Math.min(
            shuffledMales.length,
            shuffledFemales.length
          )
          const minRegs = 5
          const maxRegs = Math.min(25, maxPairs)
          const pairCount =
            maxRegs >= minRegs
              ? minRegs + Math.floor(Math.random() * (maxRegs - minRegs + 1))
              : maxPairs

          for (let i = 0; i < pairCount; i++) {
            const male = shuffledMales[i]
            const female = shuffledFemales[i]
            if (male && female) {
              const [createdReg] = await db
                .insert(registrations)
                .values({
                  eventId: createdEvent.id,
                  player1Id: male.id,
                  player2Id: female.id,
                })
                .returning()

              seededRegistrations.push({
                id: createdReg.id,
                eventId: createdEvent.id,
                player1Id: male.id,
                player2Id: female.id,
              })
            }
          }
        } else {
          // Men doubles or Women doubles: same gender pairs
          const eligiblePlayers =
            template.gender === 'male' ? malePlayers : femalePlayers

          const shuffledPlayers = [...eligiblePlayers].sort(
            () => Math.random() - 0.5
          )

          // Number of pairs (need 2 players per pair)
          const maxPairs = Math.floor(shuffledPlayers.length / 2)
          const minRegs = 5
          const maxRegs = Math.min(25, maxPairs)
          const pairCount =
            maxRegs >= minRegs
              ? minRegs + Math.floor(Math.random() * (maxRegs - minRegs + 1))
              : maxPairs

          for (let i = 0; i < pairCount; i++) {
            const player1 = shuffledPlayers[i * 2]
            const player2 = shuffledPlayers[i * 2 + 1]
            if (player1 && player2) {
              const [createdReg] = await db
                .insert(registrations)
                .values({
                  eventId: createdEvent.id,
                  player1Id: player1.id,
                  player2Id: player2.id,
                })
                .returning()

              seededRegistrations.push({
                id: createdReg.id,
                eventId: createdEvent.id,
                player1Id: player1.id,
                player2Id: player2.id,
              })
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
