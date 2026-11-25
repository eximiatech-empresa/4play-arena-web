"use client"

import { useState } from "react"
import Link from "next/link"
import { signInWithEmailAndPassword } from "firebase/auth"
import { getFunctions, httpsCallable } from "firebase/functions"
import { firebaseApp } from "@/lib/firebase/app"
import { getFirebaseAuth } from "@/lib/firebase/auth"

export default function ExcluirContaPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)

    if (confirmText.trim().toUpperCase() !== "EXCLUIR") {
      setStatus({ type: "error", message: 'Digite "EXCLUIR" para confirmar a operação.' })
      return
    }

    setLoading(true)
    try {
      const auth = getFirebaseAuth()
      await signInWithEmailAndPassword(auth, email.trim(), password)
      const functions = getFunctions(firebaseApp, "southamerica-east1")
      const deleteMyAccount = httpsCallable(functions, "deleteMyAccount")
      await deleteMyAccount()
      await auth.signOut()
      setStatus({
        type: "success",
        message: "Sua conta e seus dados pessoais foram excluídos permanentemente.",
      })
      setEmail("")
      setPassword("")
      setConfirmText("")
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível validar suas credenciais. Confira e-mail e senha."
      setStatus({ type: "error", message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 py-12 px-5">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 space-y-6 shadow-sm">
        <header className="space-y-2 border-b border-zinc-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600">
            4Play Arena · Exclusão de Conta e Dados
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Excluir minha conta</h1>
          <p className="text-sm text-zinc-600">
            Esta ação é permanente e remove seu acesso, foto de perfil e dados cadastrais nos
            aplicativos <strong>4Play Arena Aluno</strong> e <strong>4Play Arena Gestão</strong>.
          </p>
        </header>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 space-y-1">
          <p className="font-semibold">O que é excluído imediatamente:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Credenciais de login (Firebase Authentication) e token de notificações push.</li>
            <li>Perfil cadastral (nome, e-mail, telefone) e foto armazenada.</li>
            <li>Participação em aulas futuras agendadas.</li>
          </ul>
        </div>

        {status && (
          <div
            className={`rounded-xl p-4 text-sm font-medium border ${
              status.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleDelete} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-zinc-600">E-mail da conta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-zinc-600">Senha atual</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-zinc-600">
              Digite EXCLUIR para confirmar
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {loading ? "Excluindo conta..." : "Excluir conta permanentemente"}
          </button>
        </form>

        <p className="text-xs text-zinc-500">
          Caso não consiga acessar sua conta, envie uma solicitação para{" "}
          <a href="mailto:guilherme.queiroz@eximiatech.com.br" className="text-orange-600 underline">
            guilherme.queiroz@eximiatech.com.br
          </a>{" "}
          informando o e-mail cadastrado. A exclusão é concluída em até 7 dias e você recebe a confirmação por e-mail.
        </p>

        <footer className="pt-4 border-t border-zinc-200 flex flex-wrap gap-4 text-xs text-zinc-500">
          <Link href="/privacidade" className="hover:text-zinc-900 underline">
            Política de Privacidade
          </Link>
          <Link href="/suporte" className="hover:text-zinc-900 underline">
            Suporte
          </Link>
          <Link href="/termos" className="hover:text-zinc-900 underline">
            Termos de Uso
          </Link>
        </footer>
      </div>
    </main>
  )
}
