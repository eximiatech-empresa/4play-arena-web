// src/core/usecases/admin-plans/validate-plan-form.ts

const SLUG_REGEX = /^[a-z0-9-]+$/

export interface PlanFormIssue {
  message: string
}

export interface ValidatePlanFormInput {
  label?: string
  id?: string
  totalPlays?: number
  validityDays?: number
  priceInCents?: number
  existingIds: string[]
  isEdit: boolean
}

export function validatePlanForm(input: ValidatePlanFormInput): PlanFormIssue[] {
  const issues: PlanFormIssue[] = []

  if (!input.label || input.label.trim().length < 2)
    issues.push({ message: "Nome exibido é obrigatório (mín. 2 caracteres)" })

  if (!input.isEdit) {
    const id = input.id?.trim() ?? ""
    if (id.length === 0) {
      issues.push({ message: "ID é obrigatório" })
    } else if (!SLUG_REGEX.test(id)) {
      issues.push({ message: "ID deve ter apenas letras minúsculas, números e hifens" })
    } else if (input.existingIds.includes(id)) {
      issues.push({ message: `ID "${id}" já está em uso por outro plano` })
    }
  }

  const plays = input.totalPlays
  if (!plays || isNaN(plays) || plays <= 0 || !Number.isInteger(plays))
    issues.push({ message: "Total de Plays deve ser um inteiro maior que zero" })

  const days = input.validityDays
  if (!days || isNaN(days) || days <= 0 || !Number.isInteger(days))
    issues.push({ message: "Validade deve ser um inteiro maior que zero" })

  const price = input.priceInCents
  if (!price || isNaN(price) || price <= 0)
    issues.push({ message: "Preço deve ser maior que zero" })

  return issues
}
