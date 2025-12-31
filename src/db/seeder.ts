import { drizzle } from 'drizzle-orm/node-postgres'
import { reset } from 'drizzle-seed'
import { writeFileSync } from 'fs'
import { join } from 'path'
import * as schema from './schema'
import { runAllSeeders, generateSeedDataOutput } from '../scripts/seeders'

const main = async () => {
  console.log('🔗 Connecting to database...')

  const db = drizzle(process.env.DATABASE_URL!)

  try {
    // Reset all tables before seeding
    console.log('🗑️  Resetting database tables...')
    await reset(db, schema)
    console.log('✅ Database reset complete\n')

    // Run all seeders
    const context = await runAllSeeders(db)

    // Generate JSON output
    const seedDataOutput = generateSeedDataOutput(context)

    // Write JSON file to src/db/seed-data.json
    const outputPath = join(__dirname, 'seed-data.json')
    writeFileSync(outputPath, JSON.stringify(seedDataOutput, null, 2))
    console.log(`📄 Seed data written to: ${outputPath}`)

    // Print summary
    console.log('\n📊 Seeding Summary:')
    console.log(`   Federations: ${context.federations.length}`)
    console.log(`   Championships: ${context.championships.length}`)
    console.log(`   Federation-Club Links: ${context.federationClubs.length}`)
    console.log(`   Users: ${context.users.length}`)
    console.log(
      `     - Regular admins: ${context.users.filter((u) => u.role === 'admin').length}`
    )
    console.log(
      `     - Federation admins: ${context.users.filter((u) => u.role === 'federation-admin').length}`
    )
    console.log(
      `     - Federation editors: ${context.users.filter((u) => u.role === 'federation-editor').length}`
    )
    console.log(
      `     - Regular users: ${context.users.filter((u) => u.role === 'user').length}`
    )
    console.log(`   Organizations: ${context.organizations.length}`)
    console.log(`   Members: ${context.members.length}`)
    console.log(`   Players: ${context.players.length}`)
    console.log(`   Coaches: ${context.coaches.length}`)
    console.log(`   Training Sessions: ${context.trainingSessions.length}`)
    console.log(`   Tests: ${context.tests.length}`)
    console.log(`   Test Results: ${context.testResults.length}`)
    console.log(`   Events: ${context.events.length}`)
    console.log(`   Registrations: ${context.registrations.length}`)

    console.log('\n🎉 All done! Use the following credentials to login:')
    console.log('\n📋 Sample Credentials:')
    console.log('   Regular Admin:')
    console.log('     Email: admin1@rowad.com')
    console.log('     Password: Test@1234')
    console.log('\n   Federation Admin:')
    console.log('     Email: fed-admin1@rowad.com')
    console.log('     Password: Test@1234')
    console.log('\n   Federation Editor:')
    console.log('     Email: fed-editor1@rowad.com')
    console.log('     Password: Test@1234')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()
