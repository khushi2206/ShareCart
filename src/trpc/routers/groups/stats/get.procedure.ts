import { getGroupExpenses, verifyGroupAccess } from '@/lib/api'
import {
  getTotalActiveUserPaidFor,
  getTotalActiveUserShare,
  getTotalGroupSpending,
} from '@/lib/totals'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const getGroupStatsProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().min(1).optional(),
    }),
  )
  .query(async ({ input: { groupId, participantId }, ctx }) => {
    await verifyGroupAccess(groupId, ctx.userId)
    const expenses = await getGroupExpenses(groupId)
    const totalGroupSpendings = getTotalGroupSpending(expenses)

    const totalParticipantSpendings =
      participantId !== undefined
        ? getTotalActiveUserPaidFor(participantId, expenses)
        : undefined
    const totalParticipantShare =
      participantId !== undefined
        ? getTotalActiveUserShare(participantId, expenses)
        : undefined

    return {
      totalGroupSpendings,
      totalParticipantSpendings,
      totalParticipantShare,
    }
  })
