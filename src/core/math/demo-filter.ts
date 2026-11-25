// Regra central para contas e dados demo (revisores da Apple e do Google).
//
// Documentos demo carregam `isDemo: true` em `users`, `lessons`, `professors` e
// `turma-requests`. Transacoes (`transactions`, `teacher_transactions`) sao
// criadas por Cloud Functions e NAO tem o flag: sao identificadas pelo dono
// (studentId, walletId ou teacherId) pertencer a um usuario demo.
//
// Toda filtragem de demo no painel deve passar por estas funcoes, para que a
// regra fique em um unico lugar.

/** True quando o documento (cru do Firestore ou ja mapeado) e demo. */
export function isDemoDoc(data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  return (data as { isDemo?: unknown }).isDemo === true
}

/** Remove documentos demo de uma lista, a menos que `includeDemo` seja true. */
export function excludeDemo<T>(items: readonly T[], includeDemo = false): T[] {
  return includeDemo ? [...items] : items.filter((item) => !isDemoDoc(item))
}

/** Campos que apontam para o dono de transacoes e logs. */
const OWNER_FIELDS = ["studentId", "walletId", "teacherId", "targetId", "userId"] as const

/**
 * True quando algum campo de dono do documento aponta para um usuario demo.
 * Usado em colecoes sem o flag (transacoes, audit logs).
 */
export function isOwnedByDemo(data: unknown, demoUserIds: ReadonlySet<string>): boolean {
  if (demoUserIds.size === 0 || !data || typeof data !== "object") return false
  const record = data as Record<string, unknown>
  return OWNER_FIELDS.some((field) => {
    const value = record[field]
    return typeof value === "string" && demoUserIds.has(value)
  })
}

/** Remove documentos com o flag demo ou pertencentes a um usuario demo. */
export function excludeDemoOwned<T>(items: readonly T[], demoUserIds: ReadonlySet<string>): T[] {
  return items.filter((item) => !isDemoDoc(item) && !isOwnedByDemo(item, demoUserIds))
}
