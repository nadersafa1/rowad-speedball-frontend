/**
 * API Error Handling Utility
 *
 * Provides standardized error handling with structured logging for API routes.
 * Ensures consistent error responses and proper error tracking.
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
  timestamp: string
  errorId: string
  severity: ErrorSeverity
  message: string
  endpoint: string
  method: string
  statusCode: number
  userId?: string | null
  organizationId?: string | null
  stack?: string
  details?: Record<string, unknown>
}

/**
 * Generate a unique error ID for tracking
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Log structured error to console (in production, this would go to a logging service)
 */
function logError(entry: ErrorLogEntry): void {
  const logMessage = {
    ...entry,
    // In production, this could be sent to services like:
    // - Sentry
    // - DataDog
    // - CloudWatch
    // - Custom logging service
  }

  switch (entry.severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      console.error('[API Error]', JSON.stringify(logMessage, null, 2))
      break
    case ErrorSeverity.WARNING:
      console.warn('[API Warning]', JSON.stringify(logMessage, null, 2))
      break
    case ErrorSeverity.INFO:
      console.info('[API Info]', JSON.stringify(logMessage, null, 2))
      break
  }
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError<unknown>, errorId: string): NextResponse {
  const formattedErrors = error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }))

  return NextResponse.json(
    {
      message: 'Validation error',
      errorId,
      errors: formattedErrors,
    },
    { status: 400 }
  )
}

/**
 * Handle database errors (constraint violations, connection issues, etc.)
 */
function handleDatabaseError(error: Error, errorId: string): NextResponse {
  const message = error.message.toLowerCase()

  // Unique constraint violation
  if (message.includes('unique constraint')) {
    return NextResponse.json(
      {
        message: 'A record with this information already exists',
        errorId,
      },
      { status: 409 }
    )
  }

  // Foreign key constraint violation
  if (message.includes('foreign key constraint')) {
    return NextResponse.json(
      {
        message: 'Referenced record not found or cannot be deleted due to dependencies',
        errorId,
      },
      { status: 409 }
    )
  }

  // Connection errors
  if (message.includes('connection') || message.includes('timeout')) {
    return NextResponse.json(
      {
        message: 'Database connection error. Please try again.',
        errorId,
      },
      { status: 503 }
    )
  }

  // Generic database error
  return NextResponse.json(
    {
      message: 'Database operation failed',
      errorId,
    },
    { status: 500 }
  )
}

/**
 * Handle API errors with standardized logging and responses
 *
 * @param error - The error that occurred
 * @param context - Context about where the error occurred
 * @returns NextResponse with appropriate status and error details
 *
 * @example
 * ```typescript
 * try {
 *   const player = await db.query.players.findFirst(...)
 *   if (!player) {
 *     return NextResponse.json({ message: 'Player not found' }, { status: 404 })
 *   }
 *   return NextResponse.json(player)
 * } catch (error) {
 *   return handleApiError(error, {
 *     endpoint: '/api/v1/players',
 *     method: 'GET',
 *     userId: context.userId,
 *     organizationId: context.organization?.id,
 *   })
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  context: {
    endpoint: string
    method: string
    userId?: string | null
    organizationId?: string | null
    customMessage?: string
    severity?: ErrorSeverity
  }
): NextResponse {
  const errorId = generateErrorId()
  const timestamp = new Date().toISOString()

  // Determine error type and create appropriate response
  let response: NextResponse
  let severity = context.severity || ErrorSeverity.ERROR
  let message = context.customMessage || 'An unexpected error occurred'
  let statusCode = 500
  let details: Record<string, unknown> = {}

  if (error instanceof ZodError) {
    // Validation errors are less severe
    severity = ErrorSeverity.WARNING
    message = 'Validation error'
    statusCode = 400
    response = handleZodError(error, errorId)
  } else if (error instanceof Error) {
    // Check if it's a database error
    if (
      error.message.includes('constraint') ||
      error.message.includes('database') ||
      error.message.includes('connection')
    ) {
      response = handleDatabaseError(error, errorId)
      statusCode = response.status
      message = error.message
    } else {
      // Generic error
      message = error.message
      details = { stack: error.stack }
      response = NextResponse.json(
        {
          message: context.customMessage || 'Internal server error',
          errorId,
        },
        { status: 500 }
      )
    }
  } else {
    // Unknown error type
    message = String(error)
    response = NextResponse.json(
      {
        message: 'Internal server error',
        errorId,
      },
      { status: 500 }
    )
  }

  // Log the error
  const logEntry: ErrorLogEntry = {
    timestamp,
    errorId,
    severity,
    message,
    endpoint: context.endpoint,
    method: context.method,
    statusCode,
    userId: context.userId,
    organizationId: context.organizationId,
    stack: error instanceof Error ? error.stack : undefined,
    details,
  }

  logError(logEntry)

  return response
}

/**
 * Create a not found response with error tracking
 *
 * @param resource - The resource that was not found (e.g., 'Player', 'Event')
 * @param context - Context about the request
 * @returns NextResponse with 404 status
 *
 * @example
 * ```typescript
 * if (!player) {
 *   return notFoundResponse('Player', {
 *     endpoint: '/api/v1/players',
 *     method: 'GET',
 *   })
 * }
 * ```
 */
export function notFoundResponse(
  resource: string,
  context: {
    endpoint: string
    method: string
    userId?: string | null
    organizationId?: string | null
  }
): NextResponse {
  const errorId = generateErrorId()
  const message = `${resource} not found`

  logError({
    timestamp: new Date().toISOString(),
    errorId,
    severity: ErrorSeverity.INFO,
    message,
    endpoint: context.endpoint,
    method: context.method,
    statusCode: 404,
    userId: context.userId,
    organizationId: context.organizationId,
  })

  return NextResponse.json(
    {
      message,
      errorId,
    },
    { status: 404 }
  )
}

/**
 * Create a validation error response
 *
 * @param validationErrors - Array of validation error messages
 * @param context - Context about the request
 * @returns NextResponse with 400 status
 *
 * @example
 * ```typescript
 * if (age < 2) {
 *   return validationErrorResponse(
 *     ['Player must be at least 2 years old'],
 *     { endpoint: '/api/v1/players', method: 'POST' }
 *   )
 * }
 * ```
 */
export function validationErrorResponse(
  validationErrors: string[],
  context: {
    endpoint: string
    method: string
    userId?: string | null
    organizationId?: string | null
  }
): NextResponse {
  const errorId = generateErrorId()

  logError({
    timestamp: new Date().toISOString(),
    errorId,
    severity: ErrorSeverity.WARNING,
    message: 'Validation failed',
    endpoint: context.endpoint,
    method: context.method,
    statusCode: 400,
    userId: context.userId,
    organizationId: context.organizationId,
    details: { validationErrors },
  })

  return NextResponse.json(
    {
      message: 'Validation failed',
      errorId,
      errors: validationErrors,
    },
    { status: 400 }
  )
}
