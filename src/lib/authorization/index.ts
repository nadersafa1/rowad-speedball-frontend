/**
 * Authorization Helper Library
 *
 * Centralized authorization functions for all resources in the application.
 * Each helper function returns Response if unauthorized, null if authorized.
 *
 * Usage:
 *   const authError = checkResourceActionAuthorization(context, resource)
 *   if (authError) return authError
 *
 * @module authorization
 */

// Export types and utilities
export * from './types'

// Export authorization helpers
export * from './helpers/player-authorization'
export * from './helpers/coach-authorization'
export * from './helpers/event-authorization'
export * from './helpers/group-authorization'
export * from './helpers/training-session-authorization'
export * from './helpers/test-authorization'
export * from './helpers/result-authorization'
export * from './helpers/match-authorization'
export * from './helpers/set-authorization'
export * from './helpers/registration-authorization'
export * from './helpers/championship-authorization'
export * from './helpers/federation-authorization'
export * from './helpers/organization-authorization'
export * from './helpers/user-authorization'
export * from './helpers/player-notes-authorization'
export * from './helpers/placement-tier-authorization'
export * from './helpers/points-schema-authorization'

// Re-export special event authorization helpers that require database queries
export { canPlayerUpdateMatch } from '@/lib/event-authorization-helpers'
