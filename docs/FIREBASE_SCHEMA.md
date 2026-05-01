# 🔥 Estrutura de Banco de Dados (Firebase Firestore)

Como o Firebase é um banco de dados NoSQL (orientado a documentos), nós não criamos "tabelas" com relações rígidas, mas sim "Coleções" e "Documentos". Abaixo está a arquitetura para suportar o App do aluno, App do Professor e Painel Admin, remodelar as entidades e o projeto para preparar para integração com firebase

## 1. Coleção: `users` (Controle de Acessos - RBAC)
Guarda os dados de todos que acessam o sistema, separados pela `role` (papel).

**Estrutura do Documento:**
```json
{
  "uid": "1234abc", // ID gerado pelo Firebase Auth
  "name": "João da Silva",
  "email": "joao@email.com",
  "role": "STUDENT", // Pode ser: "ADMIN", "TEACHER", "STUDENT"
  "createdAt": "Timestamp",
  
  // Se for STUDENT, terá esses campos extras:
  "level": "Iniciante", 
  "walletBalance": 12.5, // Quantidade de "Plays" na carteira
  "originalTeacherId": "uid_do_professor_biel",
  "currentPlanId": "plano_trimestral_id",
  "planExpiresAt": "Timestamp"
}
```
### 2. Coleção: classes (Turmas Fixas baseadas no Mapa)
Esta coleção representa a grade de horários que os Admins configuram (As tabelas de Terça/Quinta, etc).

```json
{
  "classId": "aula_biel_seg_18",
  "teacherId": ["uid_do_biel"], // Array pois há aulas com 2 professores (ex: V.Hugo e Israel)
  "courtNumber": 2, // Quadra 1 a 6
  "dayOfWeek": "monday", 
  "startTime": "18:00",
  "endTime": "19:00",
  "maxCapacity": 6,
  "levelRequired": "Iniciante", // Nível mínimo da aula
  "isOffPeak": false // Flag para aplicar o desconto de 0.95 "Plays"
}
```

### 3. Coleção: sessions (Sessões Individuais para Check-in)
Como uma class se repete toda semana, nós precisamos gerar uma "Sessão" específica para o dia (ex: Aula do Biel do dia 15/08 às 18h) para gerenciar a linha do tempo (T-24h, T-6h).

```json
{
  "sessionId": "sess_1508_biel_q2",
  "classReferenceId": "aula_biel_seg_18", // Referência à turma matriz
  "date": "2026-08-15",
  "startTime": "Timestamp", // Usado para calcular o T-24h e T-6h
  "status": "OPEN", // OPEN, CLOSED, FINISHED
  "enrolledStudents": ["uid_joao", "uid_maria"], // Quem já fez check-in
  "waitingList": ["uid_pedro", "uid_lucas"] // Lista de espera (como os +2 da Marília)
}
```
### 4. Coleção: transactions (Livro Caixa de "Plays")
Extremamente importante para garantir a integridade financeira e evitar fraudes de saldo.

```json
{
  "transactionId": "tx_987",
  "studentId": "uid_joao",
  "type": "DEBIT", // Pode ser: "DEBIT" (Check-in), "CREDIT" (Cancelou a tempo), "PURCHASE" (Comprou plano)
  "amount": 1.2, // Quantidade de Plays movimentada
  "description": "Check-in aula Biel (15/08)",
  "timestamp": "Timestamp"
}
```