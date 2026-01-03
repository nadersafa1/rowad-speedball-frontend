import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { championshipEditions } from '@/db/schema'
import type {
  SeededChampionship,
  SeededChampionshipEdition,
} from './types'

// Championship edition data for each championship
const championshipEditionData = [
  // Egyptian National Championship editions
  {
    championshipIndex: 0,
    year: 2025,
    status: 'published' as const,
    registrationStartDate: '2025-01-01',
    registrationEndDate: '2025-02-28',
  },
  {
    championshipIndex: 0,
    year: 2024,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
  {
    championshipIndex: 0,
    year: 2023,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
  // Egyptian Youth Championship editions
  {
    championshipIndex: 1,
    year: 2025,
    status: 'published' as const,
    registrationStartDate: '2025-02-01',
    registrationEndDate: '2025-03-15',
  },
  {
    championshipIndex: 1,
    year: 2024,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
  // Cairo Open Championship editions
  {
    championshipIndex: 2,
    year: 2025,
    status: 'draft' as const,
    registrationStartDate: '2025-03-01',
    registrationEndDate: '2025-04-01',
  },
  {
    championshipIndex: 2,
    year: 2024,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
  // Arab Speedball Cup editions
  {
    championshipIndex: 3,
    year: 2025,
    status: 'published' as const,
    registrationStartDate: '2025-04-01',
    registrationEndDate: '2025-05-31',
  },
  {
    championshipIndex: 3,
    year: 2024,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
  // Arab Junior Championship editions
  {
    championshipIndex: 4,
    year: 2025,
    status: 'published' as const,
    registrationStartDate: '2025-05-01',
    registrationEndDate: '2025-06-15',
  },
  // World Speedball Championship editions
  {
    championshipIndex: 5,
    year: 2025,
    status: 'published' as const,
    registrationStartDate: '2025-06-01',
    registrationEndDate: '2025-08-31',
  },
  {
    championshipIndex: 5,
    year: 2024,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
  {
    championshipIndex: 5,
    year: 2023,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
  // International Masters Championship editions
  {
    championshipIndex: 6,
    year: 2025,
    status: 'draft' as const,
    registrationStartDate: '2025-07-01',
    registrationEndDate: '2025-09-30',
  },
  {
    championshipIndex: 6,
    year: 2024,
    status: 'archived' as const,
    registrationStartDate: null,
    registrationEndDate: null,
  },
]

export const seedChampionshipEditions = async (
  db: NodePgDatabase,
  championships: SeededChampionship[]
): Promise<SeededChampionshipEdition[]> => {
  console.log('🌱 Seeding championship editions...')

  const seededEditions: SeededChampionshipEdition[] = []

  // Create championship editions
  for (const editionData of championshipEditionData) {
    const championship = championships[editionData.championshipIndex]

    if (!championship) {
      console.warn(
        `⚠️  Championship not found for edition: year ${editionData.year}`
      )
      continue
    }

    const [createdEdition] = await db
      .insert(championshipEditions)
      .values({
        championshipId: championship.id,
        year: editionData.year,
        status: editionData.status,
        registrationStartDate: editionData.registrationStartDate,
        registrationEndDate: editionData.registrationEndDate,
      })
      .returning()

    seededEditions.push({
      id: createdEdition.id,
      championshipId: createdEdition.championshipId,
      year: createdEdition.year,
      status: createdEdition.status,
      registrationStartDate: createdEdition.registrationStartDate,
      registrationEndDate: createdEdition.registrationEndDate,
    })
  }

  console.log(`✅ Created ${seededEditions.length} championship editions`)

  return seededEditions
}
