/**
 * Migration script to add all app admins to existing organizations
 * This ensures app admins can see all organizations via useListOrganizations
 * 
 * Usage: npx tsx src/scripts/add-admins-to-existing-organizations.ts
 */

import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq, and } from 'drizzle-orm'

async function addAdminsToExistingOrganizations() {
  try {
    console.log('Starting migration: Adding app admins to existing organizations...')

    // Get all organizations
    const organizations = await db.query.organization.findMany({
      orderBy: (orgs, { asc }) => [asc(orgs.createdAt)],
    })

    console.log(`Found ${organizations.length} organizations`)

    if (organizations.length === 0) {
      console.log('No organizations found. Nothing to do.')
      return
    }

    // Get all app admin users
    const adminUsers = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.role, 'admin'))

    console.log(`Found ${adminUsers.length} app admin users`)

    if (adminUsers.length === 0) {
      console.log('No app admins found. Nothing to do.')
      return
    }

    let totalAdded = 0
    let totalSkipped = 0

    // For each organization, add app admins if they're not already members
    for (const organization of organizations) {
      console.log(`\nProcessing organization: ${organization.name} (${organization.id})`)

      // Get existing members of this organization
      const existingMembers = await db
        .select({ userId: schema.member.userId })
        .from(schema.member)
        .where(eq(schema.member.organizationId, organization.id))

      const existingMemberIds = new Set(existingMembers.map((m) => m.userId))

      // Find admins who are not yet members
      const adminsToAdd = adminUsers.filter(
        (admin) => !existingMemberIds.has(admin.id)
      )

      if (adminsToAdd.length === 0) {
        console.log(`  All app admins are already members. Skipping.`)
        totalSkipped += adminUsers.length
        continue
      }

      // Add admins as organization admins
      for (const adminUser of adminsToAdd) {
        await db.insert(schema.member).values({
          organizationId: organization.id,
          userId: adminUser.id,
          role: 'admin',
          createdAt: new Date(),
        })
        console.log(`  Added ${adminUser.email} as admin`)
        totalAdded++
      }

      if (existingMemberIds.size > 0) {
        totalSkipped += adminUsers.length - adminsToAdd.length
      }
    }

    console.log(`\nMigration complete!`)
    console.log(`  Total members added: ${totalAdded}`)
    console.log(`  Total members skipped (already existed): ${totalSkipped}`)
  } catch (error) {
    console.error('Error during migration:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  addAdminsToExistingOrganizations()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed:', error)
      process.exit(1)
    })
}

export { addAdminsToExistingOrganizations }

