import { prisma } from '@/lib/prisma'
import { publicProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getDetailsByInviteCodeProcedure = publicProcedure
  .input(
    z.object({
      inviteCode: z.string(),
    }),
  )
  .query(async ({ input: { inviteCode } }) => {
    const group = await prisma.group.findUnique({
      where: { inviteCode },
      include: {
        participants: true,
      },
    })

    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid invite code',
      })
    }

    return {
      id: group.id,
      name: group.name,
      currency: group.currency,
      memberCount: group.participants.length,
      createdAt: group.createdAt,
    }
  })
