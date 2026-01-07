'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Building2, Users } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useFederationClubRequestsStore } from '@/store/federation-club-requests-store'
import Loading from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { useToast } from //toast hook not implemented
import { apiClient } from '@/lib/api-client'
import type { FederationClub } from '@/db/schema'

const FederationClubsPage = () => {
  const { context, isLoading: isContextLoading } = useOrganizationContext()
  // const { toast } = useToast()
  const {
    requests,
    isLoading: isRequestsLoading,
    fetchRequests,
    updateRequestStatus,
    clearError,
  } = useFederationClubRequestsStore()

  const [memberClubs, setMemberClubs] = useState<
    Array<FederationClub & { organizationName: string | null }>
  >([])
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  )
  const [rejectionReason, setRejectionReason] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  // Fetch pending requests and member clubs
  const fetchData = useCallback(async () => {
    if (!context.federationId) return

    // Fetch pending requests
    await fetchRequests({
      federationId: context.federationId,
      status:
        activeTab === 'all'
          ? 'all'
          : (activeTab as 'pending' | 'approved' | 'rejected'),
      sortBy: 'requestedAt',
      sortOrder: 'desc',
      limit: 100,
    })

    // Fetch member clubs
    if (activeTab === 'members') {
      setIsLoadingClubs(true)
      try {
        const response = await apiClient.getFederationClubs({
          federationId: context.federationId,
          limit: 100,
        })
        setMemberClubs(response.data)
      } catch (error) {
        console.error('Error:', 'Failed to fetch member clubs')
      } finally {
        setIsLoadingClubs(false)
      }
    }
  }, [context.federationId, activeTab, fetchRequests])

  useEffect(() => {
    if (context.federationId) {
      fetchData()
    }
  }, [context.federationId, fetchData])

  const handleApprove = async (requestId: string) => {
    try {
      await updateRequestStatus(requestId, { status: 'approved' })
      console.log('Success:', 'Club request approved successfully')
      fetchData()
    } catch (error) {
      console.error('Error:', '')
    }
  }

  const handleReject = async () => {
    if (!selectedRequestId || !rejectionReason.trim()) {
      console.error('Error:', 'Please provide a rejection reason')
      return
    }

    try {
      await updateRequestStatus(selectedRequestId, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      })
      console.log('Success:', 'Club request rejected')
      setRejectDialogOpen(false)
      setSelectedRequestId(null)
      setRejectionReason('')
      fetchData()
    } catch (error) {
      console.error('Error:', '')
    }
  }

  const openRejectDialog = (requestId: string) => {
    setSelectedRequestId(requestId)
    setRejectDialogOpen(true)
  }

  if (isContextLoading) {
    return <Loading />
  }

  // Only federation admins can access this page
  if (!context.isFederationAdmin && !context.isSystemAdmin) {
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

  if (!context.federationId && !context.isSystemAdmin) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent>
            <p className='text-destructive'>
              No federation associated with your account.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const processedRequests = requests.filter((r) => r.status !== 'pending')

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader
        icon={Building2}
        title='Federation Clubs'
        description='Manage member clubs and club membership requests'
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className='mt-6'>
        <TabsList>
          <TabsTrigger value='pending'>
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='members'>Member Clubs</TabsTrigger>
          <TabsTrigger value='history'>Request History</TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value='pending'>
          <Card>
            <CardHeader>
              <CardTitle>Pending Club Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isRequestsLoading ? (
                <Loading />
              ) : pendingRequests.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>
                  No pending club requests
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className='font-medium'>
                          {request.organizationName || 'Unknown Club'}
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
                        <TableCell className='text-right space-x-2'>
                          <Button
                            size='sm'
                            variant='default'
                            onClick={() => handleApprove(request.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => openRejectDialog(request.id)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Member Clubs Tab */}
        <TabsContent value='members'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Member Clubs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingClubs ? (
                <Loading />
              ) : memberClubs.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>
                  No member clubs yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Joined Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberClubs.map((club) => (
                      <TableRow key={club.id}>
                        <TableCell className='font-medium'>
                          {club.organizationName || 'Unknown Club'}
                        </TableCell>
                        <TableCell>
                          {club.createdAt
                            ? new Date(club.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Request History Tab */}
        <TabsContent value='history'>
          <Card>
            <CardHeader>
              <CardTitle>Request History</CardTitle>
            </CardHeader>
            <CardContent>
              {isRequestsLoading ? (
                <Loading />
              ) : processedRequests.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>
                  No request history
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead>Responded Date</TableHead>
                      <TableHead>Responded By</TableHead>
                      <TableHead>Rejection Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className='font-medium'>
                          {request.organizationName || 'Unknown Club'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === 'approved'
                                ? 'default'
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
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {request.respondedByName || 'N/A'}
                        </TableCell>
                        <TableCell>{request.rejectionReason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Club Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this club&apos;s request to
              join the federation.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='rejectionReason'>Rejection Reason</Label>
              <Textarea
                id='rejectionReason'
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder='Enter reason for rejection...'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setRejectDialogOpen(false)
                setSelectedRequestId(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleReject}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FederationClubsPage
