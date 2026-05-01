# 🗺️ Roadmap de Desenvolvimento: 4Play Arena

Este documento define as 4 fases estruturais de desenvolvimento do projeto 4Play Arena. Ele serve como guia arquitetural e regra de negócios para o desenvolvimento das features.

---

## 🚀 FASE 1: Arquitetura de Acessos e Identidade Visual

**Objetivo:** Estabelecer a fundação visual e os níveis de permissão do sistema (RBAC - Role-Based Access Control) no Supabase.

* **Design System (Paleta Oficial):** Configurar o Tailwind CSS com a nova paleta de cores obrigatória e remover as antigas, tambem deve remover o botao de alterar o tema da sidebar:
  * `#ebac5e`
  * `#f0c174`
  * `#f5d68a`
  * `#faea9f`
  * `#ffffb5`
* **Hierarquia de Usuários (Logins distintos):**
  1. **Administrador:** Acesso global. Cria os horários de todas as quadras, cadastra professores e gerencia planos/financeiro.
  2. **Professor:** Acesso focado. Visualiza e controla apenas suas próprias turmas/aulas, define o nível inicial dos alunos e gerencia check-ins.
  3. **Aluno:** Acesso restrito (Site/App padrão). Compra moedas, gerencia seu saldo, visualiza horários e faz check-ins de acordo com seu nível.
* **Fluxo de Onboarding do Aluno (Obrigatório):**
  1. O aluno cria a conta no sistema.
  2. Seleciona um Plano (Mensal, Trimestral ou Semestral).
  3. Vincula-se obrigatoriamente a um **Professor Original** existente na plataforma.
---

## 💰 FASE 2: O Motor Econômico (Tokenomics "Play")

**Objetivo:** Implementar o motor financeiro central usando o peso variável da moeda "Play".

* **A Moeda "Play" e o Desconto por Plano:** O aluno não transaciona mais "horas". O sistema usa a moeda "Play". O grande diferencial é que **o valor da moeda muda dependendo do plano escolhido**, garantindo o desconto para planos mais longos:
  * **Plano Mensal:** A moeda vale **1.2**
  * **Plano Trimestral:** A moeda vale **1.0**
  * **Plano Semestral:** A moeda vale **0.8**
* **Regra de Expiração (Ganho do Professor):** 
  * Se o prazo do plano expirar e o aluno ainda tiver *Plays* na carteira, esse saldo NÃO some. Ele é convertido e computado como ganho direto para o seu **Professor Original** (definido no onboarding).
* **Regra de Titularidade e Carência:**
  * Se o aluno consumir todo o saldo antes do fim do plano, deve renovar comprando novos pacotes.
  * **Carência:** Após o fim do plano, o aluno tem exatos **7 dias** para renovar a matrícula. Se não renovar dentro desse prazo, ele perde a condição de **TITULAR** da sua turma fixa, e o Professor pode colocar outro aluno da fila de espera na vaga.

---

## ⏳ FASE 3: Motor de Tempo, Níveis e Check-in

**Objetivo:** Aplicar a matemática estrita da linha do tempo para inscrições e cancelamentos.

* **Definição de Nível:** O nível inicial do aluno é exclusivamente definido/aprovado pelo Professor (Principiante, Iniciante, D, C, B, A, Profissional).
* **Linha do Tempo de Check-in:** (Onde `T` é o momento de início da aula)
  * **[T - 24h] até [T - 6h]:** Janela exclusiva. Apenas o aluno **Titular** daquela turma pode se inscrever.
  * **[T - 6h] até [T - 0h]:** Janela "Mar Aberto". A exclusividade cai. Qualquer aluno com nível compatível e saldo de *Plays* pode ocupar as vagas restantes.
* **Regra de Cancelamento (T - 4h):** O aluno só pode cancelar a inscrição e receber o reembolso do *Play* na carteira se efetuar o cancelamento faltando **4 horas ou mais** para o início da aula. Cancelamentos após esse prazo não reembolsam o saldo.

---

## 👑 FASE 4: Gestão Dinâmica da Turma (Autonomia do Professor)

**Objetivo:** Dar flexibilidade para o Professor gerenciar exceções diretamente na quadra, contornando travas do sistema quando necessário.

* **Check-in Final:** É o professor quem valida (faz o check-in definitivo) de quem realmente compareceu à aula.
* **Override de Vagas (Burlar o Limite):** Se a turma estiver lotada (ex: 4/4 vagas preenchidas) e um aluno quiser entrar de última hora na quadra, o Professor tem a permissão de adicionar esse aluno manualmente na aula, excedendo o limite de vagas do sistema para aquela sessão específica.
* **Convites Externos e Aulas Extras:** O Professor pode gerar convites diretos ou abrir uma aula manualmente para alunos de fora daquela turma regular, facilitando a gestão de faltas e aulas extras.