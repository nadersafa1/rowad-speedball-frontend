// Authorization hooks exports

// Context data hooks
export { useOrganization } from './use-organization'
export { useFederation } from './use-federation'
export { useRoles } from './use-roles'

// Base context hook (still used internally by other hooks)
export { useOrganizationContext } from './use-organization-context'

// Entity permission hooks
export { useChampionshipPermissions } from './use-championship-permissions'
export { useCoachPermissions } from './use-coach-permissions'
export { useEventPermissions } from './use-event-permissions'
export { useFederationPermissions } from './use-federation-permissions'
export { useFederationClubRequestPermissions } from './use-federation-club-request-permissions'
export { useGroupPermissions } from './use-group-permissions'
export { useMatchPermissions } from './use-match-permissions'
export { useOrganizationPermissions } from './use-organization-permissions'
export { usePlayerNotePermissions } from './use-player-note-permissions'
export { usePlayerPermissions } from './use-player-permissions'
export { usePointsSchemaPermissions } from './use-points-schema-permissions'
export { useRegistrationPermissions } from './use-registration-permissions'
export { useResultPermissions } from './use-result-permissions'
export { useSetPermissions } from './use-set-permissions'
export { useTestPermissions } from './use-test-permissions'
export { useTrainingSessionPermissions } from './use-training-session-permissions'
export { useUserPermissions } from './use-user-permissions'
