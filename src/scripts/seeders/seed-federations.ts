import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { federations, federationClubs } from '@/db/schema'
import type {
  SeededFederation,
  SeededFederationClub,
  SeededOrganization,
} from './types'

// Federation data
const federationData = [
  {
    name: 'Egyptian Speedball Federation',
    description:
      'The official governing body for Speedball in Egypt, organizing national championships and development programs.',
  },
  {
    name: 'Arab Speedball Federation',
    description:
      'Regional federation overseeing Speedball development across Arab nations.',
  },
  {
    name: 'International Speedball Federation',
    description:
      'Global organization promoting Speedball worldwide and organizing international competitions.',
  },
]

export const seedFederations = async (
  db: NodePgDatabase,
  organizations: SeededOrganization[]
): Promise<{
  federations: SeededFederation[]
  federationClubs: SeededFederationClub[]
}> => {
  console.log('🌱 Seeding federations...')

  const seededFederations: SeededFederation[] = []
  const seededFederationClubs: SeededFederationClub[] = []

  // Create federations
  for (const fedData of federationData) {
    const [createdFederation] = await db
      .insert(federations)
      .values({
        name: fedData.name,
        description: fedData.description,
      })
      .returning()

    seededFederations.push({
      id: createdFederation.id,
      name: createdFederation.name,
      description: createdFederation.description || null,
    })
  }

  // Link organizations to federations
  // Strategy: Distribute organizations across federations
  // Egyptian Federation gets all 3 orgs
  // Arab Federation gets 2 orgs (first two)
  // International Federation gets 1 org (first one)

  const egyptianFed = seededFederations[0]
  const arabFed = seededFederations[1]
  const internationalFed = seededFederations[2]

  // Link all orgs to Egyptian Federation
  for (const org of organizations) {
    const [createdLink] = await db
      .insert(federationClubs)
      .values({
        federationId: egyptianFed.id,
        organizationId: org.id,
      })
      .returning()

    seededFederationClubs.push({
      id: createdLink.id,
      federationId: egyptianFed.id,
      organizationId: org.id,
    })
  }

  // Link first 2 orgs to Arab Federation
  for (let i = 0; i < 2 && i < organizations.length; i++) {
    const org = organizations[i]
    const [createdLink] = await db
      .insert(federationClubs)
      .values({
        federationId: arabFed.id,
        organizationId: org.id,
      })
      .returning()

    seededFederationClubs.push({
      id: createdLink.id,
      federationId: arabFed.id,
      organizationId: org.id,
    })
  }

  // Link first org to International Federation
  if (organizations.length > 0) {
    const org = organizations[0]
    const [createdLink] = await db
      .insert(federationClubs)
      .values({
        federationId: internationalFed.id,
        organizationId: org.id,
      })
      .returning()

    seededFederationClubs.push({
      id: createdLink.id,
      federationId: internationalFed.id,
      organizationId: org.id,
    })
  }

  console.log(`✅ Created ${seededFederations.length} federations`)
  console.log(
    `✅ Created ${seededFederationClubs.length} federation-club links`
  )

  return {
    federations: seededFederations,
    federationClubs: seededFederationClubs,
  }
}
