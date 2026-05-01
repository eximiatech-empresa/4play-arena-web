# 🎾 4Play Arena - Documentação de Escopo e Regras de Negócio

## 1. Visão Geral do Projeto
O **4Play Arena** é uma plataforma especializada na gestão inteligente de aulas e performance esportiva. O sistema foi concebido sob medida para um empresário do ramo esportivo, proprietário de um complexo com múltiplas quadras de tênis, que necessita de uma solução escalável para gerenciar o alto volume de alunos, professores e espaços físicos.

Diferente de sistemas de agendamento convencionais que apenas marcam horários, o 4Play opera sob uma **economia de ativos temporais**, transformando planos financeiros em uma "Carteira de Horas" dinâmica. O objetivo principal é maximizar a ocupação das quadras e a rentabilidade da operação como um todo, oferecendo ao aluno uma jornada de consumo flexível, porém regida por critérios técnicos e de horários.

---

## 2. O Modelo de Negócio (Tokenização de Horas)
A plataforma elimina a transação direta "Real por Aula" no momento do agendamento. O sistema funciona em duas etapas:

1.  **Aporte de Crédito:** O aluno adquire um plano (Mensal, Trimestral ou Semestral).
2.  **Conversão de Ativo:** O valor em Reais é convertido em um saldo de horas com validade estrita.

### Planos e Saldo Inicial:
| Plano | Valor (R$) | Horas Adquiridas | Validade |
| :--- | :--- | :--- | :--- |
| **Mensal** | R$ 449,00 | 8 horas | 30 dias |
| **Trimestral** | R$ 1.269,00 | 24 horas | 90 dias |
| **Semestral** | R$ 2.369,00 | 48 horas | 180 dias |

---

## 3. Core Engine: A Matemática de Débito
O diferencial competitivo do 4Play Arena é o seu **Motor de Cálculo Dinâmico**. O custo de uma aula não é fixo; ele é calculado no momento do check-in com base em variáveis de valor agregado.

### 3.1. Variáveis de Consumo Base
Cada professor possui um peso de consumo que varia conforme o plano atual do aluno. 

*Exemplo de Tabela de Consumo (Horário de Pico):*
* **Professor Paulinho:** Consumo reduzido (Foco em volume).
* **Professores Biel/Pepe:** Consumo intermediário.
* **Professora Marília (Premium):** Maior consumo por aula (Alto Valor Agregado).

### 3.2. Regra de Horário (Yield Management)
Para incentivar a ocupação das quadras em horários de baixa demanda, o sistema aplica um multiplicador de desconto:
* **Horário de Pico:** Entre 18:00 e 20:00 (Consumo 100% da tabela).
* **Fora de Pico (Off-Peak):** Antes das 18:00 ou após as 20:00.
    * **Cálculo:** `Consumo Base * 0.95` (5% de desconto em horas).

### 3.3. Algoritmo de Arredondamento
Para garantir a precisão matemática e a saúde financeira da operação, o sistema aplica arredondamentos específicos:
* **Regra Marília (Premium):** Qualquer valor fracionado após o desconto é **SEMPRE arredondado para cima** (Ex: 1.32h vira 1.40h ou conforme a casa decimal definida).
* **Demais Professores:** Arredondamento matemático padrão para a casa decimal mais próxima.

---

## 4. Hierarquia de Níveis e Controle de Acesso
A qualidade técnica das aulas nas quadras é protegida por uma trava de níveis. Alunos e aulas são categorizados em:
1. Principiante
2. Iniciante
3. Nível D
4. Nível C
5. Nível B
6. Nível A
7. Profissional

**A Regra Bi-Direcional:**
* Um aluno **PODE** se inscrever em aulas do seu nível ou de níveis **inferiores**.
* Um aluno **JAMAIS** pode se inscrever em aulas de níveis **superiores** ao seu perfil técnico.

---

## 5. Fluxo de Check-in e Janelas de Prioridade
O check-in é o evento crítico do sistema onde ocorre a validação de segurança e o débito do saldo.

### Cronograma da Vaga:
1.  **T - 24h:** A aula é aberta para check-in. Somente os alunos **titulares** (fixos) daquela turma podem confirmar presença.
2.  **T - 6h:** A janela de prioridade se fecha. Vagas remanescentes são abertas para o "Mar Aberto". Qualquer aluno elegível (nível compatível e saldo disponível) pode ocupar a vaga em qualquer quadra disponível.
3.  **Presença:** Após a aula, o professor confirma a presença no sistema, finalizando o ciclo daquela transação de horas.

---

## 6. Regras Adicionais e Restrições
* **Exclusividade de Saldo:** Não é permitido realizar check-in com saldo de horas insuficiente.
* **Expiração:** Horas não utilizadas dentro do período de validade do plano são expiradas automaticamente (sem reposição automática).
* **Reposições:** O sistema não trabalha com reposição automática. Casos de força maior são tratados manualmente pela administração através de ajustes na carteira.
* **Sexta-Feira Dinâmica:** Aulas extras e eventos de demanda ocorrem às sextas, otimizando a taxa de ocupação do complexo e funcionando como um buffer de horas para os alunos.

---

## 7. Objetivo Tecnológico
O sistema deve garantir que o valor percebido pelo professor não mude, enquanto o consumo de horas do aluno é o que traz o equilíbrio financeiro e a flexibilidade para a operação das quadras do 4Play Arena.