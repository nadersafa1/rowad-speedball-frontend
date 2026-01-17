'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Organization } from 'better-auth/plugins'
import { formatDate } from '@/lib/utils'

interface OrganizationInfoProps {
  organization: Organization
}

export const OrganizationInfo = ({
  organization,
}: OrganizationInfoProps) => {
  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Club Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <div>
            <span className='text-sm font-medium text-muted-foreground'>
              Name:
            </span>
            <p className='text-sm'>{organization.name}</p>
          </div>
          <div>
            <span className='text-sm font-medium text-muted-foreground'>
              Slug:
            </span>
            <p className='text-sm'>
              <code className='bg-muted px-2 py-1 rounded text-xs'>
                {organization.slug}
              </code>
            </p>
          </div>
          <div>
            <span className='text-sm font-medium text-muted-foreground'>
              Created:
            </span>
            <p className='text-sm'>{formatDate(organization.createdAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
