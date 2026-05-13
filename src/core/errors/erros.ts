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

  // Wallet / Plays
  PLANO_EXPIRADO: "Seu plano de Plays expirou. Renove para realizar o check-in.",
  TURMA_LOTADA: "Esta turma já atingiu o número máximo de alunos.",

  // Subscriptions
  ASSINATURA_NAO_ENCONTRADA: "Assinatura não encontrada.",
  ASSINATURA_JA_CANCELADA: "Assinatura já cancelada.",
  CANCELAMENTO_JA_SOLICITADO: "Cancelamento já solicitado para esta assinatura.",

  // Admin Plans
  PLANO_ID_DUPLICADO: (id: string) => `Já existe um plano com o ID "${id}".`,
  PLANO_DADOS_INVALIDOS: "Dados do plano inválidos.",
  PACOTE_ID_DUPLICADO: (id: string) => `Já existe um pacote com o ID "${id}".`,

  // Package Purchase
  PACOTE_PLAYS_INVALIDO: "O pacote deve conter pelo menos 1 Play.",
  PLANO_EXPIRADO_PACOTE: "Seu plano está expirado. Renove o plano antes de comprar um pacote extra.",
} as const
