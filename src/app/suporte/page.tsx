import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Suporte | 4Play Arena",
  description:
    "Central de ajuda e contato de suporte para os aplicativos 4Play Arena e 4Play Gestão.",
}

export default function SuportePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 py-12 px-5">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 md:p-10 space-y-6 shadow-sm">
        <header className="space-y-2 border-b border-zinc-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            4Play Arena · Central de Suporte
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Como podemos ajudar?</h1>
          <p className="text-sm text-zinc-600">
            Atendimento técnico para alunos, professores e administradores dos aplicativos{" "}
            <strong>4Play Arena</strong> e <strong>4Play Gestão</strong>.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              E-mail de Suporte
            </h2>
            <a
              href="mailto:suporte@eximiatech.com.br"
              className="text-base font-semibold text-orange-600 hover:underline block"
            >
              suporte@eximiatech.com.br
            </a>
            <p className="text-xs text-zinc-500">
              Tempo médio de resposta: até 1 dia útil (segunda a sexta, 9h às 18h BRT).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Exclusão de Conta e Dados
            </h2>
            <Link
              href="/excluir-conta"
              className="text-base font-semibold text-orange-600 hover:underline block"
            >
              Solicitar exclusão de conta →
            </Link>
            <p className="text-xs text-zinc-500">
              Também disponível no aplicativo em Perfil → Excluir minha conta.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Perguntas Frequentes</h2>
          <div className="space-y-3 text-sm text-zinc-700">
            <div className="p-4 rounded-xl border border-zinc-200">
              <p className="font-semibold text-zinc-900">Como funciona meu saldo de Plays?</p>
              <p className="mt-1">
                Seu saldo de Plays e plano são gerenciados diretamente pela administração da 4Play
                Arena. Toda movimentação (créditos, aulas e estornos) fica disponível na aba
                Carteira do aplicativo.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200">
              <p className="font-semibold text-zinc-900">
                Qual o prazo de cancelamento com devolução de Plays?
              </p>
              <p className="mt-1">
                Cancelamentos realizados com pelo menos 4 horas de antecedência antes do início da
                aula geram estorno automático dos Plays para sua carteira.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200">
              <p className="font-semibold text-zinc-900">Esqueci minha senha de acesso</p>
              <p className="mt-1">
                Na tela de login do aplicativo ou do painel web, toque em &ldquo;Esqueci minha
                senha&rdquo; para receber um link de redefinição no e-mail cadastrado.
              </p>
            </div>
          </div>
        </section>

        <footer className="pt-4 border-t border-zinc-200 flex flex-wrap gap-4 text-xs text-zinc-500">
          <Link href="/privacidade" className="hover:text-zinc-900 underline">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="hover:text-zinc-900 underline">
            Termos de Uso
          </Link>
          <Link href="/excluir-conta" className="hover:text-zinc-900 underline">
            Excluir Conta
          </Link>
        </footer>
      </div>
    </main>
  )
}
