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

        // Auto-add to Pantry
        const existingPantryItem = await prisma.pantryItem.findFirst({
          where: {
            groupId: input.groupId,
            name: {
              equals: item.name,
              mode: 'insensitive',
            }
          }
        })

        if (existingPantryItem) {
          const newQuantity = existingPantryItem.quantity + item.quantity
          let newStatus = existingPantryItem.status
          if (newQuantity > 0 && existingPantryItem.status === 'OUT_OF_STOCK') {
            newStatus = 'IN_STOCK'
          }
          if (existingPantryItem.minQuantity && newQuantity <= existingPantryItem.minQuantity && newQuantity > 0) {
            newStatus = 'RUNNING_LOW'
          }

          await prisma.pantryItem.update({
            where: { id: existingPantryItem.id },
            data: {
              quantity: newQuantity,
              status: newStatus,
              purchasedDate: new Date(),
            }
          })
        } else {
          await prisma.pantryItem.create({
            data: {
              groupId: input.groupId,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              status: 'IN_STOCK',
              addedBy: ctx.userId,
            }
          })
        }
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
