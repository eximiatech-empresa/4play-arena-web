import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Termos de Uso | 4Play Arena",
  description: "Termos e condições de uso dos aplicativos 4Play Arena e 4Play Arena Gestão.",
}

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 py-12 px-5">
      <article className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 md:p-10 space-y-6 shadow-sm">
        <header className="space-y-2 border-b border-zinc-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            4Play Arena
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
          <p className="text-sm text-zinc-500">Última atualização: 23 de novembro de 2026</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Aceitação</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            Ao criar uma conta ou utilizar os aplicativos <strong>4Play Arena Aluno</strong>,{" "}
            <strong>4Play Arena Gestão</strong> ou o painel web, você concorda com estes Termos de Uso e
            com nossa{" "}
            <Link href="/privacidade" className="text-orange-600 underline font-medium">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Conta e responsabilidade</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            O usuário é responsável pela veracidade das informações cadastrais e pela guarda de sua
            senha de acesso. Contas de professores e administradores destinam-se exclusivamente ao
            uso autorizado pela equipe da 4Play Arena.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Agendamentos, Plays e cancelamentos</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            O check-in nas aulas utiliza o saldo de Plays disponibilizado pela administração da
            arena. Cancelamentos realizados com antecedência mínima de 4 horas garantem devolução
            integral dos Plays. Aulas canceladas pela arena geram estorno automático para todos os
            alunos inscritos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Encerramento de conta</h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            O usuário pode encerrar e excluir sua conta a qualquer momento pelo aplicativo ou pela
            página{" "}
            <Link href="/excluir-conta" className="text-orange-600 underline font-medium">
              Excluir Conta
            </Link>
            .
          </p>
        </section>

        <footer className="pt-4 border-t border-zinc-200 flex flex-wrap gap-4 text-xs text-zinc-500">
          <Link href="/privacidade" className="hover:text-zinc-900 underline">
            Política de Privacidade
          </Link>
          <Link href="/suporte" className="hover:text-zinc-900 underline">
            Suporte
          </Link>
          <Link href="/excluir-conta" className="hover:text-zinc-900 underline">
            Excluir Conta
          </Link>
        </footer>
      </article>
    </main>
  )
}
