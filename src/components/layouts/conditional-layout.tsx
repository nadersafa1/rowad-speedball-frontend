'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import Header from '@/components/navigation/header'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { authClient } from '@/lib/auth-client'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const { context, isLoading: isContextLoading } = useOrganizationContext()
  const {
    isSystemAdmin,
    isAdmin,
    isOwner,
    isCoach,
    isFederationAdmin,
    isFederationEditor,
  } = context
  const pathname = usePathname()

  // Wait for both session and context to load
  const isLoading = isSessionPending || isContextLoading

  // Show sidebar for admin users
  const showSidebar =
    session?.user &&
    (isSystemAdmin ||
      isAdmin ||
      isOwner ||
      isCoach ||
      isFederationAdmin ||
      isFederationEditor)

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          <p className='text-sm text-muted-foreground'>Loading...</p>
        </div>
      </div>
    )
  }

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: Array<{
      label: string
      href: string
      isLast?: boolean
    }> = [{ label: 'Home', href: '/', isLast: false }]

    let currentPath = ''
    paths.forEach((path, index) => {
      currentPath += `/${path}`
      const label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === paths.length - 1,
      })
    })

    return breadcrumbs
  }

  if (showSidebar) {
    const breadcrumbs = generateBreadcrumbs()

    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className='flex flex-1 flex-col gap-4 p-4 pt-0'>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Default layout with header for players and unauthenticated users
  return (
    <>
      <Header />
      <main className='min-h-[90dvh]'>{children}</main>
    </>
  )
}
