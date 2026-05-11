import { z } from "zod"

export const CreateLessonSchema = z
  .object({
    description: z.string().min(2, "Mínimo 2 caracteres"),
    professorId: z.string().min(1, "Selecione um professor"),
    level: z.string().min(1, "Selecione um nível"),
    dateTime: z.string().min(1, "Informe o horário"),
    court: z.string().min(1, "Informe a quadra"),
    totalSpots: z.number().int().positive("Mínimo 1 vaga"),
    type: z.enum(["avulsa", "recorrente"]),
    repeatUntil: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "recorrente" && !val.repeatUntil) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["repeatUntil"],
        message: "Data final obrigatória para aulas recorrentes",
      })
    }
  })

export type CreateLessonFormData = z.infer<typeof CreateLessonSchema>
