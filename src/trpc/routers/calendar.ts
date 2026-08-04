import { prisma } from '@/lib/prisma'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const calendarRouter = createTRPCRouter({
  listEvents: protectedProcedure
    .input(z.object({ groupId: z.string(), start: z.date(), end: z.date() }))
    .query(async ({ input, ctx }) => {
      const { groupId, start, end } = input
      const participant = await prisma.participant.findFirst({
        where: { groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      // Fetch Expenses
      const expenses = await prisma.expense.findMany({
        where: {
          groupId,
          expenseDate: { gte: start, lte: end },
        },
        include: { category: true, paidBy: true },
      })

      // Fetch Chores
      const chores = await prisma.chore.findMany({
        where: {
          groupId,
          dueDate: { gte: start, lte: end },
        },
        include: { assignedTo: true, category: true },
      })

      // Fetch Groceries purchased
      const groceries = await prisma.groceryItem.findMany({
        where: {
          groupId,
          purchasedAt: { gte: start, lte: end },
        },
      })

      const events = []

      for (const exp of expenses) {
        events.push({
          id: `exp-${exp.id}`,
          title: exp.title,
          date: exp.expenseDate,
          type: exp.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'EXPENSE',
          amount: exp.amount,
          category: exp.category?.name || 'General',
          color: exp.status === 'PENDING_APPROVAL' ? 'red' : 'blue', // Will refine colors in UI
          metadata: {
            paidBy: exp.paidBy.name,
            notes: exp.notes,
            status: exp.status,
          }
        })
      }

      for (const chore of chores) {
        if (chore.dueDate) {
          events.push({
            id: `chore-${chore.id}`,
            title: chore.title,
            date: chore.dueDate,
            type: 'CHORE',
            color: 'cyan',
            metadata: {
              assignedTo: chore.assignedTo?.name || 'Unassigned',
              priority: chore.priority,
              status: chore.status,
            }
          })
        }
      }

      for (const grocery of groceries) {
        if (grocery.purchasedAt) {
          events.push({
            id: `gro-${grocery.id}`,
            title: `🛒 ${grocery.name}`,
            date: grocery.purchasedAt,
            type: 'GROCERY',
            color: 'green',
            metadata: {
              quantity: grocery.quantity,
              unit: grocery.unit,
            }
          })
        }
      }

      return events.sort((a, b) => a.date.getTime() - b.date.getTime())
    }),
})
