# Regras de Negócio

## A Moeda: Plays

O sistema opera em **Plays** após a compra do plano. O aluno não paga em R$ por aula — ele consome Plays do saldo. Cada Play tem um valor monetário (`playValue`) fixado no momento da compra do plano e não muda durante a vigência.

**Exemplo:**
- Plano mensal: 80 Plays por R$ 410 → `playValue = R$ 5,125`
- Aluno compra → saldo = 80 Plays
- Faz check-in em uma aula que custa 2 Plays → saldo = 78 Plays

---

## Cálculo de Consumo por Aula

O consumo de Plays de uma aula é determinado por três fatores em sequência:

### 1. Taxa base do professor

Cada professor tem uma taxa de consumo base por aula (em Plays inteiros). Configurada no perfil do professor (`lessonPrice` no Firestore).

| Professor | Taxa base |
|---|---|
| Paulinho | 0.90 Play |
| Marília | 1.35 Play |

### 2. Desconto Off-Peak

Aulas fora do horário de pico recebem 5% de desconto:

```
C_desconto = C_base × 0.95
```

| Janela | Classificação |
|---|---|
| 18h–20h | Pico (sem desconto) |
| < 18h ou > 20h | Off-peak (×0.95) |

### 3. Arredondamento final

Após o desconto, o valor é arredondado:

| Professor | Regra |
|---|---|
| Marília | Sempre `Math.ceil()` (arredondamento para cima) |
| Demais | `Math.round()` (arredondamento padrão) |

### 4. Titularidade (Reserva)

Alunos que não são titulares da turma (reservas ou avulsos) pagam +10% sobre o custo final.

---

## Planos

Os planos são documentos Firestore (coleção `plans`). Os valores de referência estáticos estão em `core/constants/plan-pricing.ts` (`PLAN_CONFIGS`).

| Plano | Plays | Validade | Preço | playValue |
|---|---|---|---|---|
| `mensal` | 80 | 30 dias | R$ 410 | R$ 5,125 |
| `trimestral` | 240 | 90 dias | R$ 1.140 | R$ 4,75 |
| `semestral` | 480 | 180 dias | R$ 2.070 | R$ 4,3125 |

### Resolução do playValue

O `playValue` é resolvido na ordem abaixo (fallback em cadeia):

1. `userData.wallet?.playValue` — congelado no momento da compra do plano
2. `userData.planPlayValue` — campo legado (docs antigos)
3. `PLAN_CONFIGS[currentPlanId]?.playValue` — valor estático do plano atual
4. `PLAN_CONFIGS.mensal.playValue` — fallback final

Implementado em: `core/math/resolve-play-value.ts`

---

## Pacotes Extras (Add-on)

Alunos podem comprar pacotes de Plays avulsos sem alterar o plano ativo nem a data de expiração. O `playValue` dos pacotes extras é herdado do plano ativo do aluno no momento da compra.

Documentos Firestore: coleção `play-packages`.

---

## Acesso e Check-in

### Level Gate

O nível do aluno deve ser maior ou igual ao nível da aula:

```
nível_aluno >= nível_aula
```

Exemplo: aluno nível "B" pode acessar aulas B, C, D… mas é bloqueado em aulas A e Profissional.

### Janela de Check-in

| Tempo antes da aula | Quem pode fazer check-in |
|---|---|
| > T−24h | Ninguém (aula ainda não aberta) |
| T−24h até T−6h | Apenas alunos titulares da turma |
| T−6h até o início | Qualquer aluno elegível (nível + saldo) |
| Após início | Fechado |

### Enums de Status (`CheckInStatus`)

| Status | Significado |
|---|---|
| `not_open` | Mais de 24h antes |
| `enrolled_only` | Janela T−24h, exclusiva para titulares |
| `open` | Janela T−6h, aberta |
| `closed` | Aula já iniciada/encerrada |
| `done` | Aluno já fez check-in |

---

## Status das Aulas (`LessonStatus`)

| Status | Significado |
|---|---|
| `scheduled` | Agendada (ainda não aconteceu) |
| `finished` | Finalizada pelo professor |
| `cancelled` | Cancelada — todos os alunos são reembolsados automaticamente |

---

## Turma: Titulares e Reservas

Cada professor tem uma turma com:
- **Titulares** (`titularIds`): vagas fixas, prioridade T−24h, custo normal
- **Reservas** (`reservaIds`): lista de espera, acesso T−6h, pagam +10%

A turma é um documento Firestore na coleção `teacherClasses` (um doc por professor).

---

## Cancelamento de Aula

Quando um admin cancela uma aula:

1. Status da aula → `cancelled`
2. Para cada aluno inscrito:
   - Reembolso automático dos Plays debitados (lidos das `transactions` do tipo `debit`)
   - Transação de crédito criada em `transactions`
   - Notificação criada em `notifications`

Tudo em um único `writeBatch` atômico.

---

## Receita do Professor e Arena

Cada check-in gera receita dividida entre professor e arena segundo as porcentagens configuradas na aula:

```
rsBruto = playsConsumed × playValue
professorCredit = rsBruto × professorSharePct
arenaCredit = rsBruto × arenaSharePct
```

Implementado em: `core/math/financial-engine.ts`
