'use client'

import GridSingleItem from '@/components/gird-single-item'
import { SinglePageHeader } from '@/components/ui'
import { Building2, Calendar, ClipboardCheck, Trophy, Settings } from 'lucide-react'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import Loading from '@/components/ui/loading'
import { Card, CardContent } from '@/components/ui/card'

const FEDERATION_ITEMS = [
  {
    href: '/admin/federation-clubs',
    title: 'Member Clubs',
    description: 'Manage club membership requests and member clubs',
    Icon: Building2,
  },
  {
    href: '/admin/seasons',
    title: 'Seasons',
    description: 'Manage federation seasons and age groups',
    Icon: Calendar,
  },
  {
    href: '/admin/season-registrations',
    title: 'Season Registrations',
    description: 'Review and approve player season registrations',
    Icon: ClipboardCheck,
  },
  {
    href: '/championships',
    title: 'Championships',
    description: 'Manage championship events and editions',
    Icon: Trophy,
  },
  {
    href: '/admin/federation-settings',
    title: 'Federation Settings',
    description: 'View and edit federation information',
    Icon: Settings,
  },
]

const FederationPage = () => {
  const { context, isLoading } = useOrganizationContext()

  if (isLoading) {
    return <Loading />
  }

  // Check authorization
  if (!context.isFederationAdmin && !context.isFederationEditor && !context.isSystemAdmin) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive'>
              You do not have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!context.federationId && !context.isSystemAdmin) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive'>
              No federation associated with your account.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader />
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Federation Management</h1>
        <p className='text-muted-foreground mt-2'>
          Manage your federation, clubs, seasons, and championships
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
        {FEDERATION_ITEMS.map((item) => (
          <GridSingleItem
            key={item.href}
            href={item.href}
            title={item.title}
            description={item.description}
            Icon={item.Icon}
          />
        ))}
      </div>
    </div>
  )
}

export default FederationPage
