import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { coaches } from '@/db/schema'
import type {
  SeededUser,
  SeededOrganization,
  SeededMember,
  SeededCoach,
} from './types'

// Arabic/Egyptian coach names
const coachNames = [
  { name: 'Captain Ahmed Farouk', gender: 'male' as const },
  { name: 'Coach Mohamed Saad', gender: 'male' as const },
  { name: 'Captain Khaled Anwar', gender: 'male' as const },
  { name: 'Coach Tarek Nour', gender: 'male' as const },
  { name: 'Captain Hossam Hassan', gender: 'male' as const },
  { name: 'Coach Amira Mostafa', gender: 'female' as const },
]

export const seedCoaches = async (
  db: NodePgDatabase,
  users: SeededUser[],
  organizations: SeededOrganization[],
  members: SeededMember[]
): Promise<SeededCoach[]> => {
  console.log('🌱 Seeding coaches...')

  const seededCoaches: SeededCoach[] = []

  // Find users who are members with 'coach' role
  const coachMembers = members.filter((m) => m.role === 'coach')

  for (let i = 0; i < coachNames.length; i++) {
    const coachData = coachNames[i]
    let userId: string | null = null
    let organizationId: string | null = null

    // Link to user with coach membership if available
    if (i < coachMembers.length) {
      const coachMember = coachMembers[i]
      userId = coachMember.userId
      organizationId = coachMember.organizationId
    } else {
      // Assign to organization without user link
      organizationId = organizations[i % organizations.length].id
    }

    const [createdCoach] = await db
      .insert(coaches)
      .values({
        name: coachData.name,
        gender: coachData.gender,
        userId,
        organizationId,
      })
      .returning()

    seededCoaches.push({
      id: createdCoach.id,
      name: createdCoach.name,
      userId: createdCoach.userId,
      organizationId: createdCoach.organizationId,
      gender: createdCoach.gender as 'male' | 'female',
    })
  }

  console.log(`✅ Created ${seededCoaches.length} coaches`)
  return seededCoaches
}

