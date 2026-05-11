export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class NotAuthenticatedError extends DomainError {}
export class CheckInNotOpenError extends DomainError {}
export class LessonClosedError extends DomainError {}
export class ProfessorNotFoundError extends DomainError {}
export class InsufficientBalanceError extends DomainError {}
export class LevelNotEligibleError extends DomainError {}
