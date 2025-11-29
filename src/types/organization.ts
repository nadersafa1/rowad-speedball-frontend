export enum OrganizationRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  SUPER_ADMIN = 'super_admin',
  COACH = 'coach',
  PLAYER = 'player',
  MEMBER = 'member',
}

export interface OrganizationContext {
  organization: {
    id: string
    name: string
    slug: string
    logo?: string | null
    createdAt: Date
    metadata?: string | null
  } | null
  role: OrganizationRole | null
  activeOrgId: string | null
  userId: string | null
  isSystemAdmin: boolean
  isOwner: boolean
  isAdmin: boolean
  isCoach: boolean
  isPlayer: boolean
  isMember: boolean
  isAuthenticated: boolean
}

