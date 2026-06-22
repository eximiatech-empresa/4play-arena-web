"use client"
import { useState } from "react"
import { PartyPopper } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useNotifications, useMarkNotificationRead } from "@/hooks/use-notifications"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Renders a celebratory modal for unread `referral_bonus` notifications.
// Separate from NotificationsWatcher's toasts since a bonus credit deserves
// more visual weight than a passing toast.
export function ReferralBonusModal() {
  const { data: currentUser } = useCurrentUser()
  const { data: notifications } = useNotifications(currentUser?.uid)
  const { mutate: markRead } = useMarkNotificationRead()
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const active = notifications?.find(
    (n) => n.type === "referral_bonus" && n.id !== dismissedId,
  )

  function handleClose() {
    if (active) {
      setDismissedId(active.id)
      markRead(active.id)
    }
  }

  return (
    <Dialog open={!!active} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="w-16 h-16 rounded-full bg-brand-subtle flex items-center justify-center mb-2">
            <PartyPopper className="w-8 h-8 text-brand" />
          </div>
          <DialogTitle className="text-xl">{active?.title ?? "Você ganhou créditos!"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {active?.message}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <p className="text-4xl font-bold text-brand-dark tabular-nums">
            +{active?.bonusCredits ?? 0} Plays
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full">
            Aproveitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
