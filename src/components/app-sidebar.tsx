'use client'

import * as React from 'react'
import { useMemo } from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  Volleyball,
  Table2,
  Trophy,
  UserCheck,
  Calendar,
  ShieldCheck,
  Building2,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { authClient } from '@/lib/auth-client'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const { context } = useOrganizationContext()
  const {
    organization,
    isSystemAdmin,
    isAdmin,
    isOwner,
    isCoach,
    isFederationAdmin,
    isFederationEditor,
  } = context

  const user = session?.user
    ? {
        name: session.user.name || 'User',
        email: session.user.email,
        avatar: session.user.image || '/avatars/default.jpg',
      }
    : {
        name: 'Guest',
        email: 'guest@example.com',
        avatar: '/avatars/default.jpg',
      }

  // Main navigation items (all authenticated users)
  const navMain = useMemo(
    () => [
      {
        title: 'Players',
        url: '/players',
        icon: UserCheck,
      },
      {
        title: 'Tests',
        url: '/tests',
        icon: Volleyball,
      },
      {
        title: 'Events',
        url: '/events',
        icon: Calendar,
      },
    ],
    []
  )

  const federationManagement = useMemo(() => {
    if (!isFederationAdmin && !isFederationEditor) return []

    const items = [
      {
        title: 'Championships',
        url: '/championships',
      },
      ...(isFederationAdmin || isFederationEditor
        ? [
            {
              title: 'Member Clubs',
              url: '/admin/federation-clubs',
            },
            {
              title: 'Federation Players',
              url: '/admin/federation-players',
            },
          ]
        : []),
    ]

    return [
      {
        title: 'Federation Management',
        url: '#',
        icon: Trophy,
        items,
      },
    ]
  }, [isFederationAdmin, isFederationEditor])

  // Team Management section (admins, owners, coaches)
  const teamManagement = useMemo(() => {
    if (!isAdmin && !isOwner && !isCoach) return []

    const items = [
      {
        title: 'Coaches',
        url: '/coaches',
      },
      {
        title: 'Training Sessions',
        url: '/sessions',
      },
      {
        title: 'Attendance',
        url: '/attendance/club',
      },
      ...(isOwner || isAdmin
        ? [
            {
              title: 'Organization',
              url: '/organization',
            },
          ]
        : []),
    ]

    return [
      {
        title: 'Team Management',
        url: '#',
        icon: Trophy,
        items,
      },
    ]
  }, [isAdmin, isOwner, isCoach])

  // Administration section (system admins only)
  const administration = useMemo(() => {
    if (!isSystemAdmin) return []

    const items = [
      {
        title: 'Users',
        url: '/admin/users',
      },
      {
        title: 'Federations',
        url: '/admin/federations',
      },
      {
        title: 'Clubs',
        url: '/admin/clubs',
      },
      {
        title: 'Placement Tiers',
        url: '/admin/placement-tiers',
      },
      {
        title: 'Points Schemas',
        url: '/admin/points-schemas',
      },
    ]

    return [
      {
        title: 'Administration',
        url: '/admin',
        icon: ShieldCheck,
        items,
      },
    ]
  }, [isSystemAdmin])

  const allNavItems = useMemo(
    () => [
      ...navMain,
      ...teamManagement,
      ...federationManagement,
      ...administration,
    ],
    [navMain, teamManagement, federationManagement, administration]
  )

  // Quick actions
  const quickActions = [
    {
      name: 'Create Event',
      url: '/events/create',
      icon: Table2,
    },
  ]

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <Building2 className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {organization?.name || 'Rowad Speedball'}
                  </span>
                  <span className='truncate text-xs'>Club</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={allNavItems} />
        {/* <NavProjects projects={quickActions} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
