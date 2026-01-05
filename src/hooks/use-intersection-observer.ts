/**
 * useIntersectionObserver Hook
 *
 * A custom hook for observing when an element enters or exits the viewport.
 * Useful for implementing infinite scroll, lazy loading, and scroll-based animations.
 *
 * @example
 * const { ref } = useIntersectionObserver({
 *   onChange: (isIntersecting) => {
 *     if (isIntersecting) loadMore()
 *   },
 *   threshold: 0.5,
 * })
 *
 * return <div ref={ref}>Content</div>
 */

import { useEffect, useRef, useCallback } from 'react'

export interface UseIntersectionObserverOptions {
  /** Callback when intersection state changes */
  onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void

  /** One or more thresholds at which to trigger the callback (0.0 to 1.0) */
  threshold?: number | number[]

  /** Margin around the root element */
  rootMargin?: string

  /** Root element for intersection (defaults to viewport) */
  root?: Element | null

  /** Whether the observer is enabled */
  enabled?: boolean

  /** Fire callback only once when element enters viewport */
  triggerOnce?: boolean
}

export interface UseIntersectionObserverReturn {
  /** Ref to attach to the element you want to observe */
  ref: (node: Element | null) => void

  /** Current intersection state */
  isIntersecting: boolean

  /** Last intersection observer entry */
  entry: IntersectionObserverEntry | null
}

export function useIntersectionObserver({
  onChange,
  threshold = 0,
  rootMargin = '0px',
  root = null,
  enabled = true,
  triggerOnce = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<Element | null>(null)
  const isIntersectingRef = useRef(false)
  const entryRef = useRef<IntersectionObserverEntry | null>(null)
  const hasTriggeredRef = useRef(false)

  // Cleanup observer
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
  }, [])

  // Set up the observer
  useEffect(() => {
    // Don't observe if disabled or no element
    if (!enabled || !elementRef.current) {
      cleanup()
      return
    }

    // Skip if triggerOnce and already triggered
    if (triggerOnce && hasTriggeredRef.current) {
      return
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const isIntersecting = entry.isIntersecting
        entryRef.current = entry

        // Only trigger if state changed
        if (isIntersecting !== isIntersectingRef.current) {
          isIntersectingRef.current = isIntersecting

          // Call onChange callback
          if (onChange) {
            onChange(isIntersecting, entry)
          }

          // Mark as triggered if triggerOnce and is intersecting
          if (triggerOnce && isIntersecting) {
            hasTriggeredRef.current = true
            cleanup()
          }
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    )

    // Start observing
    observerRef.current.observe(elementRef.current)

    // Cleanup on unmount
    return cleanup
  }, [enabled, threshold, rootMargin, root, triggerOnce, onChange, cleanup])

  // Ref callback to track the element
  const ref = useCallback(
    (node: Element | null) => {
      // Disconnect previous observer
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current)
      }

      // Store new element
      elementRef.current = node

      // Observe new element
      if (observerRef.current && node) {
        observerRef.current.observe(node)
      }
    },
    []
  )

  return {
    ref,
    isIntersecting: isIntersectingRef.current,
    entry: entryRef.current,
  }
}
