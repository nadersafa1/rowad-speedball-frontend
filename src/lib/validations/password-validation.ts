import { z } from 'zod'

/**
 * Password validation schema with strength requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  )

/**
 * Validate password strength
 * @throws Error with descriptive message if password doesn't meet requirements
 */
export function validatePassword(password: string): void {
  const result = passwordSchema.safeParse(password)
  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }
}

/**
 * Get password strength score (0-5)
 * 0 = very weak, 5 = very strong
 */
export function getPasswordStrength(password: string): {
  score: number
  feedback: string
} {
  let score = 0
  const checks = [
    { test: password.length >= 8, points: 1 },
    { test: password.length >= 12, points: 1 },
    { test: /[A-Z]/.test(password), points: 1 },
    { test: /[a-z]/.test(password), points: 1 },
    { test: /[0-9]/.test(password), points: 1 },
    { test: /[^A-Za-z0-9]/.test(password), points: 1 },
  ]

  checks.forEach((check) => {
    if (check.test) score += check.points
  })

  const feedback = [
    'Very weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
    'Very strong',
  ][score]

  return { score, feedback }
}
