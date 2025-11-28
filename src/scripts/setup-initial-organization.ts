/**
 * Setup script to create the initial Rowad organization
 * Run this script after migrations to set up the first organization
 * 
 * Usage: npx tsx src/scripts/setup-initial-organization.ts
 */

import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

async function setupInitialOrganization() {
  try {
    console.log('Setting up initial Rowad organization...')

    // Check if organization already exists
    const existingOrg = await db
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.slug, 'rowad'))
      .limit(1)

    if (existingOrg.length > 0) {
      console.log('Rowad organization already exists:', existingOrg[0].id)
      return existingOrg[0]
    }

    // Create Rowad organization
    const orgId = randomUUID()
    const [organization] = await db
      .insert(schema.organization)
      .values({
        id: orgId,
        name: 'Rowad',
        slug: 'rowad',
        createdAt: new Date(),
      })
      .returning()

    console.log('Created Rowad organization:', organization.id)

    // Get all admin users
    const adminUsers = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.role, 'admin'))

    console.log(`Found ${adminUsers.length} admin users`)

    // Add admin users to organization as owners
    for (const adminUser of adminUsers) {
      const memberId = randomUUID()
      await db.insert(schema.member).values({
        id: memberId,
        organizationId: orgId,
        userId: adminUser.id,
        role: 'owner',
        createdAt: new Date(),
      })
      console.log(`Added ${adminUser.email} as owner`)
    }

    console.log('Setup complete!')
    return organization
  } catch (error) {
    console.error('Error setting up organization:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  setupInitialOrganization()
    .then(() => {
      console.log('Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Failed:', error)
      process.exit(1)
    })
}

export { setupInitialOrganization }

