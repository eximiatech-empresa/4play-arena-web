import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "./firestore"

/**
 * UIDs das contas demo (revisores das lojas). Usado para excluir transacoes e
 * logs, que nao carregam o flag `isDemo`. Igualdade em campo unico usa o indice
 * automatico do Firestore, sem indice composto novo.
 * Uso restrito a telas de admin (exige leitura da colecao `users`).
 */
export async function getDemoUserIds(): Promise<Set<string>> {
  const snap = await getDocs(query(collection(db, "users"), where("isDemo", "==", true)))
  return new Set(snap.docs.map((d) => d.id))
}
