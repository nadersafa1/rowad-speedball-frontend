'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Building2 } from 'lucide-react'
import { useOrganization } from '@/hooks/authorization/use-organization'
import Loading from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { JoinFederationDialog } from '@/components/federations/join-federation-dialog'
import { useEffect, useState } from 'react'
import { useFederationClubRequestsStore } from '@/store/federation-club-requests-store'
import { apiClient } from '@/lib/api-client'
import type { FederationClub } from '@/db/schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
// import { useToast } from //toast hook not implemented

const OrganizationPage = () => {
  const { organization, isOwner, isAdmin, isLoading } = useOrganization()
  // const { toast } = useToast()
  const { requests, fetchRequests, deleteRequest } =
    useFederationClubRequestsStore()

  const [federationMembership, setFederationMembership] = useState<
    (FederationClub & { federationName: string | null }) | null
  >(null)
  const [isLoadingMembership, setIsLoadingMembership] = useState(false)

  useEffect(() => {
    if (organization?.id) {
      // Fetch federation membership
      const fetchMembership = async () => {
        setIsLoadingMembership(true)
        try {
          const response = await apiClient.getFederationClubs({
            organizationId: organization?.id!,
            limit: 1,
          })
          if (response.data.length > 0) {
            setFederationMembership(response.data[0])
          }
        } catch (error) {
          console.error('Error fetching federation membership:', error)
        } finally {
          setIsLoadingMembership(false)
        }
      }

      // Fetch pending requests
      fetchRequests({
        organizationId: organization?.id,
        status: 'all',
        sortBy: 'requestedAt',
        sortOrder: 'desc',
        limit: 10,
      })

      fetchMembership()
    }
  }, [organization?.id, fetchRequests])

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequest(requestId)
      console.log('Success:', 'Request cancelled successfully')
    } catch (error) {
      console.error('Error:', '')
    }
  }

  const handleRefresh = () => {
    if (organization?.id) {
      fetchRequests({
        organizationId: organization?.id,
        status: 'all',
        sortBy: 'requestedAt',
        sortOrder: 'desc',
        limit: 10,
      })
    }
  }

  if (isLoading) {
    return <Loading />
  }

  // Only organization owners/admins can access this page
  if (!isOwner && !isAdmin) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent>
            <p className='text-destructive'>
              You do not have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent>
            <p className='text-destructive'>
              No organization associated with your account.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const hasPendingRequest = pendingRequests.length > 0

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader
        icon={Building2}
        title='Organization Settings'
        description='Manage your organization and federation membership'
      />

      <div className='mt-6 space-y-6'>
        {/* Organization Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Your club details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div>
                <span className='text-sm font-medium'>Name:</span>
                <p className='text-lg'>{organization?.name || 'N/A'}</p>
              </div>
              <div>
                <span className='text-sm font-medium'>Slug:</span>
                <p className='text-muted-foreground'>
                  {organization?.slug || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Federation Membership Card */}
        <Card>
          <CardHeader>
            <CardTitle>Federation Membership</CardTitle>
            <CardDescription>
              Join a federation to participate in championship events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMembership ? (
              <Loading />
            ) : federationMembership ? (
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Badge variant='default' className='text-sm'>
                    Member
                  </Badge>
                  <span className='text-lg font-medium'>
                    {federationMembership.federationName ||
                      'Unknown Federation'}
                  </span>
                </div>
                <p className='text-sm text-muted-foreground'>
                  Joined on{' '}
                  {federationMembership.createdAt
                    ? new Date(
                        federationMembership.createdAt
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            ) : hasPendingRequest ? (
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary' className='text-sm'>
                    Request Pending
                  </Badge>
                  <span className='text-sm text-muted-foreground'>
                    Your request to join a federation is being reviewed
                  </span>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  You are not currently a member of any federation.
                </p>
                <JoinFederationDialog onSuccess={handleRefresh} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Federation Requests History Card */}
        {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Federation Requests</CardTitle>
              <CardDescription>
                Your federation membership requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Federation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Responded Date</TableHead>
                    <TableHead>Rejection Reason</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className='font-medium'>
                        {request.federationName || 'Unknown Federation'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'default'
                              : request.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.requestedAt
                          ? new Date(request.requestedAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {request.respondedAt
                          ? new Date(request.respondedAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )
                          : '-'}
                      </TableCell>
                      <TableCell>{request.rejectionReason || '-'}</TableCell>
                      <TableCell className='text-right'>
                        {request.status === 'pending' && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default OrganizationPage
