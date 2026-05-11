export const ERROS = {
  NAO_AUTENTICADO: "Usuário não logado",
  CHECK_IN_NAO_LIBERADO: "O check-in para esta aula ainda não está liberado.",
  AULA_ENCERRADA: "Esta aula já foi encerrada.",
  PROFESSOR_NAO_ENCONTRADO: (id: string) =>
    `Professor "${id}" não encontrado na tabela de preços.`,
} as const
