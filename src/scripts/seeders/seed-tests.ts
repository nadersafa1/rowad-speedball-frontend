import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { tests, testResults } from '@/db/schema'
import type {
  SeededOrganization,
  SeededPlayer,
  SeededTest,
  SeededTestResult,
} from './types'

const testNames = [
  'Speed Test - October',
  'Accuracy Assessment - October',
  'Endurance Test - November',
  'Skill Evaluation - November',
  'Agility Test - December',
  'Reaction Time Test - December',
]

// Generate test dates for the past 2 months
const generateTestDates = (): string[] => {
  const dates: string[] = []
  const today = new Date()

  for (let i = 0; i < 6; i++) {
    const daysAgo = 7 + i * 10 // Spread over past 2 months
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

// Generate realistic score based on skill level
const generateScore = (baseSkill: number): number => {
  const variance = Math.floor(Math.random() * 10) - 5
  return Math.max(0, Math.min(100, baseSkill + variance))
}

export const seedTests = async (
  db: NodePgDatabase,
  organizations: SeededOrganization[],
  players: SeededPlayer[]
): Promise<{ tests: SeededTest[]; testResults: SeededTestResult[] }> => {
  console.log('🌱 Seeding tests and results...')

  const seededTests: SeededTest[] = []
  const seededTestResults: SeededTestResult[] = []
  const testDates = generateTestDates()

  // Create 2 tests per organization
  let testIndex = 0
  for (const org of organizations) {
    const orgPlayers = players.filter((p) => p.organizationId === org.id)

    for (let i = 0; i < 2; i++) {
      const testName = testNames[testIndex % testNames.length]
      const testDate = testDates[testIndex % testDates.length]

      const [createdTest] = await db
        .insert(tests)
        .values({
          name: `${org.name} - ${testName}`,
          playingTime: [30, 45, 60][i % 3], // seconds
          recoveryTime: [15, 20, 30][i % 3], // seconds
          dateConducted: testDate,
          description: `Official ${testName.toLowerCase()} for ${org.name} players`,
          visibility: 'public',
          organizationId: org.id,
        })
        .returning()

      seededTests.push({
        id: createdTest.id,
        name: createdTest.name,
        organizationId: createdTest.organizationId,
        dateConducted: createdTest.dateConducted,
      })

      // Create test results for each player in the organization
      for (const player of orgPlayers) {
        // Base skill level varies by player (simulating different abilities)
        const baseSkill = 40 + Math.floor(Math.random() * 40) // 40-80 base

        const [createdResult] = await db
          .insert(testResults)
          .values({
            testId: createdTest.id,
            playerId: player.id,
            leftHandScore: generateScore(baseSkill - 5),
            rightHandScore: generateScore(baseSkill + 5),
            forehandScore: generateScore(baseSkill),
            backhandScore: generateScore(baseSkill - 10),
          })
          .returning()

        seededTestResults.push({
          id: createdResult.id,
          testId: createdTest.id,
          playerId: player.id,
        })
      }

      testIndex++
    }
  }

  console.log(`✅ Created ${seededTests.length} tests`)
  console.log(`✅ Created ${seededTestResults.length} test results`)

  return { tests: seededTests, testResults: seededTestResults }
}

