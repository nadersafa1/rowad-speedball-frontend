'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/ui'
import { ClipboardCheck, Calendar } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useRoles } from '@/hooks/authorization/use-roles'
import { useFederation } from '@/hooks/authorization/use-federation'
import { UnauthorizedAccess } from '@/components/shared/unauthorized-access'
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
import { Dialog } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import {
  ApproveRegistrationDialog,
  RejectRegistrationDialog,
} from '@/components/seasons/registration-action-dialogs'
import { Season } from '@/db/schema'

export default function SeasonRegistrationsPage() {
  const {
    isFederationAdmin,
    isFederationEditor,
    isSystemAdmin,
    isLoading: rolesLoading,
  } = useRoles()
  const { federationId } = useFederation()

  const [registrations, setRegistrations] = useState<any[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [ageGroups, setAgeGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all')
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>('all')

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)

  const hasAccess = isFederationAdmin || isFederationEditor || isSystemAdmin

  // Fetch registrations
  const fetchRegistrations = useCallback(async () => {
    if (!federationId) return

    setIsLoading(true)
    try {
      const statusFilter =
        activeTab === 'pending'
          ? 'pending'
          : activeTab === 'approved'
          ? 'approved'
          : activeTab === 'rejected'
          ? 'rejected'
          : undefined

      const response = await apiClient.getSeasonPlayerRegistrations({
        status: statusFilter,
        seasonId: selectedSeasonId !== 'all' ? selectedSeasonId : undefined,
        seasonAgeGroupId:
          selectedAgeGroupId !== 'all' ? selectedAgeGroupId : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 100,
      })

      // Filter results locally if search query is provided
      let filteredData = response.data || []
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredData = filteredData.filter((reg: any) =>
          reg.playerName?.toLowerCase().includes(query)
        )
      }
      setRegistrations(filteredData)
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
      toast.error('Failed to load registrations')
      setRegistrations([])
    } finally {
      setIsLoading(false)
    }
  }, [
    federationId,
    activeTab,
    selectedSeasonId,
    selectedAgeGroupId,
    searchQuery,
  ])

  // Fetch seasons and age groups for filters
  useEffect(() => {
    const fetchFilters = async () => {
      if (!federationId) return

      try {
        const seasonsResponse = await apiClient.getSeasons({
          federationId,
          sortBy: 'startYear',
          sortOrder: 'desc',
          limit: 100,
        })
        setSeasons(seasonsResponse.data || [])

        if (selectedSeasonId && selectedSeasonId !== 'all') {
          const ageGroupsResponse = await apiClient.getSeasonAgeGroups({
            seasonId: selectedSeasonId,
            sortBy: 'displayOrder',
            sortOrder: 'asc',
          })
          setAgeGroups(ageGroupsResponse.data || [])
        } else {
          setAgeGroups([])
        }
      } catch (error) {
        console.error('Failed to fetch filters:', error)
      }
    }

    fetchFilters()
  }, [federationId, selectedSeasonId])

  // Fetch registrations when filters change
  useEffect(() => {
    if (federationId) {
      fetchRegistrations()
    }
  }, [federationId, fetchRegistrations])

  const handleApprove = (registration: any) => {
    setSelectedRegistration(registration)
    setApproveDialogOpen(true)
  }

  const handleReject = (registration: any) => {
    setSelectedRegistration(registration)
    setRejectDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        variant: 'secondary' as const,
        icon: AlertCircle,
        text: 'Pending',
      },
      approved: {
        variant: 'default' as const,
        icon: CheckCircle2,
        text: 'Approved',
      },
      rejected: {
        variant: 'destructive' as const,
        icon: XCircle,
        text: 'Rejected',
      },
    }
    const config = variants[status as keyof typeof variants] || variants.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className='gap-1'>
        <Icon className='h-3 w-3' />
        {config.text}
      </Badge>
    )
  }

  // Show loading state while checking auth
  if (rolesLoading) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center text-muted-foreground'>Loading...</div>
        </div>
      </div>
    )
  }

  // Show unauthorized access
  if (!hasAccess) {
    return (
      <UnauthorizedAccess
        title='Federation Admin Access Required'
        message='Only federation administrators and editors can manage season registrations. This includes approving or rejecting player registrations for federation seasons.'
        requiredRole='Federation Administrator or Editor'
      />
    )
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader
        icon={ClipboardCheck}
        title='Season Registrations'
        description='Manage player registrations for federation seasons'
      />

      {/* Info Card */}
      <Card className='mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'>
        <CardHeader>
          <CardTitle className='text-lg text-blue-900 dark:text-blue-100'>
            Registration Management
          </CardTitle>
          <CardDescription className='text-blue-700 dark:text-blue-300'>
            Review and approve player registrations from clubs
          </CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-blue-900 dark:text-blue-100 space-y-2'>
          <div>
            <span className='font-semibold'>Pending:</span> New registrations
            awaiting your approval
          </div>
          <div>
            <span className='font-semibold'>Age Warnings:</span> Shown but do
            not block approval - you have final authority
          </div>
          <div>
            <span className='font-semibold'>Federation IDs:</span> Required for
            new members during approval
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Content */}
      <Card className='mt-6'>
        <CardContent className='pt-6'>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value='pending'>Pending</TabsTrigger>
              <TabsTrigger value='approved'>Approved</TabsTrigger>
              <TabsTrigger value='rejected'>Rejected</TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className='mt-4 flex flex-col sm:flex-row gap-3'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search by player name...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>
              <Select
                value={selectedSeasonId}
                onValueChange={setSelectedSeasonId}
              >
                <SelectTrigger className='w-full sm:w-[200px]'>
                  <SelectValue placeholder='All seasons' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Seasons</SelectItem>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSeasonId !== 'all' && ageGroups.length > 0 && (
                <Select
                  value={selectedAgeGroupId}
                  onValueChange={setSelectedAgeGroupId}
                >
                  <SelectTrigger className='w-full sm:w-[200px]'>
                    <SelectValue placeholder='All age groups' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Age Groups</SelectItem>
                    {ageGroups.map((ag) => (
                      <SelectItem key={ag.id} value={ag.id}>
                        {ag.code} - {ag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Table Content */}
            <TabsContent value={activeTab} className='mt-4'>
              {isLoading ? (
                <div className='rounded-md border p-8 text-center text-muted-foreground'>
                  Loading registrations...
                </div>
              ) : (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className='hidden md:table-cell'>
                          Age Group
                        </TableHead>
                        <TableHead className='hidden lg:table-cell'>
                          Age
                        </TableHead>
                        <TableHead className='hidden xl:table-cell'>
                          Date
                        </TableHead>
                        <TableHead>Status</TableHead>
                        {activeTab === 'pending' && (
                          <TableHead>Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={activeTab === 'pending' ? 7 : 6}
                            className='h-24 text-center'
                          >
                            No {activeTab} registrations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        registrations.map((reg) => (
                          <TableRow key={reg.id}>
                            <TableCell className='font-medium'>
                              {reg.playerName || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {reg.organizationName || 'N/A'}
                            </TableCell>
                            <TableCell className='hidden md:table-cell'>
                              <Badge
                                variant='outline'
                                className='font-mono text-xs'
                              >
                                {reg.seasonAgeGroup?.code || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className='hidden lg:table-cell'>
                              <div className='flex items-center gap-2'>
                                {reg.playerAgeAtRegistration || 'N/A'}
                                {reg.ageWarningType && (
                                  <AlertCircle className='h-4 w-4 text-yellow-600' />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className='hidden xl:table-cell text-sm text-muted-foreground'>
                              {formatDate(reg.createdAt)}
                            </TableCell>
                            <TableCell>{getStatusBadge(reg.status)}</TableCell>
                            {activeTab === 'pending' && (
                              <TableCell>
                                <div className='flex gap-2'>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => handleApprove(reg)}
                                  >
                                    <CheckCircle2 className='h-4 w-4' />
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => handleReject(reg)}
                                  >
                                    <XCircle className='h-4 w-4' />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      {selectedRegistration && (
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <ApproveRegistrationDialog
            registration={selectedRegistration}
            isFederationMember={!!selectedRegistration.federationIdNumber}
            onSuccess={() => {
              setApproveDialogOpen(false)
              setSelectedRegistration(null)
              fetchRegistrations()
            }}
            onCancel={() => {
              setApproveDialogOpen(false)
              setSelectedRegistration(null)
            }}
          />
        </Dialog>
      )}

      {/* Reject Dialog */}
      {selectedRegistration && (
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <RejectRegistrationDialog
            registration={selectedRegistration}
            onSuccess={() => {
              setRejectDialogOpen(false)
              setSelectedRegistration(null)
              fetchRegistrations()
            }}
            onCancel={() => {
              setRejectDialogOpen(false)
              setSelectedRegistration(null)
            }}
          />
        </Dialog>
      )}
    </div>
  )
}
