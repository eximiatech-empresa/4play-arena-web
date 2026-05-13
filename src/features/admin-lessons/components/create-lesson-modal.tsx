"use client"

import { useEffect } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeachers } from "@/features/auth/hooks/use-teachers"
import { useCreateLessons } from "../hooks/use-admin-lessons"
import { STUDENT_LEVELS } from "@/core/constants/professors"
import { CreateLessonSchema, type CreateLessonFormData } from "../schemas"

interface CreateLessonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDateTime?: string
}

export function CreateLessonModal({ open, onOpenChange, defaultDateTime }: CreateLessonModalProps) {
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers()
  const { mutate: createLessons, isPending } = useCreateLessons()

  const form = useForm<CreateLessonFormData>({
    resolver: zodResolver(CreateLessonSchema),
    defaultValues: {
      description: "",
      professorId: "",
      level: "",
      dateTime: defaultDateTime ?? "",
      court: "",
      totalSpots: 4,
      type: "avulsa",
      repeatUntil: "",
    },
  })

  const { register, handleSubmit, control, reset, formState: { errors } } = form
  const selectedType = useWatch({ control, name: "type" })
  const selectedProfessorId = useWatch({ control, name: "professorId" })
  const selectedTeacher = teachers.find((t) => t.uid === selectedProfessorId)

  // Sync dateTime whenever the modal opens with a new pre-selected date.
  // defaultValues only applies on initial mount, so we need reset() for subsequent opens.
  useEffect(() => {
    if (open) {
      reset({
        description: "",
        professorId: "",
        level: "",
        dateTime: defaultDateTime ?? "",
        court: "",
        totalSpots: 4,
        type: "avulsa",
        repeatUntil: "",
      })
    }
  }, [open, defaultDateTime, reset])

  function handleClose(value: boolean) {
    if (!value) reset()
    onOpenChange(value)
  }

  function onSubmit(data: CreateLessonFormData) {
    const teacher = teachers.find((t) => t.uid === data.professorId)
    if (!teacher) return

    const levelIndex = STUDENT_LEVELS.indexOf(data.level as typeof STUDENT_LEVELS[number])

    createLessons(
      {
        description: data.description,
        professorId: teacher.uid,
        professorName: teacher.name,
        lessonPrice: teacher.lessonPrice ?? 0,
        level: data.level,
        levelIndex: levelIndex >= 0 ? levelIndex : 0,
        dateTime: new Date(data.dateTime).toISOString(),
        court: data.court,
        totalSpots: data.totalSpots,
        type: data.type,
        repeatUntil: data.repeatUntil || undefined,
        // Injetando as propriedades financeiras requiridas (fallbacks)
        professorBasePlays: (teacher as any).basePlays ?? teacher.lessonPrice ?? 8,
        professorRoundingRule: (teacher as any).roundingRule ?? "round",
        professorSharePct: (teacher as any).professorSharePct ?? 0.5,
        arenaSharePct: (teacher as any).arenaSharePct ?? 0.5,
      },
      { onSuccess: () => handleClose(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Aula</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Título / Descrição</Label>
            <Input
              id="description"
              className="border-chart-4"
              placeholder="Ex: Aula de Nível B — Terça"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Professor */}
          <div className="space-y-2">
            <Label>Professor</Label>
            <Controller
              name="professorId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={loadingTeachers}>
                  <SelectTrigger className="w-full border-chart-4">
                    <SelectValue placeholder={loadingTeachers ? "Carregando..." : "Selecione um professor..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.uid} value={t.uid} className="cursor-pointer">
                        {t.name}
                        {t.lessonPrice != null && (
                          <span className="ml-2 text-xs text-zinc-400">({t.lessonPrice} Plays)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.professorId && (
              <p className="text-xs text-destructive">{errors.professorId.message}</p>
            )}
            {selectedTeacher?.lessonPrice != null && (
              <p className="text-xs text-zinc-500">
                Custo base: <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedTeacher.lessonPrice} Plays</span>
              </p>
            )}
          </div>

          {/* Nível */}
          <div className="space-y-2">
            <Label>Nível</Label>
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full border-chart-4">
                    <SelectValue placeholder="Selecione um nível..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDENT_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl} className="cursor-pointer">
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.level && (
              <p className="text-xs text-destructive">{errors.level.message}</p>
            )}
          </div>

          {/* Horário */}
          <div className="space-y-2">
            <Label htmlFor="dateTime">Horário de Início</Label>
            <Input
              id="dateTime"
              type="datetime-local"
              className="border-chart-4"
              {...register("dateTime")}
            />
            {errors.dateTime && (
              <p className="text-xs text-destructive">{errors.dateTime.message}</p>
            )}
          </div>

          {/* Quadra */}
          <div className="space-y-2">
            <Label htmlFor="court">Quadra</Label>
            <Input
              id="court"
              className="border-chart-4"
              placeholder="Ex: Quadra 1"
              {...register("court")}
            />
            {errors.court && (
              <p className="text-xs text-destructive">{errors.court.message}</p>
            )}
          </div>

          {/* Vagas */}
          <div className="space-y-2">
            <Label htmlFor="totalSpots">Vagas</Label>
            <Input
              id="totalSpots"
              type="number"
              min={1}
              className="border-chart-4"
              {...register("totalSpots", { valueAsNumber: true })}
            />
            {errors.totalSpots && (
              <p className="text-xs text-destructive">{errors.totalSpots.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {(["avulsa", "recorrente"] as const).map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      variant={field.value === opt ? "default" : "outline"}
                      className={
                        field.value === opt
                          ? "flex-1 bg-brand hover:bg-brand-dark text-white capitalize"
                          : "flex-1 capitalize"
                      }
                      onClick={() => field.onChange(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Repetir até — só se recorrente */}
          {selectedType === "recorrente" && (
            <div className="space-y-2">
              <Label htmlFor="repeatUntil">Repetir até</Label>
              <Input
                id="repeatUntil"
                type="date"
                className="border-chart-4"
                {...register("repeatUntil")}
              />
              {errors.repeatUntil && (
                <p className="text-xs text-destructive">{errors.repeatUntil.message}</p>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand-dark text-white"
              disabled={isPending}
            >
              {isPending ? "Criando..." : "Criar Aula"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
