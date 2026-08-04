import { prisma } from '@/lib/prisma'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const groceryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input: { groupId }, ctx }) => {
      // First, ensure user is a participant of the group
      const participant = await prisma.participant.findFirst({
        where: { groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      return prisma.groceryItem.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        name: z.string().min(1),
        quantity: z.number().min(1).default(1),
        unit: z.string().optional(),
        visibility: z.enum(['SHARED', 'PERSONAL']).default('SHARED'),
        assignedTo: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const item = await prisma.groceryItem.create({
        data: {
          ...input,
          createdBy: ctx.userId,
        },
      })

      await prisma.activity.create({
        data: {
          id: crypto.randomUUID(),
          groupId: input.groupId,
          activityType: 'CREATE_GROCERY',
          data: item.name,
          participantId: participant.id,
        },
      })

      return item
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        groupId: z.string(),
        status: z.enum(['PENDING', 'PURCHASED']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const item = await prisma.groceryItem.update({
        where: { id: input.id },
        data: {
          status: input.status,
          purchasedAt: input.status === 'PURCHASED' ? new Date() : null,
          purchasedBy: input.status === 'PURCHASED' ? ctx.userId : null,
        },
      })

      if (input.status === 'PURCHASED') {
        await prisma.activity.create({
          data: {
            id: crypto.randomUUID(),
            groupId: input.groupId,
            activityType: 'PURCHASE_GROCERY',
            data: item.name,
            participantId: participant.id,
          },
        })
      }

      return item
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const item = await prisma.groceryItem.delete({
        where: { id: input.id },
      })

      await prisma.activity.create({
        data: {
          id: crypto.randomUUID(),
          groupId: input.groupId,
          activityType: 'DELETE_GROCERY',
          data: item.name,
          participantId: participant.id,
        },
      })

      return { success: true }
    }),
})
