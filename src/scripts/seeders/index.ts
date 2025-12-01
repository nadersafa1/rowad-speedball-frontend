import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { seedUsers } from './seed-users'
import { seedOrganizations } from './seed-organizations'
import { seedPlayers } from './seed-players'
import { seedCoaches } from './seed-coaches'
import { seedTrainingSessions } from './seed-sessions'
import { seedTests } from './seed-tests'
import { seedEvents } from './seed-events'
import type {
  SeederContext,
  SeedDataOutput,
  OrganizationSummary,
} from './types'

export const runAllSeeders = async (
  db: NodePgDatabase
): Promise<SeederContext> => {
  console.log('\n🚀 Starting database seeding...\n')

  // 1. Seed users first (independent)
  const users = await seedUsers(db)

  // 2. Seed organizations and members (depends on users)
  const { organizations, members } = await seedOrganizations(db, users)

  // 3. Seed players (depends on users, organizations, members)
  const players = await seedPlayers(db, users, organizations, members)

  // 4. Seed coaches (depends on users, organizations, members)
  const coaches = await seedCoaches(db, users, organizations, members)

  // 5. Seed training sessions (depends on organizations, players, coaches)
  const trainingSessions = await seedTrainingSessions(
    db,
    organizations,
    players,
    coaches
  )

  // 6. Seed tests and results (depends on organizations, players)
  const { tests, testResults } = await seedTests(db, organizations, players)

  // 7. Seed events and registrations (groups, matches, sets are created manually)
  const { events, registrations } = await seedEvents(db, organizations, players)

  console.log('\n✅ Database seeding completed!\n')

  return {
    users,
    organizations,
    members,
    players,
    coaches,
    trainingSessions,
    tests,
    testResults,
    events,
    registrations,
  }
}

export const generateSeedDataOutput = (
  context: SeederContext
): SeedDataOutput => {
  const { users, organizations, members, players, coaches } = context

  // Build organization summaries (without events as requested)
  const organizationSummaries: OrganizationSummary[] = organizations.map(
    (org) => {
      const orgMembers = members.filter((m) => m.organizationId === org.id)
      const orgPlayers = players.filter((p) => p.organizationId === org.id)
      const orgCoaches = coaches.filter((c) => c.organizationId === org.id)

      // Get user details for members
      const getUserDetails = (userId: string) => {
        const user = users.find((u) => u.id === userId)
        return user
          ? { id: user.id, name: user.name, email: user.email }
          : { id: userId, name: 'Unknown', email: 'unknown@example.com' }
      }

      // Get player details with email if linked to user
      const getPlayerDetails = (player: (typeof players)[0]) => {
        const linkedUser = player.userId
          ? users.find((u) => u.id === player.userId)
          : null
        return {
          id: player.id,
          name: player.name,
          email: linkedUser?.email || null,
        }
      }

      // Get coach details with email if linked to user
      const getCoachDetails = (coach: (typeof coaches)[0]) => {
        const linkedUser = coach.userId
          ? users.find((u) => u.id === coach.userId)
          : null
        return {
          id: coach.id,
          name: coach.name,
          email: linkedUser?.email || null,
        }
      }

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        players: orgPlayers.map(getPlayerDetails),
        coaches: orgCoaches.map(getCoachDetails),
        admins: orgMembers
          .filter((m) => m.role === 'admin')
          .map((m) => getUserDetails(m.userId)),
        owners: orgMembers
          .filter((m) => m.role === 'owner')
          .map((m) => getUserDetails(m.userId)),
        members: orgMembers.map((m) => ({
          ...getUserDetails(m.userId),
          role: m.role,
        })),
      }
    }
  )

  return {
    generatedAt: new Date().toISOString(),
    password: 'Test@1234',
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    })),
    organizations: organizationSummaries,
  }
}
