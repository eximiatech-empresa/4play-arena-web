# Alinhamento 4Play Arena — Dezembro 2026 e Janeiro 2027

Documento de alinhamento técnico para a equipe de desenvolvimento (Guilherme e novo dev), baseado na reunião com o cliente em 20/11/2026.

---

## 1. Contexto e Decisões de Negócio

1. **Sem Pagamentos in-app**:
   - Nenhum fluxo de pagamento direto (cartão, Pix, Pagar.me) entrará no aplicativo nesta fase.
   - O saldo de pontos/créditos dos alunos será lançado por fora.
   - A ideia acordada é alimentar os créditos a partir de arquivos externos gerados pelo cliente (ex: leitura/extração de Notas Fiscais ou relatórios de faturamento com dados do aluno e valor).

2. **Prazos e Ritmo de Entregas (estilo SGP Condomínios - atualizações semanais às sextas)**:
   - **Primeira semana de dezembro (04/12/2026)**: Apps publicados nas contas das lojas (Apple TestFlight e Google Play Teste Interno/Fechado) para que o cliente e professores testem na prática.
   - **Dezembro (04/12 a 23/12/2026)**: Período de homologação, feedbacks do cliente e ajustes de usabilidade.
   - **Janeiro de 2027**: Lançamento oficial nas lojas públicas.

3. **Prioridade dos Apps**:
   - **`mobile` (Aluno)**: Prioridade máxima. Está mais avançado e deve ser o primeiro fechado para loja.
   - **`staff` (Professor/Admin)**: Subir junto se possível. Caso necessário, os professores e admins podem operar pelo painel web (`4play-arena-web`) durante os primeiros testes.

---

## 2. Situação da Arquitetura: Firebase vs API Hono

Para quem está entrando agora no código, a arquitetura atual funciona assim:

- **Onde o app conecta hoje?**
  - O entrypoint em `mobile/lib/main.dart` inicializa o `AppConfig` com `useApi: bool.fromEnvironment('USE_API', defaultValue: false)`.
  - **Comportamento padrão**: como `useApi` é `false`, **o app opera 100% conectado direto no Firebase de produção** (`play-arena-567f1`).
  - Todas as chamadas de banco e autenticação estão funcionando diretamente no Firestore/Firebase Auth.
- **E a API Hono (`4play-arena-api`)?**
  - A API Hono foi construída localmente com contratos REST limpos e os datasources do Flutter possuem a implementação `ApiDataSource`.
  - Ela é ativada apenas se o app for compilado com `--dart-define=USE_API=true`.
  - **Recomendação para a entrega de 04/12**: como o prazo é curto (2 semanas) e a API ainda não está hospedada em produção (Render/Cloud Run/Railway), a rota mais segura é **manter o app compilando com o padrão (Firebase direto)** para os testes de dezembro, sem risco de indisponibilidade de infraestrutura externa.

---

## 3. Identificadores e Setup das Lojas

Guilherme cuidará da criação dos registros no App Store Connect e Google Play Console. Detalhes técnicos dos IDs:

- **App do Aluno (`mobile`)**:
  - iOS Bundle ID: `br.com.fourplayarena.app`
  - Android applicationId: `br.com.fourplay_arena.mobile`
- **App da Equipe (`staff`)**:
  - iOS Bundle ID: `br.com.fourplayarena.staff`
  - Android applicationId: Atualmente está como `br.com.fourplay_arena.mobile` (necessário renomear para `br.com.fourplay_arena.staff` em `staff/android/app/build.gradle.kts` para não colidir com o app do aluno).

---

## 4. Cronograma Semanal Detalhado

| Data | Marco | Entregáveis |
|---|---|---|
| **20/11/2026 (Sexta)** | Alinhamento e Definição | Congelamento do escopo de pagamentos; documentação para os desenvolvedores. |
| **27/11/2026 (Sexta)** | Fechamento de Regras e Lojas | Regras de agendamento sem barreira de checkout; ajuste do `applicationId` do Staff; Guilherme cria apps nas lojas. |
| **04/12/2026 (Sexta)** | Entrega de Testes (Lojas) | Geração dos AABs e IPAs; upload no TestFlight e Google Play Teste Interno; envio para o cliente testar. |
| **04 a 23/12/2026** | Homologação com Cliente | Ciclo de testes reais pelo cliente; correção de bugs encontrados; ajustes visuais. |
| **Janeiro/2027** | Lançamento Oficial | Submissão dos apps para revisão pública e lançamento nas lojas. |

---

## 5. Perguntas e Pontos de Decisão para Guilherme e Novo Dev

1. **Importação de Notas Fiscais / Pontos**:
   - Em qual interface o administrador fará o upload? No painel web (`4play-arena-web`)?
   - Qual será o formato do arquivo fornecido pelo cliente (XML de NF-e, PDF com OCR, ou CSV/Excel exportado do ERP/sistema deles)?
   - Como será feita a vinculação do aluno no arquivo com o usuário no banco (por CPF, e-mail ou nome)?
2. **Fluxo de Inscrição em Aulas sem Pagamento**:
   - O aluno se inscreve consumindo o saldo de créditos lançado previamente pelo admin?
   - O que acontece se o aluno não tiver saldo? O agendamento é bloqueado ou fica com status "pendente de acerto"?
3. **Decisão sobre a API**:
   - Confirmar se para 04/12 seguiremos com Firebase direto (`USE_API=false`), deixando o deploy da API Hono para quando o modelo de backend dedicado for exigido.
4. **Usuários de Teste para Revisão**:
   - Criar 1 conta demo de aluno e 1 conta demo de professor com dados preenchidos para as avaliações das lojas e testes do cliente.
