import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { coaches } from '@/db/schema'
import type {
  SeededUser,
  SeededOrganization,
  SeededMember,
  SeededCoach,
} from './types'

// Arabic/Egyptian coach names with RTL versions
const coachNamesWithRtl = [
  { name: 'Captain Ahmed Farouk', nameRtl: 'كابتن أحمد فاروق', gender: 'male' as const },
  { name: 'Coach Mohamed Saad', nameRtl: 'مدرب محمد سعد', gender: 'male' as const },
  { name: 'Captain Khaled Anwar', nameRtl: 'كابتن خالد أنور', gender: 'male' as const },
  { name: 'Coach Tarek Nour', nameRtl: 'مدرب طارق نور', gender: 'male' as const },
  { name: 'Captain Hossam Hassan', nameRtl: 'كابتن حسام حسن', gender: 'male' as const },
  { name: 'Coach Amira Mostafa', nameRtl: 'مدربة أميرة مصطفى', gender: 'female' as const },
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

  for (let i = 0; i < coachNamesWithRtl.length; i++) {
    const coachData = coachNamesWithRtl[i]
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
        nameRtl: coachData.nameRtl,
        gender: coachData.gender,
        userId,
        organizationId,
      })
      .returning()

    seededCoaches.push({
      id: createdCoach.id,
      name: createdCoach.name,
      nameRtl: createdCoach.nameRtl,
      userId: createdCoach.userId,
      organizationId: createdCoach.organizationId,
      gender: createdCoach.gender as 'male' | 'female',
    })
  }

  console.log(`✅ Created ${seededCoaches.length} coaches`)
  return seededCoaches
}

