'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Building2, Users } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useFederationPlayerRequestsStore } from '@/store/federation-player-requests-store'
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
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

const FederationPlayersPage = () => {
  const { context, isLoading: isContextLoading } = useOrganizationContext()
  const {
    requests,
    isLoading: isRequestsLoading,
    fetchRequests,
    updateRequestStatus,
    clearError,
  } = useFederationPlayerRequestsStore()

  const [memberPlayers, setMemberPlayers] = useState<any[]>([])
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  // Fetch pending requests and member players
  const fetchData = useCallback(async () => {
    if (!context.federationId) return

    // Always fetch requests for pending and history tabs
    if (activeTab === 'pending' || activeTab === 'history') {
      await fetchRequests({
        federationId: context.federationId,
        status: activeTab === 'pending' ? 'pending' : 'all',
        sortBy: 'requestedAt',
        sortOrder: 'desc',
        limit: 100,
      })
    }

    // Fetch member players
    if (activeTab === 'members') {
      setIsLoadingClubs(true)
      try {
        const response = await apiClient.getFederationPlayers({
          federationId: context.federationId,
          limit: 100,
        })
        setMemberPlayers(response.data || [])
      } catch (error) {
        console.error('Error:', 'Failed to fetch member players', error)
        setMemberPlayers([])
      } finally {
        setIsLoadingClubs(false)
      }
    }
  }, [context.federationId, activeTab, fetchRequests])

  useEffect(() => {
    if (context.federationId) {
      fetchData()
    }
  }, [context.federationId, activeTab, fetchData])

  const handleApprove = async () => {
    if (!selectedRequestId || !registrationNumber.trim()) {
      toast.error('Please provide a registration number')
      return
    }

    try {
      await updateRequestStatus(selectedRequestId, {
        status: 'approved',
        federationRegistrationNumber: registrationNumber.trim(),
      })
      toast.success('Player request approved successfully')
      setApproveDialogOpen(false)
      setSelectedRequestId(null)
      setRegistrationNumber('')
      fetchData()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to approve request. Please try again.'
      )
    }
  }

  const handleReject = async () => {
    if (!selectedRequestId || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      await updateRequestStatus(selectedRequestId, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      })
      toast.success('Player request rejected')
      setRejectDialogOpen(false)
      setSelectedRequestId(null)
      setRejectionReason('')
      fetchData()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to reject request. Please try again.'
      )
    }
  }

  const openApproveDialog = (requestId: string) => {
    setSelectedRequestId(requestId)
    setApproveDialogOpen(true)
  }

  const openRejectDialog = (requestId: string) => {
    setSelectedRequestId(requestId)
    setRejectDialogOpen(true)
  }

  if (isContextLoading) {
    return <Loading />
  }

  // Only federation admins/editors can access this page
  if (
    !context.isFederationAdmin &&
    !context.isFederationEditor &&
    !context.isSystemAdmin
  ) {
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
  const processedRequests = requests.filter(
    (r) => r.status === 'approved' || r.status === 'rejected'
  )

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader
        icon={Building2}
        title='Federation Players'
        description='Manage member players and player membership requests'
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
          <TabsTrigger value='members'>Member Players</TabsTrigger>
          <TabsTrigger value='history'>Request History</TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value='pending'>
          <Card>
            <CardHeader>
              <CardTitle>Pending Player Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isRequestsLoading ? (
                <Loading />
              ) : pendingRequests.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>
                  No pending player requests
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className='font-medium'>
                          {request.playerName || 'Unknown Player'}
                        </TableCell>
                        <TableCell>
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
                            onClick={() => openApproveDialog(request.id)}
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

        {/* Member Players Tab */}
        <TabsContent value='members'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Member Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingClubs ? (
                <Loading />
              ) : memberPlayers.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>
                  No member players yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>Registration Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className='font-medium'>
                          {player.playerName || 'Unknown Player'}
                        </TableCell>
                        <TableCell>
                          {player.organizationName || 'Unknown Club'}
                        </TableCell>
                        <TableCell>{player.federationRegistrationNumber}</TableCell>
                        <TableCell>{player.registrationYear}</TableCell>
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
                      <TableHead>Player Name</TableHead>
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
                          {request.playerName || 'Unknown Player'}
                        </TableCell>
                        <TableCell>
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Player Request</DialogTitle>
            <DialogDescription>
              Please provide a federation registration number for this player.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='registrationNumber'>Registration Number</Label>
              <Input
                id='registrationNumber'
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder='Enter registration number (e.g., ESF-2025-0001)'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setApproveDialogOpen(false)
                setSelectedRequestId(null)
                setRegistrationNumber('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={!registrationNumber.trim()}>
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Player Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this player&apos;s request to
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

export default FederationPlayersPage
