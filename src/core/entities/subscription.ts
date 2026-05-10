import { z } from "zod"

export const SubscriptionStatusSchema = z.enum(["active", "trialing", "past_due", "canceled"])
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>

// ─── Firestore document schema ────────────────────────────────────────────────

export const SubscriptionDocumentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  planId: z.string(),
  status: SubscriptionStatusSchema,

  currentPeriodStart: z.string(), 
  currentPeriodEnd: z.string(),   
  cancelAtPeriodEnd: z.boolean().default(false),

  // Payment provider info
  provider: z.string(),
  autoRenew: z.boolean(),
  cardBrand: z.string().optional(),
  // String to preserve leading zeros
  cardLast4: z.string().regex(/^\d{4}$/).optional(),

  // Timestamps 
  startedAt: z.string(),
  nextBillingDate: z.string().optional(),
  canceledAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type SubscriptionDocument = z.infer<typeof SubscriptionDocumentSchema>
