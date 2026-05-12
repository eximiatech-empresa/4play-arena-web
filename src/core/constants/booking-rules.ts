// src/core/constants/booking-rules.ts

export const MS_PER_HOUR = 1_000 * 60 * 60

export const CHECK_IN_CLOSED_HOURS = 0
export const CHECK_IN_OPEN_HOURS = 6
export const CHECK_IN_ENROLLED_HOURS = 24
export const CANCEL_REFUND_MIN_HOURS = 4

/** Multiplier applied to basePlays when class is in peak window (18h–20h). */
export const PEAK_MULTIPLIER = 1.05

/** Multiplier applied to basePlays when the student is NOT a titular of the class. */
export const RESERVE_MULTIPLIER = 1.10

/** Maximum number of students allowed per class. */
export const MAX_CLASS_SIZE = 6
