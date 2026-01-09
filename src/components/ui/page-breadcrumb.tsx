'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'
import BackButton from './back-button'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[]
  currentPageLabel?: string
}

const routeLabelMap: Record<string, string> = {
  events: 'Events',
  players: 'Players',
  coaches: 'Coaches',
  tests: 'Tests',
  sessions: 'Sessions',
  matches: 'Matches',
  admin: 'Admin',
  clubs: 'Clubs',
  federations: 'Federations',
  users: 'Users',
  championships: 'Championships',
  profile: 'Profile',
  attendance: 'Attendance',
}

const PageBreadcrumb = ({ items, currentPageLabel }: PageBreadcrumbProps) => {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) {
      return items
    }

    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Build breadcrumbs from segments (don't include Home - it's in NavigationButtonGroup)
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Check if segment is an ID (UUID or numeric)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment
        )
      const isNumeric = /^\d+$/.test(segment)
      const isID = isUUID || isNumeric
      const isLastSegment = index === segments.length - 1

      // Handle ID segments
      if (isID && isLastSegment) {
        // Only show ID if we have a custom label, otherwise skip it
        if (currentPageLabel) {
          breadcrumbs.push({ label: currentPageLabel })
        }
        // If no label, skip the ID segment entirely
      } else if (!isID) {
        // Regular segment (not an ID)
        const label =
          routeLabelMap[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1)
        const isLast = isLastSegment && !isID
        breadcrumbs.push({
          label,
          href: isLast && !currentPageLabel ? undefined : currentPath,
        })
      }
      // If it's an ID in the middle of the path (not last), skip it
    })

    return breadcrumbs
  }

  const breadcrumbItems = generateBreadcrumbs()

  return (
    <div className='flex items-center gap-2'>
      <BackButton />
      {breadcrumbItems.length > 0 && (
        <Breadcrumb className='hidden md:flex'>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1

              return (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </div>
  )
}

export default PageBreadcrumb
