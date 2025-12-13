// Seeder Types
import { EventType } from '@/types/event-types'

export interface SeededUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  password: string
}

export interface SeededOrganization {
  id: string
  name: string
  slug: string
}

export interface SeededMember {
  id: string
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'coach' | 'player' | 'member' | 'super_admin'
}

export interface SeededPlayer {
  id: string
  name: string
  nameRtl: string | null
  userId: string | null
  organizationId: string | null
  gender: 'male' | 'female'
  dateOfBirth: string
  preferredHand: 'left' | 'right' | 'both'
}

export interface SeededCoach {
  id: string
  name: string
  nameRtl: string | null
  userId: string | null
  organizationId: string | null
  gender: 'male' | 'female'
}

export interface SeededTrainingSession {
  id: string
  name: string
  organizationId: string | null
  date: string
  intensity: 'high' | 'normal' | 'low'
}

export interface SeededTest {
  id: string
  name: string
  organizationId: string | null
  dateConducted: string
}

export interface SeededTestResult {
  id: string
  testId: string
  playerId: string
}

export interface SeededEvent {
  id: string
  name: string
  organizationId: string | null
  eventType: EventType
  gender: 'male' | 'female' | 'mixed'
}

export interface SeededRegistration {
  id: string
  eventId: string
  playerIds: string[]
}

// JSON output structure
export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  players: Array<{ id: string; name: string; email: string | null }>
  coaches: Array<{ id: string; name: string; email: string | null }>
  admins: Array<{ id: string; name: string; email: string }>
  owners: Array<{ id: string; name: string; email: string }>
  members: Array<{ id: string; name: string; email: string; role: string }>
}

export interface SeedDataOutput {
  generatedAt: string
  password: string
  users: Array<{
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
  }>
  organizations: OrganizationSummary[]
}

// Seeder context passed between seeders
export interface SeederContext {
  users: SeededUser[]
  organizations: SeededOrganization[]
  members: SeededMember[]
  players: SeededPlayer[]
  coaches: SeededCoach[]
  trainingSessions: SeededTrainingSession[]
  tests: SeededTest[]
  testResults: SeededTestResult[]
  events: SeededEvent[]
  registrations: SeededRegistration[]
}
