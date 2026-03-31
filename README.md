# 🎾 4Play Arena - Documentação Técnica e Arquitetura

## 1. Visão Geral do Projeto
O **4Play Arena** é um ecossistema de gestão de aulas baseado em uma "Carteira de Horas". Diferente de sistemas comuns de agendamento, o core do software reside na desvalorização dinâmica de horas baseada em três pilares: **Professor**, **Plano do Aluno** e **Horário da Aula**.

---

## 2. Stack Tecnológica Oficial

| Tecnologia | Função | Justificativa |
| :--- | :--- | :--- |
| **Next.js 14+** | Framework Fullstack | Utilizado para SSR (SEO) e API Routes (Backend Seguro) no mesmo repo. |
| **Supabase** | BaaS (DB & Auth) | Gerencia persistência PostgreSQL, Autenticação JWT e Row Level Security (RLS). |
| **TypeScript** | Tipagem Estática | Garante que a matemática de horas não sofra erros de ponto flutuante ou tipos inválidos. |
| **Tailwind CSS** | Estilização | Design responsivo "Mobile-First" para check-ins rápidos na quadra. |
| **shadcn/ui** | Componentes Base | Agilidade na criação de interfaces consistentes e acessíveis. |
| **TanStack Query** | Server State | Gerenciamento de cache do saldo de horas e sincronização de vagas em tempo real. |
| **Zod** | Validação | Validação rigorosa dos schemas de check-in e contratos da API. |
| **React Hook Form** | Formulários | Performance no preenchimento de cadastros e fluxos de checkout. |

---

## 3. Estrutura de Pastas (Fullstack Next.js)

```text
src/
├── app/                  # Roteamento e API (Next.js App Router)
│   ├── (auth)/           # Fluxos de login e recuperação de senha
│   ├── (dashboard)/      # Área logada do aluno (Carteira, Aulas)
│   └── api/              # BACKEND: Endpoints protegidos (Check-in, Débito)
│       └── checkin/      # Rota POST para processar a matemática de horas
├── components/           # UI Kit Global
│   ├── ui/               # Componentes shadcn/ui
│   └── shared/           # Header, Sidebar e Cards de Aula
├── core/                 # 🧠 DOMÍNIO E REGRAS DE NEGÓCIO (DDD)
│   ├── math/             # Calculadoras de consumo, descontos e arredondamentos
│   ├── constants/        # Tabela de preços por professor e níveis (A, B, C)
│   └── entities/         # Definições de tipos do negócio (Wallet, Lesson, Professor)
├── features/             # Slices Funcionais (Vertical Slices)
│   ├── wallet/           # Histórico de consumo e compra de planos
│   ├── booking/          # Lógica visual de check-in e filtros de nível
│   └── profile/          # Gestão de nível e dados do aluno
├── lib/                  # Infraestrutura
│   └── supabase/         # Configuração de Clientes (Client, Server e Admin)
├── types/                # Tipagens Globais e Database Definitions
└── utils/                # Formatadores de data/hora e moeda
```

## 4. Regras de Negócio e "Core Engine"

O 4Play Arena não é um simples CRUD (Criar, Ler, Atualizar, Deletar). O valor do software está no seu **Motor de Regras (Core Engine)**, que deve ser isolado, testável e infalível, garantindo a integridade financeira do sistema de "Carteira de Horas".

### 💸 Lógica de Consumo (A Moeda do Sistema)
O sistema não transaciona Reais (R$) após a compra do plano. A moeda oficial é a **Hora**.
O cálculo do consumo de uma aula depende de três variáveis:
1.  **Professor:** Define o custo base (ex: Paulinho Mensal = 0.90h, Marília Semestral = 1.35h).
2.  **Plano do Aluno:** Mensal, Trimestral ou Semestral.
3.  **Horário:** * **Pico:** Consumo base da tabela.
    * **Fora de Pico (Off-Peak):** Aulas antes das 18h e após 20h sofrem um desconto de 5%. A fórmula aplicada é:
        $$C_{desconto} = C_{base} \times 0.95$$

### 🔢 Motor de Arredondamento (Regra Crítica)
Após o cálculo do desconto, o sistema aplica uma mutação final com base no professor:
* **Professora Marília (Premium):** O valor descontado é SEMPRE arredondado para cima (Teto).
    $$C_{final} = \lceil C_{desconto} \rceil$$
* **Demais Professores:** Arredondamento matemático padrão (para o mais próximo).
    $$C_{final} = \text{round}(C_{desconto})$$

### 🛡️ Catraca de Acesso e Check-in
O sistema possui filtros rígidos para evitar ocupação indevida de vagas:
* **Hierarquia de Níveis:** Se o Nível do Aluno é $N_{aluno}$ e o Nível da Aula é $N_{aula}$, a inscrição só é permitida se:
    $$N_{aluno} \ge N_{aula}$$
    *(Ex: Um aluno nível "B" pode acessar turmas "B", "C", "D", etc., mas é bloqueado em turmas "A" e "Profissional").*
* **Linha do Tempo (T-24h e T-6h):**
    * **T-24h:** Abertura do check-in. Exclusividade total para alunos titulares daquela turma.
    * **T-6h:** Fim da exclusividade. As vagas ociosas são liberadas para "mar aberto" (qualquer aluno com saldo e nível elegível).

---

## 5. Princípios de Engenharia de Software e Arquitetura

Para garantir que o 4Play Arena seja um ativo de software escalável e à prova de falhas na cobrança de horas, adotamos os seguintes padrões arquiteturais adaptados para o ecossistema Next.js/React:

### 🧩 Domain-Driven Design (DDD) no Ecossistema React
Fugimos do "Modelo de Domínio Anêmico" (onde dados transitam soltos e sem validação). Mapeamos as regras de negócio reais para o código:

* **Entidades de Domínio (Entities):** Representam os objetos vitais do negócio (`Student`, `Lesson`, `Wallet`). No nosso ambiente TypeScript, usamos o **Zod** como o guardião dessas entidades. O Zod garante que uma entidade de `Lesson` nunca seja instanciada com um horário inválido ou que uma `Wallet` nunca tenha saldo negativo por falha de tipagem.
* **Serviços de Domínio (Domain Services):** A matemática de consumo (Regra da Marília, Descontos) **NÃO** deve existir dentro de um botão do React ou dentro de uma trigger do banco de dados. Elas são **Funções Puras** localizadas em `src/core/math/`. Isso nos permite criar testes unitários automatizados cobrindo 100% dos cenários de cobrança.

### 🧱 Princípios SOLID (Nível Enterprise)
Nosso código front-end e nossas rotas de API (Next.js) respeitam os pilares do SOLID:

* **S - Single Responsibility (Responsabilidade Única):**
    Uma rota de API em `src/app/api/checkin` não calcula matemática. Ela apenas recebe a requisição, chama a função do `core/math/` para obter o valor, e instrui o Supabase a debitar. Componentes visuais apenas renderizam dados; eles delegam o *fetch* para os Hooks do React Query.
* **O - Open/Closed (Aberto/Fechado):**
    Componentes de UI e funções de cálculo devem ser abertos para extensão. Se amanhã entrar um novo professor com uma regra de "Arredondamento para baixo", não alteraremos a função da Marília; estenderemos a interface do calculador.
* **L - Liskov Substitution (Substituição de Liskov):**
    Nossos componentes de UI base (shadcn/ui) aceitam todas as propriedades nativas do HTML (`React.HTMLAttributes`). Um `<Button />` customizado do 4Play nunca quebra a API padrão de um botão web.
* **I - Interface Segregation (Segregação de Interfaces):**
    Não passamos o objeto `Student` inteiro para um componente de `<LevelBadge />`. Passamos apenas a propriedade estritamente necessária (ex: `level="B"`). Isso previne re-renderizações desnecessárias e acoplamento.
* **D - Dependency Inversion (Inversão de Dependência):**
    Nossos componentes visuais não dependem do Supabase. Eles dependem de abstrações (Hooks customizados como `useLessons`). Se amanhã o banco de dados mudar, a camada visual (React) permanecerá intacta.

### 🧼 Clean Code (Código Limpo)
* **Nomenclatura Explícita:** Variáveis e funções revelam intenção de negócio. Usamos `calculateOffPeakConsumption()` em vez de `calcHours()`. Usamos `isEligibleForCheckin()` em vez de `check()`.
* **DRY (Don't Repeat Yourself):** Toda regra de negócio escrita duas vezes é um bug esperando para acontecer. A regra de desconto de 5% existe em um único lugar no projeto inteiro.
* **Fail-Fast (Falha Rápida):** Nossas rotas de API validam o *payload* do usuário logo na primeira linha usando Zod. Se os dados forem maliciosos ou inválidos, a requisição é abortada com erro 400 antes de qualquer processamento matemático ou consulta ao banco.