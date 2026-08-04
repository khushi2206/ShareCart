import { updateGroup, verifyGroupAccess } from '@/lib/api'
import { groupFormSchema } from '@/lib/schemas'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const updateGroupProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      groupFormValues: groupFormSchema,
      participantId: z.string().optional(),
    }),
  )
  .mutation(async ({ input: { groupId, groupFormValues, participantId }, ctx }) => {
    await verifyGroupAccess(groupId, ctx.userId)
    await updateGroup(groupId, groupFormValues, participantId)
  })
