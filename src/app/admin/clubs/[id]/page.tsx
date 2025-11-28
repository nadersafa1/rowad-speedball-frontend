import { ArrowLeft } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { OrganizationInfo } from './_components/organization-info'
import { UnassignedPlayersList } from './_components/unassigned-players-list'
import { UnassignedCoachesList } from './_components/unassigned-coaches-list'
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
    <div className='mx-auto container my-6 px-4'>
      <Link href='/admin/clubs' className='inline-flex items-center mb-6'>
        <ArrowLeft className='size-4 mr-2' />
        Back to Clubs
      </Link>

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
