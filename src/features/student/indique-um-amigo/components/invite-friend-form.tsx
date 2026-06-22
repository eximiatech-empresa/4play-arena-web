// src/features/student/indique-um-amigo/components/invite-friend-form.tsx
"use client"
import { useState, type FormEvent } from "react"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InviteFriendFormProps {
  onInvite: (email: string) => void
}

export function InviteFriendForm({ onInvite }: InviteFriendFormProps) {
  const [email, setEmail] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    onInvite(email.trim())
    setEmail("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="friend-email">E-mail do amigo</Label>
        <Input
          id="friend-email"
          type="email"
          placeholder="nome@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="sm:w-36">
        <Mail className="w-4 h-4" />
        Convidar
      </Button>
    </form>
  )
}
