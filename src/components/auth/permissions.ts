import {
  defaultStatements,
  adminAc,
  ownerAc,
  memberAc,
} from 'better-auth/plugins/organization/access'
import { createAccessControl } from 'better-auth/plugins/access'

export const ac = createAccessControl({
  ...defaultStatements,
  coach: ['create', 'read', 'update', 'delete'],
  player: ['create', 'read', 'update', 'delete'],
})

export const owner = ac.newRole({
  ...ownerAc.statements,
  player: ['create', 'read', 'update', 'delete'],
  coach: ['create', 'read', 'update', 'delete'],
})

export const superAdmin = ac.newRole({
  ...ownerAc.statements,
})

export const admin = ac.newRole({
  ...adminAc.statements,
  coach: ['create', 'read', 'update', 'delete'],
  player: ['create', 'read', 'update', 'delete'],
})

export const member = ac.newRole({
  ...memberAc.statements,
})

export const coach = ac.newRole({
  ...adminAc.statements,
  organization: [], // Cannot manage organization settings
  invitation: ['create', 'cancel'], // Can create and cancel invitations
  player: ['create', 'read', 'update', 'delete'], // Full CRUD on players (internal)
  // Note: Tests, events, matches, groups, sets, results are managed via application-level
  // checks based on organizationId, not through organization plugin permissions
})

export const player = ac.newRole({
  ...memberAc.statements,
})
