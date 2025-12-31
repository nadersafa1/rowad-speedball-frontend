import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { championships } from '@/db/schema'
import type { SeededFederation, SeededChampionship } from './types'

// Championship data for different federations
const championshipData = [
  // Egyptian Federation Championships
  {
    name: 'Egyptian National Championship 2025',
    description:
      'Annual national championship featuring the best clubs and players across Egypt.',
    startDate: '2025-03-15',
    endDate: '2025-03-20',
    federationIndex: 0, // Egyptian Federation
  },
  {
    name: 'Egyptian Youth Championship 2025',
    description:
      'Youth championship for U-13, U-15, and U-17 age groups.',
    startDate: '2025-04-10',
    endDate: '2025-04-14',
    federationIndex: 0,
  },
  {
    name: 'Cairo Open Championship 2025',
    description: 'Open championship hosted in Cairo for all skill levels.',
    startDate: '2025-05-01',
    endDate: '2025-05-05',
    federationIndex: 0,
  },
  // Arab Federation Championships
  {
    name: 'Arab Speedball Cup 2025',
    description:
      'Premier regional championship bringing together Arab nations.',
    startDate: '2025-06-15',
    endDate: '2025-06-22',
    federationIndex: 1, // Arab Federation
  },
  {
    name: 'Arab Junior Championship 2025',
    description: 'Regional junior championship for U-15 and U-17 players.',
    startDate: '2025-07-10',
    endDate: '2025-07-16',
    federationIndex: 1,
  },
  // International Federation Championship
  {
    name: 'World Speedball Championship 2025',
    description:
      'The premier international Speedball championship featuring teams from around the globe.',
    startDate: '2025-09-01',
    endDate: '2025-09-10',
    federationIndex: 2, // International Federation
  },
  {
    name: 'International Masters Championship 2025',
    description: 'Elite championship for senior and master level players.',
    startDate: '2025-10-15',
    endDate: '2025-10-20',
    federationIndex: 2,
  },
]

export const seedChampionships = async (
  db: NodePgDatabase,
  federations: SeededFederation[]
): Promise<SeededChampionship[]> => {
  console.log('🌱 Seeding championships...')

  const seededChampionships: SeededChampionship[] = []

  // Create championships
  for (const champData of championshipData) {
    const federation = federations[champData.federationIndex]

    if (!federation) {
      console.warn(
        `⚠️  Federation not found for championship: ${champData.name}`
      )
      continue
    }

    const [createdChampionship] = await db
      .insert(championships)
      .values({
        federationId: federation.id,
        name: champData.name,
        description: champData.description,
        startDate: champData.startDate,
        endDate: champData.endDate,
      })
      .returning()

    seededChampionships.push({
      id: createdChampionship.id,
      federationId: createdChampionship.federationId,
      name: createdChampionship.name,
      description: createdChampionship.description || null,
      startDate: createdChampionship.startDate || null,
      endDate: createdChampionship.endDate || null,
    })
  }

  console.log(`✅ Created ${seededChampionships.length} championships`)

  return seededChampionships
}
