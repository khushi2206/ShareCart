import { prisma } from '@/lib/prisma'
import { protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { randomId } from '@/lib/api'
import { z } from 'zod'
import { currentUser } from '@clerk/nextjs/server'

export const joinByInviteProcedure = protectedProcedure
  .input(
    z.object({
      inviteCode: z.string(),
      participantName: z.string().min(2).optional(),
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
    const user = await currentUser()
    const newName =
      participantName || user?.firstName || user?.username || 'Member'

    await prisma.participant.create({
      data: {
        id: randomId(),
        groupId: group.id,
        name: newName,
        userId: ctx.userId,
        role: 'MEMBER',
      },
    })

    return { groupId: group.id }
  })
