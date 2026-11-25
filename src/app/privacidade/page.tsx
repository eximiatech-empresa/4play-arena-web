import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade | 4Play Arena",
  description:
    "Política de Privacidade e proteção de dados pessoais (LGPD) dos aplicativos 4Play Arena e 4Play Arena Gestão.",
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 py-12 px-5">
      <article className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 md:p-10 space-y-6 shadow-sm">
        <header className="space-y-2 border-b border-zinc-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            4Play Arena · LGPD (Lei nº 13.709/2018)
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="text-sm text-zinc-500">Última atualização: 23 de novembro de 2026</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Quem somos e escopo</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            Esta Política de Privacidade descreve como a 4Play Arena e a Exímia Tech coletam,
            utilizam e protegem os dados pessoais dos usuários dos aplicativos móveis{" "}
            <strong>4Play Arena Aluno</strong> (para alunos), <strong>4Play Arena Gestão</strong> (para
            professores e administradores) e do painel web de gestão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Dados pessoais coletados</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-zinc-700 space-y-1">
            <li>
              <strong>Dados cadastrais:</strong> nome completo, endereço de e-mail, telefone e
              foto de perfil (opcional).
            </li>
            <li>
              <strong>Dados esportivos e operacionais:</strong> nível técnico, turma vinculada,
              histórico de aulas, presenças, check-ins, cancelamentos e saldo de Plays.
            </li>
            <li>
              <strong>Dados de grupo familiar (opcional):</strong> nomes e vínculo de dependentes
              cadastrados pelo titular.
            </li>
            <li>
              <strong>Identificadores técnicos:</strong> token de notificação push (Firebase Cloud
              Messaging) para envio de lembretes de aula e avisos da arena.
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-zinc-700">
            Não coletamos dados de cartão de crédito ou informações bancárias sensíveis dentro dos
            aplicativos móveis.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Finalidade e base legal</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            Tratamos seus dados exclusivamente para execução de contrato e prestação do serviço
            esportivo: autenticação de acesso, agendamento de aulas, controle de presença, gestão de
            créditos (Plays), comunicação operacional via push e melhoria da experiência na arena.
            Não vendemos nem compartilhamos dados pessoais com terceiros para fins publicitários.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Armazenamento e segurança</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            Os dados são armazenados na infraestrutura Google Cloud / Firebase (região
            southamerica-east1), protegidos por criptografia em trânsito (HTTPS/TLS), autenticação
            segura e regras estritas de controle de acesso por perfil.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Retenção e exclusão da conta</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            Você pode solicitar a exclusão definitiva da sua conta e dados pessoais a qualquer
            momento diretamente no aplicativo (Perfil → Excluir minha conta) ou pela nossa página{" "}
            <Link href="/excluir-conta" className="text-orange-600 underline font-medium">
              Excluir Conta
            </Link>
            . Após a confirmação, seu acesso, foto de perfil e dados cadastrais são removidos de
            forma permanente. Registros estritamente necessários para cumprimento de obrigações
            legais ou auditoria financeira da arena podem ser mantidos de forma anonimizada.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Direitos do titular e contato</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            Em conformidade com a LGPD, você tem direito a confirmar a existência de tratamento,
            acessar, corrigir, exportar ou eliminar seus dados. Para exercer seus direitos ou tirar
            dúvidas, acesse nossa página de{" "}
            <Link href="/suporte" className="text-orange-600 underline font-medium">
              Suporte
            </Link>{" "}
            ou envie e-mail para{" "}
            <a
              href="mailto:guilherme.queiroz@eximiatech.com.br"
              className="text-orange-600 underline font-medium"
            >
              guilherme.queiroz@eximiatech.com.br
            </a>
            .
          </p>
        </section>

        <footer className="pt-4 border-t border-zinc-200 flex flex-wrap gap-4 text-xs text-zinc-500">
          <Link href="/termos" className="hover:text-zinc-900 underline">
            Termos de Uso
          </Link>
          <Link href="/suporte" className="hover:text-zinc-900 underline">
            Suporte
          </Link>
          <Link href="/excluir-conta" className="hover:text-zinc-900 underline">
            Excluir Conta
          </Link>
          <Link href="/login" className="hover:text-zinc-900 underline">
            Acessar Painel
          </Link>
        </footer>
      </article>
    </main>
  )
}
