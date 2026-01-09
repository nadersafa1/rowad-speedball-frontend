/**
 * UI Constants for consistent styling across the application
 */

/**
 * Dialog size constants for consistent modal widths
 *
 * Usage:
 * <DialogContent className={DIALOG_SIZES.md}>
 *
 * Sizes:
 * - sm: Small dialogs (confirmations, simple forms) - max-w-md (~448px)
 * - md: Medium dialogs (standard forms) - max-w-lg (~512px)
 * - lg: Large dialogs (complex forms with multiple sections) - max-w-2xl (~672px)
 * - xl: Extra large dialogs (forms with tables, multi-column layouts) - max-w-3xl (~768px)
 * - full: Full-screen dialogs (image editors, complex UIs) - max-w-full
 */
export const DIALOG_SIZES = {
  /** Small dialogs - confirmations, simple forms (~448px) */
  sm: 'sm:max-w-md',
  /** Medium dialogs - standard forms (~512px) */
  md: 'sm:max-w-lg',
  /** Large dialogs - complex forms (~672px) */
  lg: 'max-w-2xl',
  /** Extra large dialogs - forms with tables (~768px) */
  xl: 'max-w-3xl',
  /** Full width dialogs */
  full: 'max-w-full',
} as const

/**
 * Dialog with scroll behavior for forms that may overflow
 *
 * Usage:
 * <DialogContent className={`${DIALOG_SIZES.lg} ${DIALOG_SCROLL}`}>
 */
export const DIALOG_SCROLL = 'max-h-[90vh] overflow-y-auto'

/**
 * Dialog responsive padding
 *
 * Usage:
 * <DialogContent className={`${DIALOG_SIZES.lg} ${DIALOG_SCROLL} ${DIALOG_PADDING}`}>
 */
export const DIALOG_PADDING = 'p-4 sm:p-6'

/**
 * Common dialog class combinations for different form types
 */
export const DIALOG_CLASSES = {
  /** Small confirmation dialogs */
  confirmation: DIALOG_SIZES.sm,
  /** Simple forms (1-2 fields) */
  simpleForm: DIALOG_SIZES.md,
  /** Standard forms */
  form: `${DIALOG_SIZES.lg} ${DIALOG_SCROLL} ${DIALOG_PADDING}`,
  /** Complex forms with many fields */
  complexForm: `${DIALOG_SIZES.xl} ${DIALOG_SCROLL} ${DIALOG_PADDING}`,
} as const

export type DialogSize = keyof typeof DIALOG_SIZES
