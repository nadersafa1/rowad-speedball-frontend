'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { BackButton } from '@/components/ui'
import PageHeader from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Loading from '@/components/ui/loading'
import Unauthorized from '@/components/ui/unauthorized'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { useTrainingSessionAttendance } from '@/hooks/use-training-session-attendance'
import { AttendanceSummary } from '@/components/training-sessions/attendance-summary'
import { AttendanceTable } from './components/attendance-table'
import { AddPlayerDialog } from './components/add-player-dialog'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'
import { Users, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { AgeGroup, Gender } from '@/app/players/types/enums'
import { getAgeGroup } from '@/db/schema'

const AttendanceManagementPage = () => {
  const params = useParams()
  const sessionId = params.id as string
  const { context, isLoading: isOrganizationContextLoading } =
    useOrganizationContext()
  const { isSystemAdmin, isCoach, isAdmin, isOwner, isAuthenticated } = context

  const {
    selectedTrainingSession,
    fetchTrainingSession,
    isLoading: isSessionLoading,
  } = useTrainingSessionsStore()

  const {
    attendanceRecords,
    isLoading: isAttendanceLoading,
    error,
    updatingPlayerId,
    updateStatus,
    deleteAttendance,
    addPlayer,
    initializeAttendance,
    summary,
  } = useTrainingSessionAttendance({
    sessionId,
    enabled: !!sessionId && isAuthenticated,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>(
    'all'
  )
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>(AgeGroup.ALL)
  const [genderFilter, setGenderFilter] = useState<string>(Gender.ALL)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  useEffect(() => {
    if (
      sessionId &&
      isAuthenticated &&
      (isSystemAdmin || isCoach || isAdmin || isOwner)
    ) {
      fetchTrainingSession(sessionId)
    }
  }, [
    sessionId,
    fetchTrainingSession,
    isSystemAdmin,
    isCoach,
    isAdmin,
    isOwner,
    isAuthenticated,
  ])

  if (isOrganizationContextLoading || isSessionLoading) return <Loading />

  // Training sessions are always private - require authentication
  if (!isAuthenticated) {
    return <Unauthorized />
  }

  // Only system admins, org admins, org owners, and org coaches can access attendance
  if (!isSystemAdmin && !isCoach && !isAdmin && !isOwner) {
    return <Unauthorized />
  }

  if (!selectedTrainingSession) {
    return <Loading />
  }

  const handleInitializeAttendance = async () => {
    if (!selectedTrainingSession) return

    // For MVP, we'll need to fetch matching players
    // This is a simplified version - in production, you'd want an API endpoint
    // that returns player IDs matching the session criteria
    try {
      // TODO: Implement proper player fetching based on session criteria
      // For now, this is a placeholder
      toast.error(
        'Player initialization not yet implemented. Please create attendance records manually.'
      )
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setAgeGroupFilter(AgeGroup.ALL)
    setGenderFilter(Gender.ALL)
    setPage(1)
  }

  // Calculate pagination
  const filteredRecords = attendanceRecords.filter((record) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      record.player.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || record.status === statusFilter

    // Age group filter
    const playerAgeGroup = record.player.dateOfBirth
      ? getAgeGroup(record.player.dateOfBirth)
      : null
    const matchesAgeGroup =
      ageGroupFilter === AgeGroup.ALL || playerAgeGroup === ageGroupFilter

    // Gender filter
    const matchesGender =
      genderFilter === Gender.ALL ||
      record.player.gender === genderFilter ||
      (!record.player.gender && genderFilter === Gender.ALL)

    return matchesSearch && matchesStatus && matchesAgeGroup && matchesGender
  })

  const totalItems = filteredRecords.length
  const totalPages = Math.ceil(totalItems / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  const pagination = {
    page,
    limit,
    totalItems,
    totalPages: totalPages || 1,
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing page size
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between gap-2'>
        <BackButton
          href={`/sessions/${sessionId}`}
          longText='Back to Session'
        />
        {/* Add Player Button - Only show for admins/coaches/owners */}
        {(isSystemAdmin || isCoach || isAdmin || isOwner) && (
          <AddPlayerDialog
            onAdd={addPlayer}
            excludedPlayerIds={attendanceRecords.map((r) => r.playerId)}
            organizationId={selectedTrainingSession.organizationId}
            isLoading={isAttendanceLoading}
          />
        )}
      </div>
      <PageHeader
        icon={Users}
        title='Attendance Management'
        description={`Manage attendance for ${selectedTrainingSession.name}`}
      />

      {/* Attendance Table */}
      <Card>
        <CardContent className='pt-6'>
          {/* Empty State with Initialize Button */}
          {attendanceRecords.length === 0 && !isAttendanceLoading && (
            <div className='text-center py-8'>
              <Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                No Attendance Records
              </h3>
              <p className='text-muted-foreground mb-4'>
                Initialize attendance to start tracking player attendance for
                this session.
              </p>
              <Button
                onClick={handleInitializeAttendance}
                disabled={isAttendanceLoading}
                className='gap-2'
              >
                {isAttendanceLoading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Users className='h-4 w-4' />
                    Initialize Attendance
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Table */}
          {attendanceRecords.length > 0 && (
            <AttendanceTable
              records={paginatedRecords}
              onStatusChange={updateStatus}
              onDelete={deleteAttendance}
              updatingPlayerId={updatingPlayerId}
              isLoading={isAttendanceLoading}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              ageGroupFilter={ageGroupFilter}
              genderFilter={genderFilter}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={(value) => {
                setSearchQuery(value)
                setPage(1)
              }}
              onStatusFilterChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              onAgeGroupFilterChange={(value) => {
                setAgeGroupFilter(value)
                setPage(1)
              }}
              onGenderFilterChange={(value) => {
                setGenderFilter(value)
                setPage(1)
              }}
              onClearFilters={handleClearFilters}
            />
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className='mt-6'>
        <AttendanceSummary summary={summary} />
      </div>

      {/* Error Display */}
      {error && (
        <Card className='mt-6 border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive'>{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AttendanceManagementPage
