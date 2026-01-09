import { SinglePageHeader } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as schema from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { OrganizationInfo } from './_components/organization-info'
import { UnassignedCoachesList } from './_components/unassigned-coaches-list'
import { UnassignedPlayersList } from './_components/unassigned-players-list'
import { UnassignedUsersList } from './_components/unassigned-users-list'

const OrganizationDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const resolvedParams = await params
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

  // Get organization
  const organization = await db.query.organization.findFirst({
    where: eq(schema.organization.id, resolvedParams.id),
  })

  if (!organization) {
    return redirect('/admin/clubs')
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader backTo='/admin/clubs' />

      <Card>
        <CardHeader>
          <CardTitle>{organization.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='info' className='w-full'>
            <TabsList>
              <TabsTrigger value='info'>Info</TabsTrigger>
              <TabsTrigger value='players'>Unassigned Players</TabsTrigger>
              <TabsTrigger value='coaches'>Unassigned Coaches</TabsTrigger>
              <TabsTrigger value='users'>Unassigned Users</TabsTrigger>
            </TabsList>
            <TabsContent value='info' className='mt-4'>
              <OrganizationInfo organization={organization} />
            </TabsContent>
            <TabsContent value='players' className='mt-4'>
              <UnassignedPlayersList organizationId={organization.id} />
            </TabsContent>
            <TabsContent value='coaches' className='mt-4'>
              <UnassignedCoachesList organizationId={organization.id} />
            </TabsContent>
            <TabsContent value='users' className='mt-4'>
              <UnassignedUsersList organizationId={organization.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrganizationDetailPage
