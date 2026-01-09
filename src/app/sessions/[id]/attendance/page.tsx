'use client'

import { AgeGroup, Gender } from '@/app/players/types/enums'
import { AttendanceSummary } from '@/components/training-sessions/attendance-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Loading from '@/components/ui/loading'
import { SinglePageHeader } from '@/components/ui'
import Unauthorized from '@/components/ui/unauthorized'
import { getAgeGroup } from '@/db/schema'
import { useTrainingSessionPermissions } from '@/hooks/authorization/use-training-session-permissions'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'
import { useTrainingSessionAttendance } from '@/hooks/use-training-session-attendance'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { Loader2, Plus, Users } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AddPlayerDialog } from './components/add-player-dialog'
import { AttendanceTable } from './components/attendance-table'

const AttendanceManagementPage = () => {
  const params = useParams()
  const sessionId = params.id as string

  const [addPlayerOpen, setAddPlayerOpen] = useState(false)

  const {
    selectedTrainingSession,
    fetchTrainingSession,
    isLoading: isSessionLoading,
  } = useTrainingSessionsStore()

  const { canUpdate } = useTrainingSessionPermissions(
    selectedTrainingSession as any
  )

  const {
    attendanceRecords,
    isLoading: isAttendanceLoading,
    error,
    updatingPlayerId,
    updateStatus,
    deleteAttendance,
    addPlayer,
    initializeAttendance,
    bulkUpdateStatus,
    bulkDeleteAttendance,
    summary,
  } = useTrainingSessionAttendance({
    sessionId,
    enabled: !!sessionId,
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
    if (sessionId && canUpdate) {
      fetchTrainingSession(sessionId)
    }
  }, [sessionId, fetchTrainingSession, canUpdate])

  if (isSessionLoading) return <Loading />

  // Only users with update permission can manage attendance
  if (!canUpdate) {
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
      <SinglePageHeader
        backTo={`/sessions/${selectedTrainingSession.id}`}
        actionDialogs={
          canUpdate
            ? [
                {
                  open: addPlayerOpen,
                  onOpenChange: setAddPlayerOpen,
                  trigger: (
                    <Button size='sm' className='gap-2'>
                      <Plus className='h-4 w-4' />
                      <span className='hidden sm:inline'>Add Player</span>
                    </Button>
                  ),
                  content: (
                    <AddPlayerDialog
                      onAdd={addPlayer}
                      excludedPlayerIds={attendanceRecords.map(
                        (r) => r.playerId
                      )}
                      organizationId={selectedTrainingSession.organizationId}
                      onSuccess={() => setAddPlayerOpen(false)}
                      onCancel={() => setAddPlayerOpen(false)}
                    />
                  ),
                },
              ]
            : undefined
        }
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
              bulkUpdateStatus={bulkUpdateStatus}
              bulkDeleteAttendance={bulkDeleteAttendance}
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
