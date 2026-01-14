import { SinglePageHeader } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import * as schema from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrganizationContext } from '@/lib/organization-helpers'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SeasonInfo from '@/components/seasons/season-info'
import AgeGroupsManagement from '@/components/seasons/age-groups-management'

const SeasonDetailPage = async ({
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
  if (!context.isFederationAdmin && !context.isFederationEditor && !context.isSystemAdmin) {
    return redirect('/admin/seasons')
  }

  // Get season
  const season = await db.query.seasons.findFirst({
    where: eq(schema.seasons.id, resolvedParams.id),
  })

  if (!season) {
    return redirect('/admin/seasons')
  }

  // Check if user has access to this season's federation
  if (!context.isSystemAdmin && season.federationId !== context.federationId) {
    return redirect('/admin/seasons')
  }

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'closed':
        return 'outline'
      case 'archived':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader backTo='/admin/seasons' />

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>{season.name}</CardTitle>
              <div className='flex items-center gap-2 mt-2'>
                <span className='text-sm text-muted-foreground'>
                  {season.startYear}-{season.endYear}
                </span>
                <Badge variant={getStatusVariant(season.status)}>
                  {season.status.charAt(0).toUpperCase() + season.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='info' className='w-full'>
            <TabsList>
              <TabsTrigger value='info'>Season Info</TabsTrigger>
              <TabsTrigger value='age-groups'>Age Groups</TabsTrigger>
              <TabsTrigger value='registrations'>Registrations</TabsTrigger>
            </TabsList>
            <TabsContent value='info' className='mt-4'>
              <SeasonInfo season={season} />
            </TabsContent>
            <TabsContent value='age-groups' className='mt-4'>
              <AgeGroupsManagement seasonId={season.id} />
            </TabsContent>
            <TabsContent value='registrations' className='mt-4'>
              <div className='rounded-md border p-8 text-center text-muted-foreground'>
                <p>Registration management coming soon...</p>
                <p className='text-sm mt-2'>
                  This will show all player registrations for this season
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default SeasonDetailPage
