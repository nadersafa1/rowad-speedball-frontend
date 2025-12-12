/**
 * UI constants for consistent button sizes, spacing, and icon sizes.
 * Use these constants across Events and Matches components.
 */

export const BUTTON_SIZES = {
  icon: {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  },
  text: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
    xl: 'h-12 px-8 text-base',
  },
} as const

export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const

export const SPACING = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
} as const

export const TOUCH_TARGET_MIN = 'min-h-[48px] min-w-[48px]' // Minimum for mobile accessibility
