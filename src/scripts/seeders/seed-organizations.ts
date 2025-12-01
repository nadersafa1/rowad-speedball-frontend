import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { organization, member } from '@/db/schema'
import type { SeededUser, SeededOrganization, SeededMember } from './types'

// Arabic/Egyptian style organization names
const organizationData = [
  { name: 'Rowad Speedball Club', slug: 'rowad-speedball' },
  { name: 'Al-Ahly Speedball', slug: 'al-ahly-speedball' },
  { name: 'Zamalek Speedball', slug: 'zamalek-speedball' },
]

type OrgRole = 'owner' | 'admin' | 'coach' | 'player' | 'member' | 'super_admin'

export const seedOrganizations = async (
  db: NodePgDatabase,
  users: SeededUser[]
): Promise<{ organizations: SeededOrganization[]; members: SeededMember[] }> => {
  console.log('🌱 Seeding organizations...')

  const seededOrganizations: SeededOrganization[] = []
  const seededMembers: SeededMember[] = []

  // Separate admin and regular users
  const adminUsers = users.filter((u) => u.role === 'admin')
  const regularUsers = users.filter((u) => u.role === 'user')

  // Create organizations
  for (const orgData of organizationData) {
    const [createdOrg] = await db
      .insert(organization)
      .values({
        name: orgData.name,
        slug: orgData.slug,
      })
      .returning()

    seededOrganizations.push({
      id: createdOrg.id,
      name: createdOrg.name,
      slug: createdOrg.slug,
    })
  }

  // Assign members to organizations
  // Strategy:
  // - Each admin becomes super_admin in all orgs
  // - First 3 regular users become owners (1 per org)
  // - Next 3 regular users become admins (1 per org)
  // - Next 6 regular users become coaches (2 per org)
  // - Remaining users distributed as players/members

  // Add all admins as super_admin to all organizations
  for (const admin of adminUsers) {
    for (const org of seededOrganizations) {
      const [createdMember] = await db
        .insert(member)
        .values({
          userId: admin.id,
          organizationId: org.id,
          role: 'super_admin',
        })
        .returning()

      seededMembers.push({
        id: createdMember.id,
        userId: admin.id,
        organizationId: org.id,
        role: 'super_admin',
      })
    }
  }

  // Assign owners (1 per org, users 0-2)
  for (let i = 0; i < 3 && i < regularUsers.length; i++) {
    const user = regularUsers[i]
    const org = seededOrganizations[i]

    const [createdMember] = await db
      .insert(member)
      .values({
        userId: user.id,
        organizationId: org.id,
        role: 'owner',
      })
      .returning()

    seededMembers.push({
      id: createdMember.id,
      userId: user.id,
      organizationId: org.id,
      role: 'owner',
    })
  }

  // Assign org admins (1 per org, users 3-5)
  for (let i = 0; i < 3 && i + 3 < regularUsers.length; i++) {
    const user = regularUsers[i + 3]
    const org = seededOrganizations[i]

    const [createdMember] = await db
      .insert(member)
      .values({
        userId: user.id,
        organizationId: org.id,
        role: 'admin',
      })
      .returning()

    seededMembers.push({
      id: createdMember.id,
      userId: user.id,
      organizationId: org.id,
      role: 'admin',
    })
  }

  // Assign coaches (2 per org, users 6-11)
  for (let i = 0; i < 6 && i + 6 < regularUsers.length; i++) {
    const user = regularUsers[i + 6]
    const orgIndex = Math.floor(i / 2)
    const org = seededOrganizations[orgIndex]

    const [createdMember] = await db
      .insert(member)
      .values({
        userId: user.id,
        organizationId: org.id,
        role: 'coach',
      })
      .returning()

    seededMembers.push({
      id: createdMember.id,
      userId: user.id,
      organizationId: org.id,
      role: 'coach',
    })
  }

  // Remaining users as players/members distributed across orgs
  const remainingUsers = regularUsers.slice(12)
  for (let i = 0; i < remainingUsers.length; i++) {
    const user = remainingUsers[i]
    const orgIndex = i % 3
    const org = seededOrganizations[orgIndex]
    const role: OrgRole = i % 2 === 0 ? 'player' : 'member'

    const [createdMember] = await db
      .insert(member)
      .values({
        userId: user.id,
        organizationId: org.id,
        role,
      })
      .returning()

    seededMembers.push({
      id: createdMember.id,
      userId: user.id,
      organizationId: org.id,
      role,
    })
  }

  console.log(`✅ Created ${seededOrganizations.length} organizations`)
  console.log(`✅ Created ${seededMembers.length} memberships`)

  return { organizations: seededOrganizations, members: seededMembers }
}
