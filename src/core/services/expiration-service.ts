export function calculatePlanExpiryDate(validityDays: number): string {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + validityDays)
  return expiry.toISOString()
}

export function isPlanExpired(planExpiresAt: string, now = new Date()): boolean {
  return new Date(planExpiresAt).getTime() < now.getTime()
}

export function parsePlanExpiresAt(
  rawExpDate: { seconds?: number } | string | undefined | null
): Date | null {
  if (!rawExpDate) return null
  if (typeof rawExpDate === "object" && rawExpDate.seconds) {
    return new Date(rawExpDate.seconds * 1000)
  }
  return new Date(rawExpDate as string)
}

export function getDaysLeft(expiresAt: Date | null): { daysLeft: number; isExpired: boolean } {
  if (!expiresAt) return { daysLeft: 0, isExpired: false }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDateOnly = new Date(expiresAt)
  expDateOnly.setHours(0, 0, 0, 0)

  const diffTime = expDateOnly.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return {
    daysLeft,
    isExpired: daysLeft < 0,
  }
}

export function isInGracePeriod(planExpiresAt: string, now = new Date()): boolean {
  const expiry = new Date(planExpiresAt).getTime()
  const msInSevenDays = 7 * 24 * 60 * 60 * 1000
  const gracePeriodEnd = expiry + msInSevenDays
  const currentTime = now.getTime()

  return currentTime > expiry && currentTime <= gracePeriodEnd
}

export function calculateTeacherEarnings(remainingPlays: number): number {
  return remainingPlays
}