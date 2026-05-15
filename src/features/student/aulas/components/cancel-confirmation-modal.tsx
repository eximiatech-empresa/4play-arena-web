// src/features/booking/components/cancel-confirmation-modal.tsx
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CancelConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export function CancelConfirmationModal({ open, onOpenChange, onConfirm, isPending }: CancelConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md border-red-100 p-6">
        <DialogHeader className="flex flex-col items-center text-center sm:text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="text-xl">Atenção ao Prazo</DialogTitle>
          <DialogDescription className="text-zinc-600 pt-2">
            Faltam <strong>menos de 4 horas</strong> para o início desta aula (ou ela já aconteceu).
            <br /><br />
            Você perderá a exclusividade da vaga e <strong>seu saldo de Plays não será reembolsado</strong> de acordo com a política da arena.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending} className="w-full sm:w-1/2">
              Voltar
            </Button>
          </DialogClose>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isPending}
            className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Estou ciente, cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}