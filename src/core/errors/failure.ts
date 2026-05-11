import type { DomainError } from "./exceptions"

export type Success<T> = { ok: true; value: T }
export type Failure<E = DomainError> = { ok: false; error: E }
export type Result<T, E = DomainError> = Success<T> | Failure<E>

export const ok = <T>(value: T): Success<T> => ({ ok: true, value })
export const fail = <E>(error: E): Failure<E> => ({ ok: false, error })
