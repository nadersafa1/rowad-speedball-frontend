'use client'

import Link from 'next/link'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Pencil, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Organization } from 'better-auth/plugins'
import { formatDate } from '@/lib/utils'

interface OrganizationRowProps {
  organization: Organization & { memberCount: number }
}

export const OrganizationRow = ({ organization }: OrganizationRowProps) => {
  const [canDelete, setCanDelete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkPermission = async () => {
      const { data } = await authClient.organization.hasPermission({
        organizationId: organization.id,
        permission: { organization: ['delete'] },
      })
      setCanDelete(data?.success ?? false)
    }
    checkPermission()
  }, [organization.id])

  const deleteOrganization = async () => {
    const res = await authClient.organization.delete({
      organizationId: organization.id,
    })
    if (res.error) {
      toast.error(res.error.message || 'Failed to delete club')
    } else {
      toast.success('Club deleted successfully')
      router.refresh()
    }
  }

  return (
    <TableRow>
      <TableCell className='font-medium'>
        <Link
          href={`/admin/clubs/${organization.id}`}
          className='hover:underline'
        >
          {organization.name}
        </Link>
      </TableCell>
      <TableCell>
        <code className='text-sm bg-muted px-2 py-1 rounded'>
          {organization.slug}
        </code>
      </TableCell>
      <TableCell>
        <Badge variant='secondary'>{organization.memberCount} members</Badge>
      </TableCell>
      <TableCell>
        {formatDate(organization.createdAt)}
      </TableCell>
      <TableCell>
        {canDelete && (
          <Button variant='destructive' onClick={deleteOrganization}>
            <Trash className='size-4' />
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
