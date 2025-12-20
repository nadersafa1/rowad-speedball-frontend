/**
 * Rate limiting utility for API endpoints
 * Uses in-memory storage with sliding window algorithm
 * 
 * For production with multiple servers, consider using:
 * - Upstash Rate Limit (@upstash/ratelimit)
 * - Redis-based rate limiting
 * - Edge middleware rate limiting
 */

interface RateLimitEntry {
  timestamps: number[]
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000

  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    // Remove timestamps older than 5 minutes
    entry.timestamps = entry.timestamps.filter((t: number) => t > fiveMinutesAgo)

    // Remove entry if no recent timestamps
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  // Get or create entry
  let entry = rateLimitStore.get(identifier)
  if (!entry) {
    entry = { timestamps: [] }
    rateLimitStore.set(identifier, entry)
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  // Check if limit exceeded
  if (entry.timestamps.length >= maxRequests) {
    return false
  }

  // Add current timestamp
  entry.timestamps.push(now)
  return true
}

/**
 * Rate limit configuration presets
 */
export const RateLimits = {
  // Authentication endpoints (login, signup, password reset)
  AUTH: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // General API endpoints
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Admin endpoints
  ADMIN: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
  },
  // Sensitive operations (password reset, email verification)
  SENSITIVE: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to 'anonymous' if no IP available
  return 'anonymous'
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(retryAfterSeconds?: number): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (retryAfterSeconds) {
    headers['Retry-After'] = retryAfterSeconds.toString()
  }

  return new Response(
    JSON.stringify({
      message: 'Too many requests. Please try again later.',
    }),
    {
      status: 429,
      headers,
    }
  )
}
 