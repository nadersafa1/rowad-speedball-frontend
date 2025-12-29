'use client'

import * as React from 'react'
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
  const { organization, isSystemAdmin, isAdmin, isOwner, isCoach } = context

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
  const navMain = [
    {
      title: 'Attendance',
      url: '/attendance/club',
      icon: ClipboardCheck,
      isActive: false,
    },
    {
      title: 'Players',
      url: '/players',
      icon: UserCheck,
      isActive: false,
    },
    {
      title: 'Tests',
      url: '/tests',
      icon: Volleyball,
      isActive: false,
    },
    {
      title: 'Events',
      url: '/events',
      icon: Calendar,
      isActive: false,
    },
  ]

  // Team Management section (admins, owners, coaches)
  const teamManagement =
    isSystemAdmin || isAdmin || isOwner || isCoach
      ? [
          {
            title: 'Team Management',
            url: '#',
            icon: Trophy,
            isActive: false,
            items: [
              {
                title: 'Coaches',
                url: '/coaches',
              },
              {
                title: 'Training Sessions',
                url: '/sessions',
              },
            ],
          },
        ]
      : []

  // Administration section (system admins only)
  const administration = isSystemAdmin
    ? [
        {
          title: 'Administration',
          url: '/admin',
          icon: ShieldCheck,
          isActive: false,
          items: [
            {
              title: 'Admin Panel',
              url: '/admin',
            },
            {
              title: 'Federations',
              url: '/admin/federations',
            },
            {
              title: 'Clubs',
              url: '/admin/clubs',
            },
          ],
        },
      ]
    : []

  const allNavItems = [...navMain, ...teamManagement, ...administration]

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
