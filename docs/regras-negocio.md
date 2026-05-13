# 4Play Arena — Especificações do App de Check-in e Modelo

# Plays

_Documento técnico para desenvolvedores • Versão 1.0 • Maio 2026_

## 1. Visão Geral do Modelo

O app gerencia a venda de planos da 4Play Arena, o check-in dos alunos nas aulas e o cálculo automático da

remuneração dos professores. O modelo se baseia em uma moeda interna chamada "Play", consumida em
cada aula. O R$/Play é determinado pelo plano que o aluno comprou — quanto mais longo o plano, menor o

R$/Play (desconto de fidelização).

O pagamento ao professor passa a ser por presença efetiva (check-in confirmado), não mais por plano
vendido. A regra fundamental: o R$ gerado em cada check-in é sempre calculado pelo R$/Play do plano do

aluno que está consumindo — isso preserva automaticamente a margem da arena e a remuneração do
professor, qualquer que seja o mix de planos em quadra.

## 2. Estrutura de Planos (Único pra todos os professores)

Todos os planos são unificados: independem do professor. O que diferencia o ganho do aluno é o consumo de

Plays por aula (definido pelo professor, ver seção 3).

```
Plano Preço (R$) Plays Validade R$/Play
```
```
Mensal 410,00 80 30 dias 5,1250
```
```
Trimestral 1.140,00 240 90 dias 4,7500
```
```
Semestral 2.070,00 480 180 dias 4,3125
```
## 3. Consumo Base de Plays por Aula (Fora do Pico, Aluno Titular)


```
Professor Modalidade Plays / aula
```
```
Paulinho Beach Tennis / Vôlei de Praia 10
```
```
Biel Beach Tennis 13
```
```
Pepe Beach Tennis 13
```
```
Marília Beach Tennis 16
```
_Observação: o consumo da Marília pode variar marginalmente entre planos. Para fins do app, manter consumo fixo por_

_professor (Marília = 16 Plays). Tabelas alternativas só se houver decisão de negócio._

## 4. Regras de Cálculo do Consumo de Plays (Ordem Obrigatória)

Em cada check-in, o app aplica as regras na ordem abaixo — não é permitido inverter a ordem. O resultado é
a quantidade de Plays a ser debitada do plano do aluno.

1. Buscar consumo base do professor (ver tabela na seção 3).
2. Aplicar regra de pico: se o horário da aula estiver entre 18h e 20h, multiplicar o consumo por 1,05 (+5%).
3. Aplicar regra de reserva / fora da turma principal: se o aluno NÃO for titular daquela turma específica,
    multiplicar por 1,10 (+10%) sobre o resultado anterior.
4. Aplicar arredondamento conforme a regra do professor (ver seção 5).

**Exemplo prático — Biel:**

```
Aluno titular, fora do pico: 13 Plays.
Aluno titular, no pico (18h–20h): 13 × 1,05 = 13,65 → arredondamento padrão → 14 Plays.
Aluno NÃO titular (reserva), no pico: 13 × 1,05 × 1,10 = 15,015 → 15 Plays.
Aluno NÃO titular (reserva), fora do pico: 13 × 1,10 = 14,30 → 14 Plays.
```
## 5. Regras de Arredondamento

```
Marília: arredondamento SEMPRE para cima (Math.ceil). Ex.: 17,6 → 18.
Demais professores (Paulinho, Biel, Pepe): arredondamento padrão (Math.round, com .5 indo para cima).
Ex.: 13,65 → 14; 13,40 → 13.
```
## 6. Regras de Check-in


O check-in é o gatilho do débito de Plays do aluno e do crédito de receita para o professor. Sem check-in

confirmado, não há débito nem crédito.

```
Janela de check-in: o aluno titular pode confirmar presença até 6 horas antes do horário da aula.
Sem check-in na janela: o lugar do titular fica disponível para alunos de fora da turma (com nível
compatível, ver seção 7).
Aluno avulso (fora da turma) que ocupa a vaga consome +10% Plays do plano dele (regra de reserva —
seção 4).
Turma mínima operacional: 6 alunos por aula (titulares + reservas).
Plays não consumidos pelo titular permanecem ativos no plano até a validade (30 / 90 / 180 dias) e
podem ser usados com o próprio professor ou com outro professor (pagando +10% se for fora da turma
principal).
Falta justificada do professor (motivo de força maior): a arena coloca substituto. Os Plays do aluno são
consumidos normalmente, mas o crédito vai para o professor substituto.
```
## 7. Sistema de Níveis

Todo aluno é classificado em um nível. O nível define em quais turmas ele pode jogar. Regras:

```
Categorias (ordem crescente): Principiante, Iniciante, D, C, B, A, Profissional.
Aluno pode jogar em turmas do próprio nível ou de níveis inferiores.
Aluno NUNCA pode jogar em turmas de nível superior ao dele.
Validação: ao tentar reservar/ocupar vaga em outra turma, o app deve verificar nível antes de permitir o
check-in.
```
## 8. Regra de Ouro — R$/Play é Sempre do Plano do Aluno

**O R$/Play é uma característica do plano que o aluno comprou, NÃO do professor. Quando um aluno**

**faz check-in, o sistema busca o plano ativo dele e usa o R$/Play correspondente (Mensal R$ 5,1250 /
Trimestral R$ 4,7500 / Semestral R$ 4,3125) para calcular o R$ gerado naquele check-in.**

Isso garante automaticamente que a arena preserva sua margem percentual e o professor preserva seu

ganho proporcional, qualquer que seja o mix de planos dos alunos em quadra.

## 9. Fórmula de Remuneração do Professor

**Para cada check-in confirmado:**

plays_consumidos = base_professor × (pico? 1,05 : 1) × (reserva? 1,10 : 1) ➜

arredondamento

r$_gerado_no_checkin = plays_consumidos × r$/play_do_plano_do_aluno

credito_professor = r$_gerado × %_do_professor

credito_arena = r$_gerado × (1 − %_do_professor)

**Percentuais por professor (sobre a receita gerada por cada check-in):**


```
Professor % Professor % Arena
```
```
Biel 70% 30%
```
```
Marília 65% 35%
```
```
Paulinho 50% 50%
```
```
Pepe 50% 50%
```
**Pagamento mensal do professor:**

Soma de todos os créditos acumulados pelo professor entre o 1º e o último dia do mês de competência.
Pagamento ocorre no mês seguinte.

## 10. Aluno Avulso (Fora da Turma)

Aluno avulso é qualquer aluno da arena com nível compatível que ocupa uma vaga de uma turma da qual ele

NÃO é titular. Pode ser aluno do mesmo professor (em outro horário) ou de outro professor.

```
Avulso paga o consumo de Plays do professor da aula que ele entrou, com adicional de +10% (regra de
reserva — seção 4).
Os Plays consumidos saem do plano ativo do aluno avulso (que pode ter sido comprado para outro
professor).
O crédito vai para o professor que está dando aquela aula, conforme fórmula da seção 9.
```
_Implicação operacional: um aluno do Paulinho que vai pra aula da Marília consome Plays do plano que ele comprou com_

_o Paulinho, mas o crédito da aula é da Marília. Os Plays funcionam como moeda interna fungível, com R$/Play_

_preservado do plano de origem._

## 11. Casos de Borda e Validações Obrigatórias

```
Plano expirado: bloquear check-in. Plays restantes do plano vencido NÃO podem ser usados após a data
de validade.
Saldo de Plays insuficiente: bloquear check-in. App deve sugerir compra de plano novo ou pacote extra.
Aluno tenta entrar em turma de nível superior: bloquear, mensagem clara.
Turma já com 6 alunos confirmados: bloquear novo check-in (lista de espera, opcional).
Cancelamento do check-in pelo aluno após a janela de 6h: Plays devolvidos? (decisão de negócio —
sugestão: NÃO devolver. Reduz no-show.)
```

```
Aula cancelada pela arena (chuva, manutenção): devolver Plays consumidos a todos os alunos que
tinham check-in.
Falta do professor sem substituto: devolver Plays a todos os alunos. Professor não recebe crédito.
Mudança de plano no meio do período: Plays atuais permanecem com o R$/Play do plano antigo; novos
Plays adquiridos usam o R$/Play do novo plano. Manter ledger histórico por plano.
```
## 12. Indicadores e Alertas que o App Deve Expor

**Para o aluno:**

```
Saldo de Plays atual e data de validade do plano.
Ritmo de consumo vs. esperado (alerta quando estiver consumindo acima do que o plano comporta no
período).
Histórico de aulas (data, professor, Plays consumidos).
```
**Para o professor:**

```
Receita acumulada no mês corrente (R$).
Alunos confirmados por aula com 6h de antecedência.
Histórico de aulas dadas, ocupação e avulsos.
```
**Para a gestão (arena):**

```
Passivo de Plays em estoque (Plays comprados ainda não consumidos) por aluno e total.
Plays caducados no período (Plays não consumidos até a validade) — vira receita confirmada da arena.
Taxa de comparecimento por turma e por professor.
Taxa de ocupação por aula (titulares + avulsos).
Conversão de avulsos em titulares (aluno que entrou via reserva e depois virou titular).
Receita por professor, por turma e por aula.
```
## 13. Resumo Executivo (Para a Sprint Planning)

**Funcionalidades obrigatórias do MVP:**

1. Cadastro de aluno com nível e plano ativo (mensal/trimestral/semestral).
2. Cadastro de professor com % de remuneração e tabela de consumo.
3. Cadastro de turma com professor, horário, dia da semana, nível, lista de titulares (até 6).
4. Tela de check-in (aluno) com janela de 6h e debito automático de Plays.
5. Liberação automática de vaga vencida + lista de candidatos a avulso (filtrada por nível).
6. Motor de cálculo de Plays (regras seção 4 + arredondamento seção 5).
7. Motor financeiro: créditos por check-in para professor e arena (seção 9).
8. Relatório mensal de remuneração por professor (fechamento para pagamento).
9. Dashboard de indicadores (seção 12).
10. Validações de borda (seção 11).

## 14. Pacotes Extras de Plays

Pacotes extras são recargas avulsas de Plays que o aluno pode comprar independentemente do ciclo de renovação do plano.

**Comportamento:**

```
wallet.balance    += pacote.plays
wallet.totalPlays += pacote.plays
wallet.playValue   permanece intocado  ← usa o R$/Play do plano vigente do aluno
wallet.expiresAt   permanece intocado  ← a validade do plano não é alterada
wallet.plan        permanece intocado
```

**Exemplo:**

```
Aluno tem: saldo 50P a R$ 4,75/Play (plano trimestral)
Compra pacote extra de 20P
Resultado: 70P a R$ 4,75/Play  ← R$/Play e validade não mudam
```

**Regra de negócio confirmada — Pacote com plano expirado:**

O plano é o "passaporte" do aluno para as aulas. Um pacote extra é apenas uma recarga de combustível — sem passaporte válido, o combustível não tem utilidade.

**Decisão:** a compra de pacote extra é **bloqueada** quando o plano está expirado. O aluno deve primeiro renovar o plano e então comprar o pacote. Implementado em `src/core/usecases/wallet/purchase-package.ts` via `ExpiredPlanError`.

Consequência direta: um aluno nunca chegará ao estado de ter Plays de pacote mas plano expirado, portanto a regra de check-in (plano expirado bloqueia entrada) não precisa de caso especial para Plays de pacote.

_FIM DO DOCUMENTO._


