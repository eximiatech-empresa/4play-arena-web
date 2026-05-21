"use client"

import { useState, useCallback } from "react"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firestore"
import { waitForAuthInit } from "@/lib/firebase/auth"
import { UserSchema } from "@/core/entities/user"
import { TeacherTransactionSchema } from "@/core/entities/teacher-wallet"
import { PROFESSOR_MAP } from "@/core/constants/professors"
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "ok" | "warn" | "error" | "info"

interface DebugStep {
  id: string
  label: string
  status: StepStatus
  summary: string
  detail: unknown
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<StepStatus, React.ReactNode> = {
  ok:   <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  error:<AlertCircle  className="w-4 h-4 text-red-500   shrink-0" />,
  info: <Info         className="w-4 h-4 text-blue-500  shrink-0" />,
}

const STATUS_BG: Record<StepStatus, string> = {
  ok:   "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900",
  warn: "border-amber-200  bg-amber-50  dark:bg-amber-950/40  dark:border-amber-900",
  error:"border-red-200    bg-red-50    dark:bg-red-950/40    dark:border-red-900",
  info: "border-blue-200   bg-blue-50   dark:bg-blue-950/40   dark:border-blue-900",
}

// ─── Step card ────────────────────────────────────────────────────────────────

function DebugStepCard({ step }: { step: DebugStep }) {
  const [open, setOpen] = useState(step.status === "error" || step.status === "warn")

  return (
    <div className={cn("rounded-xl border px-4 py-3 space-y-2", STATUS_BG[step.status])}>
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {STATUS_ICON[step.status]}
        <span className="text-sm font-semibold flex-1 text-foreground">{step.label}</span>
        <span className="text-xs text-zinc-500 max-w-[220px] truncate">{step.summary}</span>
        {open
          ? <ChevronDown  className="w-4 h-4 text-zinc-400 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
      </button>
      {open && (
        <pre className="text-[11px] font-mono rounded-lg p-3 overflow-auto max-h-[320px] whitespace-pre-wrap break-all bg-black/10 dark:bg-white/5 text-zinc-700 dark:text-zinc-300">
          {JSON.stringify(step.detail, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Diagnostic engine ────────────────────────────────────────────────────────

async function runDiagnostic(): Promise<DebugStep[]> {
  const steps: DebugStep[] = []
  const LOG = (tag: string, ...args: unknown[]) =>
    console.log(`%c[4Play Debug] ${tag}`, "color:#6366f1;font-weight:bold", ...args)

  LOG("══════════════════════════════════")
  LOG("Iniciando diagnóstico da carteira do professor")
  LOG("══════════════════════════════════")

  // ── STEP 1: Firebase Auth ────────────────────────────────────────────────────
  let firebaseUID: string | null = null
  try {
    const fbUser = await waitForAuthInit()
    firebaseUID = fbUser?.uid ?? null
    LOG("Step 1 — Firebase Auth", { uid: fbUser?.uid, email: fbUser?.email, emailVerified: fbUser?.emailVerified })
    steps.push({
      id: "auth",
      label: "Step 1 — Firebase Auth",
      status: fbUser ? "ok" : "error",
      summary: fbUser ? `uid=${fbUser.uid}` : "NÃO AUTENTICADO",
      detail: fbUser
        ? { uid: fbUser.uid, email: fbUser.email, emailVerified: fbUser.emailVerified }
        : { erro: "Nenhum usuário autenticado no Firebase Auth" },
    })
  } catch (err) {
    LOG("Step 1 — ERRO", err)
    steps.push({ id: "auth", label: "Step 1 — Firebase Auth", status: "error", summary: "Erro ao obter auth", detail: String(err) })
    return steps
  }
  if (!firebaseUID) return steps

  // ── STEP 2: Firestore users/{uid} raw ────────────────────────────────────────
  let rawDoc: Record<string, unknown> | null = null
  try {
    const snap = await getDoc(doc(db, "users", firebaseUID))
    rawDoc = snap.exists() ? (snap.data() as Record<string, unknown>) : null
    LOG(`Step 2 — Firestore users/${firebaseUID}`, rawDoc)
    steps.push({
      id: "firestore",
      label: `Step 2 — Documento Firestore users/${firebaseUID}`,
      status: snap.exists() ? "ok" : "error",
      summary: snap.exists()
        ? `role=${rawDoc?.role} | earningsBalance=${rawDoc?.earningsBalance} | mustChangePassword=${rawDoc?.mustChangePassword}`
        : "DOCUMENTO NÃO EXISTE",
      detail: rawDoc ?? { erro: "Documento não encontrado. Criar professor via admin antes de fazer login." },
    })
  } catch (err) {
    LOG("Step 2 — ERRO Firestore", err)
    steps.push({ id: "firestore", label: `Step 2 — Firestore users/${firebaseUID}`, status: "error", summary: "Erro de leitura (verifique as regras de segurança)", detail: String(err) })
    return steps
  }
  if (!rawDoc) return steps

  // ── STEP 3: Campos obrigatórios do professor ──────────────────────────────────
  const REQUIRED = ["uid", "name", "email", "role", "isActive", "mustChangePassword", "createdAt", "lessonPrice", "earningsBalance"]
  const missing = REQUIRED.filter((f) => !(f in rawDoc!))
  const wrong: string[] = []
  if (rawDoc.role !== "TEACHER") wrong.push(`role="${rawDoc.role}" (esperado: "TEACHER")`)
  if (rawDoc.uid !== firebaseUID)  wrong.push(`uid="${rawDoc.uid}" ≠ document ID "${firebaseUID}"`)
  LOG("Step 3 — Verificação de campos", { rawDoc, missing, wrong })
  steps.push({
    id: "fields",
    label: "Step 3 — Campos obrigatórios do professor",
    status: missing.length === 0 && wrong.length === 0 ? "ok" : "error",
    summary: missing.length === 0 && wrong.length === 0
      ? "Todos os campos OK"
      : [...missing.map((f) => `FALTANDO: ${f}`), ...wrong].join(" | "),
    detail: {
      camposPresentes: REQUIRED.reduce((a, f) => ({ ...a, [f]: rawDoc![f] ?? "⚠️ AUSENTE" }), {}),
      camposFaltando: missing.length > 0 ? missing : "nenhum",
      camposInvalidos: wrong.length > 0 ? wrong : "nenhum",
      _nota: "uid deve ser igual ao ID do documento Firebase Auth. earningsBalance deve ser um number.",
    },
  })

  // ── STEP 4: UserSchema.safeParse ──────────────────────────────────────────────
  const parsed = UserSchema.safeParse(rawDoc)
  LOG("Step 4 — UserSchema.safeParse", parsed.success ? "✅ OK" : "❌ FALHOU", parsed.success ? parsed.data : parsed.error.format())
  steps.push({
    id: "schema",
    label: "Step 4 — UserSchema.safeParse(rawDoc)",
    status: parsed.success ? "ok" : "error",
    summary: parsed.success
      ? `Parse OK — role=${parsed.data.role}, uid=${parsed.data.uid}`
      : "FALHOU — currentUser ficará null → teacherId=null → query desabilitada → balance=0",
    detail: parsed.success
      ? { resultado: "OK", dados: parsed.data }
      : { resultado: "FALHOU", erros: parsed.error.format(), raw: rawDoc },
  })
  if (!parsed.success) return steps

  const user = parsed.data

  // ── STEP 5: mustChangePassword ────────────────────────────────────────────────
  LOG("Step 5 — mustChangePassword", user.mustChangePassword)
  steps.push({
    id: "mcp",
    label: "Step 5 — mustChangePassword",
    status: user.mustChangePassword ? "error" : "ok",
    summary: user.mustChangePassword
      ? "TRUE — DashboardShell redireciona para /force-password-change e retorna null (wallet NÃO renderiza)"
      : "false — OK, wallet renderiza normalmente",
    detail: {
      mustChangePassword: user.mustChangePassword,
      consequencia: user.mustChangePassword
        ? "O professor precisa trocar a senha antes de acessar a carteira. Altere mustChangePassword para false no Firestore ou faça o professor trocar a senha."
        : "Nenhuma ação necessária",
    },
  })
  if (user.mustChangePassword) return steps

  // ── STEP 6: teacherId e earningsBalance no doc real ───────────────────────────
  const teacherId = user.uid
  const realEarnings = typeof rawDoc.earningsBalance === "number" ? rawDoc.earningsBalance : 0
  LOG("Step 6 — teacherId e earningsBalance", { teacherId, realEarnings })
  steps.push({
    id: "earnings-real",
    label: "Step 6 — teacherId e earningsBalance (doc real)",
    status: realEarnings > 0 ? "ok" : "warn",
    summary: `teacherId="${teacherId}" | earningsBalance=R$${realEarnings.toFixed(2)}`,
    detail: {
      teacherId,
      earningsBalance: rawDoc.earningsBalance,
      tipo: typeof rawDoc.earningsBalance,
      observacao: realEarnings === 0
        ? "earningsBalance é 0. Pode ser que check-ins anteriores foram para o documento slug (paulinho/biel/etc)."
        : "earningsBalance tem valor — deveria aparecer na carteira.",
    },
  })

  // ── STEP 7: Slug legado ───────────────────────────────────────────────────────
  const teacherName = user.name
  const legacyEntry = Object.entries(PROFESSOR_MAP).find(
    ([, cfg]) => cfg.name.toLowerCase() === teacherName.toLowerCase(),
  )
  const legacySlug = legacyEntry?.[0] ?? null
  const hasLegacy = !!legacySlug && legacySlug !== teacherId
  LOG("Step 7 — Slug legado", { teacherName, legacySlug, hasLegacy })
  steps.push({
    id: "slug",
    label: "Step 7 — Slug legado no PROFESSOR_MAP",
    status: hasLegacy ? "warn" : "info",
    summary: hasLegacy
      ? `nome="${teacherName}" → slug="${legacySlug}" → dados históricos podem estar lá`
      : legacySlug === teacherId
        ? "slug == teacherId (sem legacy)"
        : `Nome "${teacherName}" não encontrado no PROFESSOR_MAP (sem legacy)`,
    detail: {
      teacherName,
      legacySlug,
      hasLegacy,
      mapEntry: legacyEntry?.[1] ?? null,
      _nota: hasLegacy
        ? `Check-ins anteriores foram salvos com teacherId="${legacySlug}". A carteira precisa buscá-los também.`
        : "Sem slug legado — todos os dados devem estar no UID real.",
    },
  })

  // ── STEP 8: Documento slug ────────────────────────────────────────────────────
  let slugEarnings = 0
  if (hasLegacy && legacySlug) {
    try {
      const slugSnap = await getDoc(doc(db, "users", legacySlug))
      const slugData = slugSnap.exists() ? (slugSnap.data() as Record<string, unknown>) : null
      slugEarnings = slugData && typeof slugData.earningsBalance === "number" ? slugData.earningsBalance : 0
      LOG(`Step 8 — users/${legacySlug} (doc slug)`, slugData)
      steps.push({
        id: "slug-doc",
        label: `Step 8 — Documento slug users/${legacySlug}`,
        status: slugSnap.exists() && slugEarnings > 0 ? "warn" : "info",
        summary: slugSnap.exists()
          ? `earningsBalance=R$${slugEarnings.toFixed(2)} (check-ins históricos foram aqui)`
          : "Documento slug não existe",
        detail: slugData ?? { info: "Documento slug não existe no Firestore" },
      })
    } catch (err) {
      LOG(`Step 8 — ERRO ao ler users/${legacySlug}`, err)
      steps.push({ id: "slug-doc", label: `Step 8 — Documento slug users/${legacySlug}`, status: "warn", summary: "Erro ao ler slug doc", detail: String(err) })
    }
  }

  // ── STEP 9: teacher_transactions por teacherId=UID ───────────────────────────
  let txUidCount = 0
  try {
    const txByUid = await getDocs(query(collection(db, "teacher_transactions"), where("teacherId", "==", teacherId)))
    txUidCount = txByUid.docs.length
    const txUidParsed = txByUid.docs.map((d) => {
      const raw = { ...d.data(), id: d.id }
      const r = TeacherTransactionSchema.safeParse(raw)
      return { docId: d.id, raw, parseOk: r.success, parseError: r.success ? null : r.error.format() }
    })
    LOG(`Step 9 — teacher_transactions teacherId="${teacherId}"`, txUidCount, "docs", txUidParsed)
    steps.push({
      id: "tx-uid",
      label: `Step 9 — teacher_transactions teacherId="${teacherId}" (UID real)`,
      status: txUidCount > 0 ? "ok" : "warn",
      summary: `${txUidCount} doc(s) encontrado(s) | ${txUidParsed.filter((t) => t.parseOk).length} parse OK | ${txUidParsed.filter((t) => !t.parseOk).length} parse FALHOU`,
      detail: txUidCount > 0
        ? txUidParsed
        : { aviso: `Nenhuma transação com teacherId="${teacherId}". Check-ins anteriores podem estar no slug "${legacySlug}".` },
    })
  } catch (err) {
    LOG("Step 9 — ERRO", err)
    steps.push({ id: "tx-uid", label: `Step 9 — teacher_transactions por UID`, status: "error", summary: "Erro (verifique regras de segurança)", detail: String(err) })
  }

  // ── STEP 10: teacher_transactions por slug ────────────────────────────────────
  let txSlugCount = 0
  if (hasLegacy && legacySlug) {
    try {
      const txBySlug = await getDocs(query(collection(db, "teacher_transactions"), where("teacherId", "==", legacySlug)))
      txSlugCount = txBySlug.docs.length
      const txSlugParsed = txBySlug.docs.map((d) => {
        const raw = { ...d.data(), id: d.id }
        const r = TeacherTransactionSchema.safeParse(raw)
        return { docId: d.id, raw, parseOk: r.success, parseError: r.success ? null : r.error.format() }
      })
      LOG(`Step 10 — teacher_transactions teacherId="${legacySlug}" (slug)`, txSlugCount, "docs", txSlugParsed)
      steps.push({
        id: "tx-slug",
        label: `Step 10 — teacher_transactions teacherId="${legacySlug}" (slug)`,
        status: txSlugCount > 0 ? "warn" : "info",
        summary: `${txSlugCount} doc(s) encontrado(s) | ${txSlugParsed.filter((t) => t.parseOk).length} parse OK | ${txSlugParsed.filter((t) => !t.parseOk).length} parse FALHOU`,
        detail: txSlugCount > 0
          ? txSlugParsed
          : { info: `Nenhuma transação com teacherId="${legacySlug}" (slug).` },
      })
    } catch (err) {
      LOG("Step 10 — ERRO", err)
      steps.push({ id: "tx-slug", label: `Step 10 — teacher_transactions por slug`, status: "error", summary: "Erro (verifique regras de segurança)", detail: String(err) })
    }
  }

  // ── STEP 11: Resumo e diagnóstico ────────────────────────────────────────────
  const totalBalance = realEarnings + slugEarnings
  const totalTx = txUidCount + txSlugCount
  LOG("Step 11 — Resumo final", {
    teacherId, realEarnings, slugEarnings, totalBalance, txUidCount, txSlugCount, totalTx
  })

  let diagnostico: string
  if (totalTx === 0 && totalBalance === 0) {
    diagnostico = "Nenhum dado encontrado. O professor ainda não recebeu nenhum check-in, ou os dados estão em outro documento não mapeado."
  } else if (txUidCount === 0 && txSlugCount > 0) {
    diagnostico = `Todos os ${txSlugCount} check-in(s) estão no slug "${legacySlug}". A carteira está buscando por ambos — deve exibir corretamente. Se não exibir, verifique regras de segurança do Firestore.`
  } else if (txUidCount > 0) {
    diagnostico = `${txUidCount} transação(ões) no UID real + ${txSlugCount} no slug. Tudo OK — deveria aparecer na carteira.`
  } else {
    diagnostico = "Verificar steps individuais para identificar o problema."
  }

  steps.push({
    id: "summary",
    label: "Step 11 — Resumo do diagnóstico",
    status: totalTx > 0 || totalBalance > 0 ? "info" : "error",
    summary: `saldo=R$${totalBalance.toFixed(2)} | ${totalTx} transação(ões) total`,
    detail: {
      teacherId,
      earningsBalance_docReal: realEarnings,
      earningsBalance_docSlug: slugEarnings,
      totalBalance,
      transacoes_porUID: txUidCount,
      transacoes_porSlug: txSlugCount,
      transacoes_total: totalTx,
      diagnostico,
    },
  })

  LOG("══════════════════════════════════")
  LOG("Diagnóstico concluído")
  LOG("══════════════════════════════════")

  return steps
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeacherWalletDebugPanel() {
  const [steps, setSteps] = useState<DebugStep[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [ran, setRan] = useState(false)

  const run = useCallback(async () => {
    setIsLoading(true)
    setSteps([])
    try {
      const result = await runDiagnostic()
      setSteps(result)
    } catch (err) {
      setSteps([{ id: "fatal", label: "Erro fatal no diagnóstico", status: "error", summary: String(err), detail: err }])
    } finally {
      setIsLoading(false)
      setRan(true)
    }
  }, [])

  return (
    <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Debug — Carteira do Professor</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Diagnóstico passo a passo. Verifique também o console do browser (F12) para os logs com prefixo{" "}
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-xs">[4Play Debug]</code>.
          </p>
        </div>
        <button
          onClick={run}
          disabled={isLoading}
          className="flex shrink-0 items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          {ran ? "Re-executar" : "Executar diagnóstico"}
        </button>
      </div>

      {/* O que verificar no Firebase */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-5">
        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">
          Campos obrigatórios no Firestore — collection <code>users</code>, document ID = Firebase Auth UID
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono">
          {[
            ["uid",                 "string — IGUAL ao ID do documento (Firebase Auth UID)"],
            ["name",               "string — nome do professor"],
            ["email",              "string — e-mail de login"],
            ["role",               '"TEACHER" — maiúsculo, exato'],
            ["isActive",           "boolean — true"],
            ["mustChangePassword", "boolean — false (após trocar senha)"],
            ["createdAt",          "string — data ISO 8601"],
            ["lessonPrice",        "number ≥ 0 — preço em plays por aula"],
            ["earningsBalance",    "number ≥ 0 — ganhos acumulados em R$"],
          ].map(([field, desc]) => (
            <div key={field} className="flex gap-2 py-0.5">
              <span className="text-blue-700 dark:text-blue-400 shrink-0 w-36">{field}:</span>
              <span className="text-zinc-600 dark:text-zinc-400">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">
          ⚠️ NÃO deve ter: <code>walletBalance</code>, <code>currentPlanId</code> (campos de aluno)
        </p>
      </div>

      {/* Estado inicial */}
      {!ran && !isLoading && (
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
          <p className="text-sm text-zinc-400">Clique em "Executar diagnóstico" para iniciar a análise passo a passo.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16 flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Executando diagnóstico (verifique o console para logs em tempo real)...</p>
        </div>
      )}

      {/* Steps */}
      {!isLoading && steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step) => (
            <DebugStepCard key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  )
}
