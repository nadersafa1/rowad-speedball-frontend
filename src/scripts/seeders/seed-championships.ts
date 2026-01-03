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
    competitionScope: 'clubs' as const,
    federationIndex: 0, // Egyptian Federation
  },
  {
    name: 'Egyptian Youth Championship 2025',
    description:
      'Youth championship for U-13, U-15, and U-17 age groups.',
    competitionScope: 'clubs' as const,
    federationIndex: 0,
  },
  {
    name: 'Cairo Open Championship 2025',
    description: 'Open championship hosted in Cairo for all skill levels.',
    competitionScope: 'open' as const,
    federationIndex: 0,
  },
  // Arab Federation Championships
  {
    name: 'Arab Speedball Cup 2025',
    description:
      'Premier regional championship bringing together Arab nations.',
    competitionScope: 'clubs' as const,
    federationIndex: 1, // Arab Federation
  },
  {
    name: 'Arab Junior Championship 2025',
    description: 'Regional junior championship for U-15 and U-17 players.',
    competitionScope: 'clubs' as const,
    federationIndex: 1,
  },
  // International Federation Championship
  {
    name: 'World Speedball Championship 2025',
    description:
      'The premier international Speedball championship featuring teams from around the globe.',
    competitionScope: 'open' as const,
    federationIndex: 2, // International Federation
  },
  {
    name: 'International Masters Championship 2025',
    description: 'Elite championship for senior and master level players.',
    competitionScope: 'open' as const,
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
        competitionScope: champData.competitionScope,
      })
      .returning()

    seededChampionships.push({
      id: createdChampionship.id,
      federationId: createdChampionship.federationId,
      name: createdChampionship.name,
      description: createdChampionship.description || null,
      competitionScope: createdChampionship.competitionScope,
    })
  }

  console.log(`✅ Created ${seededChampionships.length} championships`)

  return seededChampionships
}
