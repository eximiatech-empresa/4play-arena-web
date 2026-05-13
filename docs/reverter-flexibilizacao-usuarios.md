# Como reverter a flexibilização do Schema de Usuários

Este documento registra como desfazer as alterações feitas para flexibilizar a listagem de usuários provenientes do App Mobile/legado, caso você resolva sanear o banco de dados e queira voltar a forçar a validação estrita.

## 1. Reverter o Schema em `src/core/entities/user.ts`

No momento, o `StudentUserSchema` está com campos opcionais e valores padrão. Quando o banco de dados estiver saneado, retorne os campos para serem estritamente obrigatórios.

**Código atual (Flexível):**
```typescript
export const StudentUserSchema = BaseUserSchema.extend({
  role: z.literal("STUDENT"),
  level: z.string().optional().default("Iniciante"),
  walletBalance: z.preprocess(
    (val) => typeof val === "number" && Number.isNaN(val) ? 0 : val,
    z.number().catch(0)
  ),
  originalTeacherId: z.string().optional().default(""),
  currentPlanId: StudentPlanSchema.optional().default("mensal"),
  planExpiresAt: z.string().optional().default(""),
  planPlayValue: z.preprocess(
    (val) => typeof val === "number" && Number.isNaN(val) ? undefined : val,
    z.number().positive().optional()
  ),
})
```

**Código original (Estrito):**
```typescript
export const StudentUserSchema = BaseUserSchema.extend({
  role: z.literal("STUDENT"),
  level: z.string(),
  walletBalance: z.preprocess(
    (val) => typeof val === "number" && Number.isNaN(val) ? 0 : val,
    z.number().catch(0)
  ),
  originalTeacherId: z.string(),
  currentPlanId: StudentPlanSchema,
  planExpiresAt: z.string(),
  planPlayValue: z.preprocess(
    (val) => typeof val === "number" && Number.isNaN(val) ? undefined : val,
    z.number().positive().optional()
  ),
})
```

## 2. Reverter o Mapper no `src/lib/firebase/firestore.ts`

O schema do item da lista e o fallback do `getAllUsers` podem ser revertidos para falharem duro (hard fail) se um registro quebrado for encontrado, forçando a consistência.

**Remover preprocessors do `UserListItemSchema`:**
Volte de:
```typescript
const UserListItemSchema = z.object({
  uid: z.string().catch(""),
  name: z.string().catch("Usuário sem nome"),
  email: z.string().catch(""),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).catch("STUDENT"),
  isActive: z.boolean().catch(true),
  level: z.string().catch("Iniciante").optional(),
  walletBalance: z.preprocess((val) => Number(val) || 0, z.number().catch(0)).optional(),
  lessonPrice: z.preprocess((val) => Number(val) || 0, z.number().catch(0)).optional(),
  earningsBalance: z.preprocess((val) => Number(val) || 0, z.number().catch(0)).optional(),
  createdAt: z.preprocess((val) => (val ? String(val) : ""), z.string().catch("")).optional(),
})
```
Para:
```typescript
const UserListItemSchema = z.object({
  uid: z.string().catch(""),
  name: z.string().catch("Usuário sem nome"),
  email: z.string().catch(""),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).catch("STUDENT"),
  isActive: z.boolean().catch(true),
  level: z.any().optional(),
  walletBalance: z.any().optional(),
  lessonPrice: z.any().optional(),
  earningsBalance: z.any().optional(),
  createdAt: z.any().optional(),
})
```
*(Ou utilize `z.string()`, `z.number()` estritos no lugar de `z.any()`, conforme sua preferência)*

**Reverter `getAllUsers`:**
Volte para o `.parse()` tradicional, removendo o `.safeParse()` e o bloco de fallback.

```typescript
export async function getAllUsers(): Promise<UserListItem[]> {
  const snap = await getDocs(collection(db, "users"))
  return snap.docs.map((d) => {
    const parsed = UserListItemSchema.parse({ uid: d.id, ...d.data() })
    if (!parsed.uid) parsed.uid = d.id
    return parsed
  })
}
```

## Conclusão

Após realizar o saneamento dos dados (limpar/atualizar os documentos corrompidos antigos no Firestore via script), você poderá aplicar esses passos e garantir um banco de dados saudável e estritamente tipado.