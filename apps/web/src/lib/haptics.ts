/**
 * Safe Mobile Haptic Vibration Engine for TripSync
 * Uses the Web Vibration API (navigator.vibrate) to provide subtle tactile feedback on mobile devices.
 */

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 12, // Subtle tap (buttons, checkbox toggles)
  medium: 24, // Tactile confirmation (copying PNR/reference codes)
  heavy: 45, // Solid impact (deleting, resetting)
  selection: 10, // Tab switching & filter selection
  success: [15, 60, 25], // Delightful double-pulse (logging a bill, task complete, settling balance)
  warning: [30, 40, 30], // Cautionary double-tap
  error: [40, 50, 40, 50, 40], // Triple buzz (failed actions, invalid PIN)
};

/**
 * Triggers a haptic vibration pattern if supported by the user's mobile device/browser.
 */
export const triggerHaptic = (pattern: HapticPattern = 'light'): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    // Fail gracefully if device or browser restricts vibration
  }

  return false;
};

export const haptic = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  selection: () => triggerHaptic('selection'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
};
