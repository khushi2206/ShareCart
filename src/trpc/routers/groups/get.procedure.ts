import { getGroup, verifyGroupAccess } from '@/lib/api'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const getGroupProcedure = protectedProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ input: { groupId }, ctx }) => {
    await verifyGroupAccess(groupId, ctx.userId)
    const group = await getGroup(groupId)
    return { group }
  })
