import { prisma } from '@/lib/prisma'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const choresRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input: { groupId }, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      return prisma.chore.findMany({
        where: { groupId },
        include: { assignedTo: true, category: true },
        orderBy: { dueDate: 'asc' },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        assignedToId: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
        dueDate: z.date().optional(),
        recurrenceRule: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).default('NONE'),
        rewardPoints: z.number().default(0),
        categoryId: z.number().optional(),
        estimatedTime: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      return prisma.chore.create({
        data: {
          ...input,
          createdBy: ctx.userId,
        },
      })
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        groupId: z.string(),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'OVERDUE']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const chore = await prisma.chore.findUnique({ where: { id: input.id } })
      if (!chore) throw new TRPCError({ code: 'NOT_FOUND' })

      const updated = await prisma.chore.update({
        where: { id: input.id },
        data: {
          status: input.status,
          completedAt: input.status === 'COMPLETED' ? new Date() : null,
        },
      })

      // If chore is recurring and marked as completed/skipped, generate the next instance
      if (['COMPLETED', 'SKIPPED'].includes(input.status) && chore.recurrenceRule !== 'NONE' && chore.dueDate) {
        const nextDate = new Date(chore.dueDate)
        if (chore.recurrenceRule === 'DAILY') nextDate.setDate(nextDate.getDate() + 1)
        else if (chore.recurrenceRule === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7)
        else if (chore.recurrenceRule === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1)

        await prisma.chore.create({
          data: {
            groupId: chore.groupId,
            title: chore.title,
            description: chore.description,
            assignedToId: chore.assignedToId,
            priority: chore.priority,
            dueDate: nextDate,
            recurrenceRule: chore.recurrenceRule,
            rewardPoints: chore.rewardPoints,
            categoryId: chore.categoryId,
            estimatedTime: chore.estimatedTime,
            createdBy: ctx.userId,
            status: 'PENDING',
          },
        })
      }

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      await prisma.chore.delete({
        where: { id: input.id },
      })
      return { success: true }
    }),

  leaderboard: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input: { groupId }, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const participants = await prisma.participant.findMany({
        where: { groupId },
        include: {
          choresAssigned: {
            where: { status: 'COMPLETED' },
          },
        },
      })

      return participants
        .map((p) => {
          const completedChores = p.choresAssigned.length
          const totalPoints = p.choresAssigned.reduce((acc, chore) => acc + chore.rewardPoints, 0)
          return {
            participantId: p.id,
            name: p.name,
            completedChores,
            totalPoints,
          }
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)
    }),
})
