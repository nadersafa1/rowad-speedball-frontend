'use client'

import { PageBreadcrumb } from '@/components/ui'

interface BreadcrumbWrapperProps {
  currentPageLabel: string
}

export const BreadcrumbWrapper = ({
  currentPageLabel,
}: BreadcrumbWrapperProps) => {
  return (
    <div className='mb-6'>
      <PageBreadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Clubs', href: '/admin/clubs' },
          { label: currentPageLabel },
        ]}
      />
    </div>
  )
}

