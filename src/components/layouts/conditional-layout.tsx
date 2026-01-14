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
import { apiClient } from '@/lib/api-client'
import ThemeToggle from '../ui/theme-toggle'

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

  // State for entity names cache (for rendering)
  const [entityNames, setEntityNames] = React.useState<Record<string, string>>(
    {}
  )
  const [loadingEntities, setLoadingEntities] = React.useState<Set<string>>(
    new Set()
  )

  // Refs to track entity names and loading entities without triggering re-renders
  const entityNamesRef = React.useRef<Record<string, string>>({})
  const loadingEntitiesRef = React.useRef<Set<string>>(new Set())

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

  // Fetch entity names for IDs in the path
  React.useEffect(() => {
    if (!pathname || isLoading) return

    const paths = pathname.split('/').filter(Boolean)

    paths.forEach((path, index) => {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          path
        )
      const isNumeric = /^\d+$/.test(path)
      const isID = isUUID || isNumeric

      if (isID && index > 0) {
        const prevSegment = paths[index - 1]

        // Skip if already have name or currently loading (check refs)
        if (
          entityNamesRef.current[path] ||
          loadingEntitiesRef.current.has(path)
        ) {
          return
        }

        // Update ref and state for loading
        loadingEntitiesRef.current.add(path)
        setLoadingEntities((prev) => new Set(prev).add(path))

        const fetchEntityName = async () => {
          try {
            let name: string | null = null

            switch (prevSegment) {
              case 'championships': {
                const championship = (await apiClient.getChampionship(
                  path
                )) as { name?: string } | null
                name = championship?.name || null
                break
              }

              case 'edition': {
                const edition = (await apiClient.getChampionshipEdition(
                  path
                )) as {
                  championshipName?: string | null
                  year?: number
                } | null
                if (edition) {
                  name = edition.championshipName || null
                }
                break
              }

              case 'events': {
                const event = (await apiClient.getEvent(path)) as {
                  name?: string
                } | null
                name = event?.name || null
                break
              }

              case 'players': {
                const player = (await apiClient.getPlayer(path)) as {
                  name?: string
                } | null
                name = player?.name || null
                break
              }

              case 'coaches': {
                const coach = (await apiClient.getCoach(path)) as {
                  name?: string
                } | null
                name = coach?.name || null
                break
              }

              case 'sessions': {
                const session = (await apiClient.getTrainingSession(path)) as {
                  name?: string
                } | null
                name = session?.name || null
                break
              }

              default:
                // Unknown entity type, skip
                loadingEntitiesRef.current.delete(path)
                setLoadingEntities((prev) => {
                  const next = new Set(prev)
                  next.delete(path)
                  return next
                })
                return
            }

            if (name) {
              // Update ref and state
              entityNamesRef.current[path] = name
              setEntityNames((prev) => ({ ...prev, [path]: name! }))
            }
          } catch (error) {
            console.error(`Failed to fetch ${prevSegment} ${path}:`, error)
          } finally {
            // Update ref and state
            loadingEntitiesRef.current.delete(path)
            setLoadingEntities((prev) => {
              const next = new Set(prev)
              next.delete(path)
              return next
            })
          }
        }

        fetchEntityName()
      }
    })
  }, [pathname, isLoading])

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
      // Check if segment is an ID (UUID or numeric)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          path
        )
      const isNumeric = /^\d+$/.test(path)
      const isID = isUUID || isNumeric

      currentPath += `/${path}`

      if (isID) {
        // Show entity name if available, otherwise show "Loading..." or skip
        const entityName = entityNames[path]
        if (entityName) {
          breadcrumbs.push({
            label: entityName,
            href: currentPath,
            isLast: index === paths.length - 1,
          })
        } else if (loadingEntities.has(path)) {
          breadcrumbs.push({
            label: 'Loading...',
            href: currentPath,
            isLast: index === paths.length - 1,
          })
        }
        // If not loading and no name, skip (fallback to old behavior)
      } else {
        const label = path
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        breadcrumbs.push({
          label,
          href: currentPath,
          isLast: index === paths.length - 1,
        })
      }
    })

    return breadcrumbs
  }

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

  if (showSidebar) {
    const breadcrumbs = generateBreadcrumbs()

    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center border-b px-4 justify-between'>
            <div className='flex items-center gap-2'>
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
            </div>
            <ThemeToggle />
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
