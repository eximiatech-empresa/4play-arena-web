import { z } from "zod"

export const REFERRAL_BONUS_PLAYS = 50

export const ReferralStatusSchema = z.enum(["PENDENTE", "CONCLUIDO"])
export type ReferralStatus = z.infer<typeof ReferralStatusSchema>

export const ReferralSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  referralCode: z.string(),
  friendEmail: z.string().email(),
  friendName: z.string().nullable(),
  friendUserId: z.string().nullable(),
  status: ReferralStatusSchema,
  bonusCredits: z.number().nonnegative(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
})
export type Referral = z.infer<typeof ReferralSchema>
