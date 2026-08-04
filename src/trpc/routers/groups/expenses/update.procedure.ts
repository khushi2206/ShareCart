import { updateExpense, verifyGroupAccess } from '@/lib/api'
import { expenseFormSchema } from '@/lib/schemas'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const updateGroupExpenseProcedure = protectedProcedure
  .input(
    z.object({
      expenseId: z.string().min(1),
      groupId: z.string().min(1),
      expenseFormValues: expenseFormSchema,
      participantId: z.string().optional(),
    }),
  )
  .mutation(
    async ({
      input: { expenseId, groupId, expenseFormValues, participantId },
      ctx,
    }) => {
      await verifyGroupAccess(groupId, ctx.userId)
      const expense = await updateExpense(
        groupId,
        expenseId,
        expenseFormValues,
        participantId,
      )
      return { expenseId: expense.id }
    },
  )
