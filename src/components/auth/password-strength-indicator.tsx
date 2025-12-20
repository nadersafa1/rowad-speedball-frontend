'use client'

import { useMemo } from 'react'
import { getPasswordStrength } from '@/lib/validations/password-validation'
import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const { score, feedback } = useMemo(
    () => getPasswordStrength(password),
    [password]
  )

  // Don't show indicator if password is empty
  if (!password) return null

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ]

  const strengthColors = [
    'bg-red-500',
    'bg-red-400',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-green-400',
    'bg-green-500',
  ]

  const strengthTextColors = [
    'text-red-600',
    'text-red-500',
    'text-orange-500',
    'text-yellow-600',
    'text-green-600',
    'text-green-700',
  ]

  return (
    <div className="space-y-2 mt-2">
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index < score ? strengthColors[score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength Label */}
      <p className={`text-xs font-medium ${strengthTextColors[score]}`}>
        {feedback}
      </p>

      {/* Requirements Checklist */}
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-gray-400" />
            )}
            <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
