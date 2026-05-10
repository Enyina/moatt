/**
 * User detection utilities for new vs returning user flows
 * Implements Flow 0 (new) vs Flow 0.5 (returning) differentiation
 */

export type UserType = 'new' | 'returning';

export interface UserStatus {
  type: UserType;
  showOnboarding: boolean;
  hasSavedDesigns: boolean;
  daysSinceLastVisit: number | null;
}

const STORAGE_KEYS = {
  ONBOARDING_DONE: 'moatt_onboarding_done',
  DESIGNS_COUNT: 'moatt_designs_count',
  LAST_VISIT: 'moatt_last_visit',
  ANONYMOUS_DESIGNS: 'moatt_anonymous_designs',
} as const;

const RETURNING_USER_THRESHOLD_DAYS = 30;

/**
 * Detect user status based on localStorage flags and history
 * Priority order:
 * 1. Onboarding completion flag
 * 2. Saved designs count
 * 3. Last visit timestamp (within 30 days = returning)
 */
export function detectUserStatus(): UserStatus {
  if (typeof window === 'undefined') {
    return {
      type: 'new',
      showOnboarding: false,
      hasSavedDesigns: false,
      daysSinceLastVisit: null,
    };
  }

  const onboardingCompleted = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE) === 'true';
  const savedDesignsCount = parseInt(localStorage.getItem(STORAGE_KEYS.DESIGNS_COUNT) || '0', 10);
  const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);

  const hasSavedDesigns = savedDesignsCount > 0;

  // Calculate days since last visit
  let daysSinceLastVisit: number | null = null;
  let isRecentReturn = false;

  if (lastVisit) {
    const lastVisitTime = parseInt(lastVisit, 10);
    const now = Date.now();
    const diffMs = now - lastVisitTime;
    daysSinceLastVisit = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    isRecentReturn = daysSinceLastVisit <= RETURNING_USER_THRESHOLD_DAYS;
  }

  // Determine user type
  let type: UserType;
  let showOnboarding: boolean;

  if (!onboardingCompleted) {
    // Never completed onboarding = new user
    type = 'new';
    showOnboarding = true;
  } else if (!hasSavedDesigns) {
    // Completed onboarding but no designs = still consider new
    type = 'new';
    showOnboarding = false;
  } else if (isRecentReturn || daysSinceLastVisit === null) {
    // Has designs and visited recently (or first visit after onboarding) = returning
    type = 'returning';
    showOnboarding = false;
  } else {
    // Has designs but hasn't visited in 30+ days = treat as new for re-engagement
    type = 'new';
    showOnboarding = false;
  }

  return {
    type,
    showOnboarding,
    hasSavedDesigns,
    daysSinceLastVisit,
  };
}

/**
 * Record current visit timestamp
 */
export function recordVisit(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAST_VISIT, Date.now().toString());
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
}

/**
 * Update saved designs count
 */
export function updateDesignsCount(count: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DESIGNS_COUNT, count.toString());
}

/**
 * Increment saved designs count
 */
export function incrementDesignsCount(): void {
  if (typeof window === 'undefined') return;
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.DESIGNS_COUNT) || '0', 10);
  localStorage.setItem(STORAGE_KEYS.DESIGNS_COUNT, (current + 1).toString());
}

/**
 * Check if user has anonymous designs pending transfer
 */
export function hasAnonymousDesigns(): boolean {
  if (typeof window === 'undefined') return false;
  const anonDesigns = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_DESIGNS);
  if (!anonDesigns) return false;
  try {
    const parsed = JSON.parse(anonDesigns);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get count of anonymous designs
 */
export function getAnonymousDesignsCount(): number {
  if (typeof window === 'undefined') return 0;
  const anonDesigns = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_DESIGNS);
  if (!anonDesigns) return 0;
  try {
    const parsed = JSON.parse(anonDesigns);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Reset user status (for testing/logout)
 */
export function resetUserStatus(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DONE);
  localStorage.removeItem(STORAGE_KEYS.DESIGNS_COUNT);
  localStorage.removeItem(STORAGE_KEYS.LAST_VISIT);
  // Note: We preserve anonymous designs intentionally
}
