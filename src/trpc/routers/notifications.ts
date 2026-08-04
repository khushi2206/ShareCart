import { prisma } from '@/lib/prisma'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ groupId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      // Find all groups the user belongs to
      const participantRecords = await prisma.participant.findMany({
        where: { userId: ctx.userId },
        select: { groupId: true },
      })
      const groupIds = participantRecords.map((p) => p.groupId)

      const filterGroupId = input.groupId && groupIds.includes(input.groupId) ? [input.groupId] : groupIds

      return prisma.notification.findMany({
        where: {
          groupId: { in: filterGroupId },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Verify user has access to this notification's group
      const notification = await prisma.notification.findUnique({ where: { id: input.id } })
      if (!notification) return { success: false }

      const participant = await prisma.participant.findFirst({
        where: { groupId: notification.groupId, userId: ctx.userId },
      })
      if (participant) {
        await prisma.notification.update({
          where: { id: input.id },
          data: { isRead: true },
        })
      }
      return { success: true }
    }),
})
