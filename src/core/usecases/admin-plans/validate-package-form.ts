// src/core/usecases/admin-plans/validate-package-form.ts

const SLUG_REGEX = /^[a-z0-9-]+$/

export interface PackageFormIssue {
  message: string
}

export interface ValidatePackageFormInput {
  label?: string
  id?: string
  plays?: number
  priceInCents?: number
  existingIds: string[]
  isEdit: boolean
}

export function validatePackageForm(input: ValidatePackageFormInput): PackageFormIssue[] {
  const issues: PackageFormIssue[] = []

  if (!input.label || input.label.trim().length < 2)
    issues.push({ message: "Nome exibido é obrigatório (mín. 2 caracteres)" })

  if (!input.isEdit) {
    const id = input.id?.trim() ?? ""
    if (id.length === 0) {
      issues.push({ message: "ID é obrigatório" })
    } else if (!SLUG_REGEX.test(id)) {
      issues.push({ message: "ID deve ter apenas letras minúsculas, números e hifens" })
    } else if (input.existingIds.includes(id)) {
      issues.push({ message: `ID "${id}" já está em uso por outro pacote` })
    }
  }

  const plays = input.plays
  if (!plays || isNaN(plays) || plays <= 0 || !Number.isInteger(plays))
    issues.push({ message: "Quantidade de Plays deve ser um inteiro maior que zero" })

  const price = input.priceInCents
  if (!price || isNaN(price) || price <= 0)
    issues.push({ message: "Preço deve ser maior que zero" })

  return issues
}
