import { getExpense, verifyGroupAccess } from '@/lib/api'
import { protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupExpenseProcedure = protectedProcedure
  .input(
    z.object({ groupId: z.string().min(1), expenseId: z.string().min(1) }),
  )
  .query(async ({ input: { groupId, expenseId }, ctx }) => {
    await verifyGroupAccess(groupId, ctx.userId)
    const expense = await getExpense(groupId, expenseId)
    if (!expense) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Expense not found',
      })
    }
    return { expense }
  })
