import { SinglePageHeader } from '@/components/ui'
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
import * as schema from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq, inArray } from 'drizzle-orm'
import { Users } from 'lucide-react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SetupOrganizationButton } from './_components/setup-organization-button'
import { UserRow } from './_components/user-row'

const UsersPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return redirect('/auth/login')
  }

  const hasPermission = await auth.api.userHasPermission({
    headers: await headers(),
    body: { permission: { user: ['list'] } },
  })

  if (!hasPermission.success) {
    return redirect('/')
  }

  const users = await auth.api.listUsers({
    headers: await headers(),
    query: {
      limit: 100,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    },
  })

  // Get organization memberships for all users
  const userIds = users.users.map((u) => u.id)
  const memberships =
    userIds.length > 0
      ? await db
          .select({
            userId: schema.member.userId,
            organizationId: schema.member.organizationId,
            role: schema.member.role,
            organization: schema.organization,
          })
          .from(schema.member)
          .innerJoin(
            schema.organization,
            eq(schema.member.organizationId, schema.organization.id)
          )
          .where(inArray(schema.member.userId, userIds))
      : []

  // Create a map of userId -> membership
  const membershipMap = new Map(memberships.map((m) => [m.userId, m]))

  // Check if organization exists
  const organizations = await db.select().from(schema.organization).limit(1)
  const hasOrganization = organizations.length > 0

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader />

      {!hasOrganization && (
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-semibold'>Setup Required</h3>
                <p className='text-sm text-muted-foreground'>
                  Create the initial Rowad organization to enable user
                  management and linking.
                </p>
              </div>
              <SetupOrganizationButton />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Users ({users.total})
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.users.map((user) => {
                  const membership = membershipMap.get(user.id)
                  return (
                    <UserRow
                      key={user.id}
                      selfId={session.user.id}
                      user={user}
                      membership={membership}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UsersPage
