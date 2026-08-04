import { prisma } from '@/lib/prisma'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const analyticsRouter = createTRPCRouter({
  getMemberSpending: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const expenses = await prisma.expense.findMany({
        where: { groupId: input.groupId },
        include: { paidBy: true },
      })

      const spendingByMember = expenses.reduce((acc, expense) => {
        const name = expense.paidBy.name
        acc[name] = (acc[name] || 0) + expense.amount / 100 // assuming amount is in cents
        return acc
      }, {} as Record<string, number>)

      return Object.entries(spendingByMember).map(([name, amount]) => ({
        name,
        amount,
      }))
    }),

  getCategoryDistribution: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const expenses = await prisma.expense.findMany({
        where: { groupId: input.groupId },
        include: { category: true },
      })

      const spendingByCategory = expenses.reduce((acc, expense) => {
        const cat = expense.category?.name || 'Uncategorized'
        acc[cat] = (acc[cat] || 0) + expense.amount / 100
        return acc
      }, {} as Record<string, number>)

      return Object.entries(spendingByCategory).map(([name, amount]) => ({
        name,
        amount,
      }))
    }),
})
