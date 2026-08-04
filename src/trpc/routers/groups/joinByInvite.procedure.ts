import { prisma } from '@/lib/prisma'
import { protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { randomId } from '@/lib/api'
import { z } from 'zod'

export const joinByInviteProcedure = protectedProcedure
  .input(
    z.object({
      inviteCode: z.string(),
      participantName: z.string().min(2),
    }),
  )
  .mutation(async ({ input: { inviteCode, participantName }, ctx }) => {
    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: { participants: true },
    })

    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid invite code',
      })
    }

    // Check if user is already in the group
    const existing = group.participants.find((p) => p.userId === ctx.userId)
    if (existing) {
      return { groupId: group.id }
    }

    // Add user as MEMBER
    await prisma.participant.create({
      data: {
        id: randomId(),
        groupId: group.id,
        name: participantName,
        userId: ctx.userId,
        role: 'MEMBER',
      },
    })

    return { groupId: group.id }
  })
