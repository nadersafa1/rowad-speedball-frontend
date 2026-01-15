'use client'

import GridSingleItem from '@/components/gird-single-item'
import { SinglePageHeader } from '@/components/ui'
import {
  Building2,
  UserCheck,
  Users,
  Calendar,
  Activity,
  Volleyball,
  Trophy,
  ClipboardList,
  UserPlus,
} from 'lucide-react'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import Loading from '@/components/ui/loading'
import { Card, CardContent } from '@/components/ui/card'

const CLUB_ITEMS = [
  {
    href: '/organization',
    title: 'Organization',
    description: 'Manage organization settings and federation membership',
    Icon: Building2,
  },
  {
    href: '/players',
    title: 'Players',
    description: 'View and manage club players',
    Icon: UserCheck,
  },
  {
    href: '/coaches',
    title: 'Coaches',
    description: 'Manage coaching staff and assignments',
    Icon: Users,
  },
  {
    href: '/events',
    title: 'Events',
    description: 'Manage tournaments and competitions',
    Icon: Calendar,
  },
  {
    href: '/sessions',
    title: 'Training Sessions',
    description: 'Schedule and manage training sessions',
    Icon: Activity,
  },
  {
    href: '/tests',
    title: 'Tests',
    description: 'Manage player skill assessments and tests',
    Icon: Volleyball,
  },
  {
    href: '/championships',
    title: 'Championships',
    description: 'View and participate in championship events',
    Icon: Trophy,
  },
  {
    href: '/attendance',
    title: 'Attendance',
    description: 'Track player attendance for sessions and events',
    Icon: ClipboardList,
  },
  {
    href: '/players/season-registration',
    title: 'Season Registration',
    description: 'Register players for federation seasons',
    Icon: UserPlus,
  },
]

const ClubPage = () => {
  const { context, isLoading } = useOrganizationContext()

  if (isLoading) {
    return <Loading />
  }

  // Check authorization
  if (!context.isOwner && !context.isAdmin && !context.isCoach) {
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

  if (!context.organization?.id) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive'>
              No organization associated with your account.
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
        <h1 className='text-3xl font-bold tracking-tight'>Club Management</h1>
        <p className='text-muted-foreground mt-2'>
          Manage your club's players, coaches, events, and activities
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
        {CLUB_ITEMS.map((item) => (
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

export default ClubPage
