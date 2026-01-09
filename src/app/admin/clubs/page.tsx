import { Building2 } from 'lucide-react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { OrganizationRow } from './_components/organization-row'
import { CreateOrganizationDialog } from './_components/create-organization-dialog'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { eq, count, desc, and, not } from 'drizzle-orm'
import { AdminBreadcrumbWrapper } from '../_components/breadcrumb-wrapper'

const OrganizationsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return redirect('/auth/login')
  }

  const context = await getOrganizationContext()
  if (!context.isSystemAdmin) {
    return redirect('/')
  }

  // Get all organizations
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  })

  // Get member counts for each organization
  const organizationsWithCounts = await Promise.all(
    organizations.map(async (org) => {
      const memberCountResult = await db
        .select({ count: count() })
        .from(schema.member)
        .where(
          and(
            eq(schema.member.organizationId, org.id),
            not(eq(schema.member.role, 'super_admin'))
          )
        )

      return {
        ...org,
        memberCount: memberCountResult[0]?.count || 0,
      }
    })
  )

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <AdminBreadcrumbWrapper />

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Building2 className='h-5 w-5' />
                Clubs ({organizations.length})
              </CardTitle>
              <CardDescription>
                Manage clubs and assign admins/coaches
              </CardDescription>
            </div>
            <CreateOrganizationDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizationsWithCounts.map((org) => (
                  <OrganizationRow key={org.id} organization={org} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrganizationsPage
