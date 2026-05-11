export const ERROS = {
  // Auth
  NAO_AUTENTICADO: "Usuário não logado",
  USUARIO_NAO_ENCONTRADO: "Usuário não encontrado.",
  USUARIO_INATIVO: "Sua conta foi desativada. Entre em contato com a administração.",
  SESSAO_EXPIRADA: "Sessão expirada. Faça login novamente.",

  // Booking
  CHECK_IN_NAO_LIBERADO: "O check-in para esta aula ainda não está liberado.",
  AULA_NAO_ENCONTRADA: "Aula não encontrada.",
  AULA_ENCERRADA: "Esta aula já foi encerrada.",
  AULA_LOTADA: "Esta aula já está com todas as vagas preenchidas.",
  JA_INSCRITO: "Você já está inscrito nesta aula.",
  SALDO_INSUFICIENTE: "Saldo insuficiente de Plays para realizar o check-in.",
  NIVEL_INSUFICIENTE: "Seu nível não é compatível com o desta aula.",
  PROFESSOR_NAO_ENCONTRADO: (id: string) =>
    `Professor "${id}" não encontrado na tabela de preços.`,

  // Lessons
  INPUT_AULA_INVALIDO: "Dados da aula inválidos.",
  RECORRENCIA_INVALIDA: "A data de término deve ser posterior à data de início da aula.",

  // Subscriptions
  ASSINATURA_NAO_ENCONTRADA: "Assinatura não encontrada.",
  ASSINATURA_JA_CANCELADA: "Assinatura já cancelada.",
  CANCELAMENTO_JA_SOLICITADO: "Cancelamento já solicitado para esta assinatura.",
} as const
