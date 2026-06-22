"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCurrentUser } from "@/hooks/use-current-user"
import { ensureFamily, getFamilyInvites, inviteFamilyMember, removeFamilyMember } from "@/lib/firebase/families"
import { getUsersByIds } from "@/lib/firebase/users"
import type { FamilyMemberRole, FamilyInvite } from "@/core/entities/family"
import type { StudentUser } from "@/core/entities/user"

export interface FamilyMemberView {
  id: string
  name: string
  email: string
  role: FamilyMemberRole
  status: "ATIVO" | "PENDENTE"
  addedAt: string
  invite: FamilyInvite | null
}

const FAMILY_QUERY_KEY = ["family"] as const

export function useFamily() {
  const { data: currentUser } = useCurrentUser()
  const student = currentUser?.role === "STUDENT" ? (currentUser as StudentUser) : null

  return useQuery({
    queryKey: FAMILY_QUERY_KEY,
    queryFn: async (): Promise<{ familyId: string; members: FamilyMemberView[] }> => {
      if (!student) throw new Error("Usuário não autenticado")

      const family = await ensureFamily(student.uid)
      const invites = await getFamilyInvites(family.id)

      const activeMemberIds = invites
        .filter((i) => i.status === "ATIVO" && i.memberUserId)
        .map((i) => i.memberUserId as string)
      const activeUsers = await getUsersByIds(activeMemberIds)
      const nameByUid = new Map(activeUsers.map((u) => [u.id, u.name]))

      const members: FamilyMemberView[] = [
        {
          id: "owner",
          name: student.name,
          email: student.email,
          role: "TITULAR",
          status: "ATIVO",
          addedAt: family.createdAt,
          invite: null,
        },
        ...invites
          .filter((i) => i.status !== "REJEITADO")
          .map((invite): FamilyMemberView => ({
            id: invite.id,
            name: invite.memberUserId
              ? nameByUid.get(invite.memberUserId) ?? invite.email.split("@")[0]
              : invite.email.split("@")[0],
            email: invite.email,
            role: invite.role,
            status: invite.status === "ATIVO" ? "ATIVO" : "PENDENTE",
            addedAt: invite.createdAt,
            invite,
          })),
      ]

      return { familyId: family.id, members }
    },
    enabled: !!student,
    staleTime: 60 * 1000,
  })
}

export function useInviteFamilyMember() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()

  return useMutation({
    mutationFn: async ({
      familyId,
      email,
      role,
    }: {
      familyId: string
      email: string
      role: FamilyMemberRole
    }) => {
      if (!currentUser) throw new Error("Usuário não autenticado")
      await inviteFamilyMember(familyId, currentUser.uid, email, role)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAMILY_QUERY_KEY }),
  })
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invite: FamilyInvite) => {
      await removeFamilyMember(invite)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAMILY_QUERY_KEY }),
  })
}
