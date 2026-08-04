import { prisma } from '@/lib/prisma'
import { randomId, verifyGroupAccess } from '@/lib/api'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const generateInviteProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
    }),
  )
  .mutation(async ({ input: { groupId }, ctx }) => {
    // Only group members can generate new invite codes
    await verifyGroupAccess(groupId, ctx.userId)

    const newInviteCode = randomId()

    await prisma.group.update({
      where: { id: groupId },
      data: { inviteCode: newInviteCode },
    })

    return { inviteCode: newInviteCode }
  })
