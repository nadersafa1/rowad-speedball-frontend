import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'
import {
  checkRateLimit,
  RateLimits,
  getClientIdentifier,
  createRateLimitResponse,
} from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

// Wrap the auth handler with rate limiting
const authHandler = toNextJsHandler(auth)

export async function POST(request: NextRequest) {
  // Apply rate limiting to auth endpoints
  const identifier = getClientIdentifier(request)
  const isAllowed = checkRateLimit(
    `auth:${identifier}`,
    RateLimits.AUTH.maxRequests,
    RateLimits.AUTH.windowMs
  )

  if (!isAllowed) {
    return createRateLimitResponse(Math.ceil(RateLimits.AUTH.windowMs / 1000))
  }

  return authHandler.POST(request)
}

export async function GET(request: NextRequest) {
  // GET requests are less sensitive, use API rate limit
  const identifier = getClientIdentifier(request)
  const isAllowed = checkRateLimit(
    `auth-get:${identifier}`,
    RateLimits.API.maxRequests,
    RateLimits.API.windowMs
  )

  if (!isAllowed) {
    return createRateLimitResponse(Math.ceil(RateLimits.API.windowMs / 1000))
  }

  return authHandler.GET(request)
}
