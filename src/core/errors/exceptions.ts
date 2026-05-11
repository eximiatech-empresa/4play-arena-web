export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

// Auth
export class NotAuthenticatedError extends DomainError {}
export class UserNotFoundError extends DomainError {}
export class UserInactiveError extends DomainError {}

// Booking
export class CheckInNotOpenError extends DomainError {}
export class LessonClosedError extends DomainError {}
export class LessonNotFoundError extends DomainError {}
export class LessonFullError extends DomainError {}
export class AlreadyEnrolledError extends DomainError {}
export class ProfessorNotFoundError extends DomainError {}
export class InsufficientBalanceError extends DomainError {}
export class LevelNotEligibleError extends DomainError {}

// Lessons
export class InvalidLessonInputError extends DomainError {}
export class RecurrenceInputError extends DomainError {}

// Subscriptions
export class SubscriptionNotFoundError extends DomainError {}
export class SubscriptionAlreadyCanceledError extends DomainError {}
export class SubscriptionCancelPendingError extends DomainError {}
