'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { Settings, Building2, Users, Calendar, Clock } from 'lucide-react'
import { useFederation } from '@/hooks/authorization/use-federation'
import Loading from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFederationsStore } from '@/store/federations-store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface FederationStats {
  memberClubsCount: number
  activeSeasonsCount: number
  pendingRequestsCount: number
}

const FederationSettingsPage = () => {
  const { federationId, isFederationAdmin, isFederationEditor, isSystemAdmin, isLoading: isContextLoading } = useFederation()
  const {
    selectedFederation,
    isLoading: isFederationLoading,
    fetchFederation,
    updateFederation,
  } = useFederationsStore()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [stats, setStats] = useState<FederationStats>({
    memberClubsCount: 0,
    activeSeasonsCount: 0,
    pendingRequestsCount: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  useEffect(() => {
    if (federationId) {
      fetchFederation(federationId)
      fetchStats()
    }
  }, [federationId, fetchFederation])

  useEffect(() => {
    if (selectedFederation) {
      setFormData({
        name: selectedFederation.name || '',
        description: selectedFederation.description || '',
      })
    }
  }, [selectedFederation])

  const fetchStats = async () => {
    if (!federationId) return

    setIsLoadingStats(true)
    try {
      // Fetch member clubs count
      const clubsResponse = await apiClient.getFederationClubs({
        federationId: federationId,
        limit: 1,
      })

      // Fetch pending requests count
      const requestsResponse = await apiClient.getFederationClubRequests({
        federationId: federationId,
        status: 'pending',
        limit: 1,
      })

      // Fetch active seasons count
      const seasonsResponse = await apiClient.getSeasons({
        federationId: federationId,
        limit: 100, // Get all seasons to count active ones
      })

      const now = new Date()
      const activeSeasons = seasonsResponse.data.filter((season) => {
        const startDate = new Date(season.seasonStartDate)
        const endDate = new Date(season.seasonEndDate)
        return startDate <= now && endDate >= now
      })

      setStats({
        memberClubsCount: clubsResponse.totalItems || 0,
        activeSeasonsCount: activeSeasons.length,
        pendingRequestsCount: requestsResponse.totalItems || 0,
      })
    } catch (error) {
      console.error('Error fetching federation stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleEditClick = () => {
    if (selectedFederation) {
      setFormData({
        name: selectedFederation.name || '',
        description: selectedFederation.description || '',
      })
      setEditDialogOpen(true)
    }
  }

  const handleSave = async () => {
    if (!federationId) return

    try {
      await updateFederation(federationId, formData)
      setEditDialogOpen(false)
      toast.success('Federation updated successfully')
      fetchFederation(federationId)
    } catch (error) {
      toast.error('Failed to update federation')
      console.error('Error updating federation:', error)
    }
  }

  if (isContextLoading || isFederationLoading) {
    return <Loading />
  }

  // Check authorization
  if (!isFederationAdmin && !isFederationEditor && !isSystemAdmin) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive'>
              You do not have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!federationId && !isSystemAdmin) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive'>
              No federation associated with your account.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedFederation) {
    return <Loading />
  }

  const canEdit = isFederationAdmin || isSystemAdmin

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader
        icon={Settings}
        title='Federation Settings'
        description='View and manage your federation information'
      />

      <div className='mt-6 space-y-6'>
        {/* Federation Information Card */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Federation Information</CardTitle>
                <CardDescription>Basic federation details</CardDescription>
              </div>
              {canEdit && (
                <Button onClick={handleEditClick}>Edit</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Name</span>
                <p className='text-lg font-semibold'>{selectedFederation.name}</p>
              </div>
              {selectedFederation.description && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>Description</span>
                  <p className='text-base'>{selectedFederation.description}</p>
                </div>
              )}
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Created</span>
                <p className='text-base'>
                  {selectedFederation.createdAt
                    ? new Date(selectedFederation.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Member Clubs</CardTitle>
              <Building2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className='text-2xl font-bold'>-</div>
              ) : (
                <div className='text-2xl font-bold'>{stats.memberClubsCount}</div>
              )}
              <p className='text-xs text-muted-foreground'>
                Total clubs in federation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active Seasons</CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className='text-2xl font-bold'>-</div>
              ) : (
                <div className='text-2xl font-bold'>{stats.activeSeasonsCount}</div>
              )}
              <p className='text-xs text-muted-foreground'>
                Currently active seasons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pending Requests</CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className='text-2xl font-bold'>-</div>
              ) : (
                <div className='text-2xl font-bold'>{stats.pendingRequestsCount}</div>
              )}
              <p className='text-xs text-muted-foreground'>
                Club requests awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Federation</DialogTitle>
            <DialogDescription>
              Update federation information
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name *</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='Enter federation name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter federation description'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FederationSettingsPage
