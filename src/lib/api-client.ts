// API Client - Single responsibility: HTTP communication with backend
import type { PaginatedResponse } from '@/types/api/pagination'
import type { OrganizationContext } from '@/lib/organization-helpers'
import type { EventType } from '@/types/event-types'
import type { EventFormat } from '@/types/event-format'
import type { TeamLevel } from '@/types/team-level'

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    // Use relative path since API is on the same server now
    this.baseUrl = baseUrl || '/api/v1'
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Network error' }))

      // If it's an authentication error, provide more specific message
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }

      throw new Error(error.message || `HTTP ${response.status}`)
    }

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204 || response.statusText === 'No Content') {
      return null as T
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return null as T
    }

    return response.json()
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async verifyAuth() {
    return this.request('/auth/verify')
  }

  // Player methods
  async getPlayers(params?: {
    q?: string
    gender?: string
    ageGroup?: string
    preferredHand?: string
    team?: string
    club?: string | null
    organizationId?: string | null
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
    unassigned?: string | boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.gender) searchParams.set('gender', params.gender)
    if (params?.ageGroup) searchParams.set('ageGroup', params.ageGroup)
    if (params?.preferredHand)
      searchParams.set('preferredHand', params.preferredHand)
    if (params?.team) searchParams.set('team', params.team)
    // Support both club and organizationId, prefer organizationId
    const orgId =
      params?.organizationId !== undefined
        ? params.organizationId
        : params?.club
    if (orgId !== undefined) {
      if (orgId === null) {
        searchParams.set('organizationId', 'null')
      } else if (orgId) {
        searchParams.set('organizationId', orgId)
      }
    }
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.unassigned !== undefined) {
      searchParams.set(
        'unassigned',
        typeof params.unassigned === 'boolean'
          ? params.unassigned.toString()
          : params.unassigned
      )
    }

    const query = searchParams.toString()
    return this.request(`/players${query ? `?${query}` : ''}`)
  }

  async getPlayer(id: string) {
    return this.request(`/players/${id}`)
  }

  async getPlayerMatches(
    playerId: string,
    params?: { page?: number; limit?: number }
  ) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request(
      `/players/${playerId}/matches${query ? `?${query}` : ''}`
    )
  }

  async createPlayer(data: any) {
    return this.request('/players', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePlayer(id: string, data: any) {
    return this.request(`/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deletePlayer(id: string) {
    return this.request(`/players/${id}`, {
      method: 'DELETE',
    })
  }

  // Federation methods
  async getFederations(params?: {
    q?: string
    sortBy?: 'name' | 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request(`/federations${query ? `?${query}` : ''}`)
  }

  async getFederation(id: string) {
    return this.request(`/federations/${id}`)
  }

  async createFederation(data: any) {
    return this.request('/federations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateFederation(id: string, data: any) {
    return this.request(`/federations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteFederation(id: string) {
    return this.request(`/federations/${id}`, {
      method: 'DELETE',
    })
  }

  // Championship methods
  async getChampionships(params?: {
    q?: string
    federationId?: string
    sortBy?: 'name' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.federationId)
      searchParams.set('federationId', params.federationId)
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request(`/championships${query ? `?${query}` : ''}`)
  }

  async getChampionship(id: string) {
    return this.request(`/championships/${id}`)
  }

  async createChampionship(data: any) {
    return this.request('/championships', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateChampionship(id: string, data: any) {
    return this.request(`/championships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteChampionship(id: string) {
    return this.request(`/championships/${id}`, {
      method: 'DELETE',
    })
  }

  // Test methods
  async getTests(params?: {
    q?: string
    playingTime?: number
    recoveryTime?: number
    dateFrom?: string
    dateTo?: string
    organizationId?: string | null
    sortBy?: 'name' | 'dateConducted' | 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.playingTime)
      searchParams.set('playingTime', params.playingTime.toString())
    if (params?.recoveryTime)
      searchParams.set('recoveryTime', params.recoveryTime.toString())
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params?.organizationId !== undefined) {
      if (params.organizationId === null) {
        searchParams.set('organizationId', 'null')
      } else {
        searchParams.set('organizationId', params.organizationId)
      }
    }
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request(`/tests${query ? `?${query}` : ''}`)
  }

  async getTest(id: string, includeResults?: boolean) {
    const params = includeResults ? '?includeResults=true' : ''
    return this.request(`/tests/${id}${params}`)
  }

  async createTest(data: any) {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTest(id: string, data: any) {
    return this.request(`/tests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTest(id: string) {
    return this.request(`/tests/${id}`, {
      method: 'DELETE',
    })
  }

  // Results methods
  async getResults(params?: {
    testId: string
    q?: string
    gender?: string
    ageGroup?: string
    yearOfBirth?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.testId) searchParams.set('testId', params.testId)
    if (params?.q) searchParams.set('q', params.q)
    if (params?.gender) searchParams.set('gender', params.gender)
    if (params?.ageGroup) searchParams.set('ageGroup', params.ageGroup)
    if (params?.yearOfBirth) searchParams.set('yearOfBirth', params.yearOfBirth)
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request(`/results${query ? `?${query}` : ''}`)
  }

  async getPlayerResults(playerId: string) {
    return this.request(`/results/player/${playerId}`)
  }

  async getTestResults(testId: string) {
    return this.request(`/results/test/${testId}`)
  }

  async createResult(data: any) {
    return this.request('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateResult(id: string, data: any) {
    return this.request(`/results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteResult(id: string) {
    return this.request(`/results/${id}`, {
      method: 'DELETE',
    })
  }

  // Events methods
  async getEvents(params?: {
    q?: string
    eventType?: EventType
    gender?: 'male' | 'female' | 'mixed'
    format?: EventFormat
    visibility?: 'public' | 'private'
    organizationId?: string | null
    trainingSessionId?: string
    sortBy?:
      | 'name'
      | 'eventType'
      | 'gender'
      | 'completed'
      | 'createdAt'
      | 'updatedAt'
      | 'registrationStartDate'
      | 'registrationsCount'
      | 'lastMatchPlayedDate'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.eventType) searchParams.set('eventType', params.eventType)
    if (params?.gender) searchParams.set('gender', params.gender)
    if (params?.format) searchParams.set('format', params.format)
    if (params?.visibility) searchParams.set('visibility', params.visibility)
    if (params?.trainingSessionId) {
      searchParams.set('trainingSessionId', params.trainingSessionId)
    }
    if (params?.organizationId !== undefined) {
      if (params.organizationId === null) {
        searchParams.set('organizationId', 'null')
      } else {
        searchParams.set('organizationId', params.organizationId)
      }
    }
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request(`/events${query ? `?${query}` : ''}`)
  }

  async getEvent(id: string) {
    return this.request(`/events/${id}`)
  }

  async createEvent(data: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEvent(id: string, data: any) {
    return this.request(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    })
  }

  async generateBracket(
    eventId: string,
    seeds?: Array<{ registrationId: string; seed: number }>
  ) {
    return this.request(`/events/${eventId}/generate-bracket`, {
      method: 'POST',
      body: seeds ? JSON.stringify({ seeds }) : undefined,
    })
  }

  async resetBracket(eventId: string) {
    return this.request(`/events/${eventId}/reset-bracket`, {
      method: 'POST',
    })
  }

  // Heat generation methods (for test events)
  async generateHeats(
    eventId: string,
    options?: {
      playersPerHeat?: number
      shuffleRegistrations?: boolean
      regenerate?: boolean
    }
  ) {
    return this.request(`/events/${eventId}/generate-heats`, {
      method: 'POST',
      body: options ? JSON.stringify(options) : undefined,
    })
  }

  async resetHeats(eventId: string) {
    return this.request(`/events/${eventId}/generate-heats`, {
      method: 'POST',
      body: JSON.stringify({ regenerate: true }),
    })
  }

  // Groups methods
  async getGroups(eventId?: string) {
    const params = eventId ? `?eventId=${eventId}` : ''
    return this.request(`/groups${params}`)
  }

  async createGroup(data: { eventId: string; registrationIds: string[] }) {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteGroup(id: string) {
    return this.request(`/groups/${id}`, {
      method: 'DELETE',
    })
  }

  // Registrations methods
  async getRegistrations(eventId?: string, groupId?: string) {
    const searchParams = new URLSearchParams()
    if (eventId) searchParams.set('eventId', eventId)
    if (groupId) searchParams.set('groupId', groupId)

    const query = searchParams.toString()
    return this.request(`/registrations${query ? `?${query}` : ''}`)
  }

  async createRegistration(data: {
    eventId: string
    playerIds: string[]
    players?: { playerId: string; position?: string | null; order?: number }[]
  }) {
    return this.request('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateRegistration(id: string, data: any) {
    return this.request(`/registrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRegistration(id: string) {
    return this.request(`/registrations/${id}`, {
      method: 'DELETE',
    })
  }

  async updateRegistrationScores(
    id: string,
    scores: {
      leftHandScore?: number
      rightHandScore?: number
      forehandScore?: number
      backhandScore?: number
    }
  ) {
    return this.request(`/registrations/${id}/scores`, {
      method: 'PATCH',
      body: JSON.stringify(scores),
    })
  }

  // Matches methods
  async getMatches(eventId?: string, groupId?: string, round?: number) {
    const searchParams = new URLSearchParams()
    if (eventId) searchParams.set('eventId', eventId)
    if (groupId) searchParams.set('groupId', groupId)
    if (round) searchParams.set('round', round.toString())

    const query = searchParams.toString()
    return this.request(`/matches${query ? `?${query}` : ''}`)
  }

  async getMatch(id: string) {
    return this.request(`/matches/${id}`)
  }

  async updateMatch(id: string, data: any) {
    return this.request(`/matches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Sets methods
  async getSets(matchId?: string) {
    const params = matchId ? `?matchId=${matchId}` : ''
    return this.request(`/sets${params}`)
  }

  async createSet(data: {
    matchId: string
    setNumber: number
    registration1Score: number
    registration2Score: number
  }) {
    return this.request('/sets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSet(id: string, data: any) {
    return this.request(`/sets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async markSetAsPlayed(id: string) {
    return this.request(`/sets/${id}/played`, {
      method: 'PATCH',
    })
  }

  async deleteSet(id: string) {
    return this.request(`/sets/${id}`, {
      method: 'DELETE',
    })
  }

  // Coaches methods
  async getCoaches(params?: {
    q?: string
    gender?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
    unassigned?: string | boolean
    organizationId?: string | null
  }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.gender) searchParams.set('gender', params.gender)
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.unassigned !== undefined) {
      searchParams.set(
        'unassigned',
        typeof params.unassigned === 'boolean'
          ? params.unassigned.toString()
          : params.unassigned
      )
    }
    if (params?.organizationId !== undefined) {
      searchParams.set(
        'organizationId',
        params.organizationId === null ? 'null' : params.organizationId
      )
    }

    const query = searchParams.toString()
    return this.request(`/coaches${query ? `?${query}` : ''}`)
  }

  async getCoach(id: string) {
    return this.request(`/coaches/${id}`)
  }

  async createCoach(data: any) {
    return this.request('/coaches', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCoach(id: string, data: any) {
    return this.request(`/coaches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCoach(id: string) {
    return this.request(`/coaches/${id}`, {
      method: 'DELETE',
    })
  }

  // Training Sessions methods
  async getTrainingSessions(params?: {
    q?: string
    intensity?: string
    type?: string
    dateFrom?: string
    dateTo?: string
    ageGroup?: string
    organizationId?: string | null
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.intensity) searchParams.set('intensity', params.intensity)
    if (params?.type) searchParams.set('type', params.type)
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo)
    if (params?.ageGroup) searchParams.set('ageGroup', params.ageGroup)
    if (params?.organizationId !== undefined) {
      searchParams.set(
        'organizationId',
        params.organizationId === null ? 'null' : params.organizationId
      )
    }
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.request(`/training-sessions${query ? `?${query}` : ''}`)
  }

  async getTrainingSession(id: string) {
    return this.request(`/training-sessions/${id}`)
  }

  async createTrainingSession(data: any) {
    return this.request('/training-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTrainingSession(id: string, data: any) {
    return this.request(`/training-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTrainingSession(id: string) {
    return this.request(`/training-sessions/${id}`, {
      method: 'DELETE',
    })
  }

  // Training Session Attendance
  async getTrainingSessionAttendance(sessionId: string) {
    return this.request(`/training-sessions/${sessionId}/attendance`)
  }

  async getTrainingSessionAttendanceRecord(
    sessionId: string,
    playerId: string
  ) {
    return this.request(
      `/training-sessions/${sessionId}/attendance/${playerId}`
    )
  }

  async updateAttendanceStatus(
    sessionId: string,
    playerId: string,
    status: string
  ) {
    return this.request(
      `/training-sessions/${sessionId}/attendance/${playerId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    )
  }

  async createAttendanceRecord(
    sessionId: string,
    playerId: string,
    status: string = 'pending'
  ) {
    return this.request(`/training-sessions/${sessionId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ playerId, status }),
    })
  }

  async deleteAttendanceRecord(sessionId: string, playerId: string) {
    return this.request(
      `/training-sessions/${sessionId}/attendance/${playerId}`,
      {
        method: 'DELETE',
      }
    )
  }

  async bulkUpdateAttendanceStatus(
    sessionId: string,
    updates: Array<{ playerId: string; status: string }>
  ) {
    return this.request(`/training-sessions/${sessionId}/attendance/bulk`, {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    })
  }

  async bulkDeleteAttendanceRecords(sessionId: string, playerIds: string[]) {
    return this.request(`/training-sessions/${sessionId}/attendance/bulk`, {
      method: 'DELETE',
      body: JSON.stringify({ playerIds }),
    })
  }

  // Generic methods for convenience
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  // Users API
  async getUsers(params?: {
    q?: string
    role?: 'admin' | 'user'
    sortBy?: 'name' | 'email' | 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
    unassigned?: string | boolean
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set('q', params.q)
    if (params?.role) searchParams.set('role', params.role)
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.unassigned !== undefined) {
      searchParams.set(
        'unassigned',
        typeof params.unassigned === 'boolean'
          ? params.unassigned.toString()
          : params.unassigned
      )
    }

    return this.request<PaginatedResponse<any>>(
      `/users?${searchParams.toString()}`
    )
  }

  async getUser(id: string): Promise<any> {
    return this.request(`/users/${id}`)
  }

  async getMyMemberships(): Promise<
    Array<{
      id: string
      userId: string
      organizationId: string
      role: string
      createdAt: Date
      organization: {
        id: string
        name: string
        slug: string
      }
    }>
  > {
    return this.request('/users/me/memberships')
  }

  async getMyOrganizationContext(): Promise<OrganizationContext> {
    return this.request<OrganizationContext>('/users/me/organization-context')
  }

  async getMyProfile(): Promise<{
    user: any
    player: any | null
    coach: any | null
  }> {
    return this.request('/users/me')
  }

  async updateMyPlayer(data: {
    name?: string
    preferredHand?: 'left' | 'right' | 'both'
    teamLevel?: TeamLevel
  }): Promise<any> {
    return this.request('/users/me/player', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async updateMyCoach(data: { name?: string }): Promise<any> {
    return this.request('/users/me/coach', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Organizations API
  async getOrganizations(): Promise<
    Array<{ id: string; name: string; slug: string }>
  > {
    return this.request<Array<{ id: string; name: string; slug: string }>>(
      '/organizations'
    )
  }

  async createOrganization(data: {
    name: string
    slug: string
    members?: Array<{
      userId: string
      role: 'owner' | 'admin' | 'coach' | 'member' | 'player'
    }>
  }): Promise<any> {
    return this.request<any>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Singleton instance - use relative path
export const apiClient = new ApiClient('/api/v1')
