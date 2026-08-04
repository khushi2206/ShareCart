import { prisma } from '@/lib/prisma'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const pantryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input: { groupId }, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      return prisma.pantryItem.findMany({
        where: { groupId },
        include: { category: true },
        orderBy: { name: 'asc' },
      })
    }),

  updateQuantity: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        groupId: z.string(),
        quantity: z.number().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const existingItem = await prisma.pantryItem.findUnique({
        where: { id: input.id },
      })
      if (!existingItem) throw new TRPCError({ code: 'NOT_FOUND' })

      let newStatus = existingItem.status
      if (input.quantity === 0) {
        newStatus = 'OUT_OF_STOCK'
      } else if (existingItem.minQuantity && input.quantity <= existingItem.minQuantity) {
        newStatus = 'RUNNING_LOW'
      } else {
        newStatus = 'IN_STOCK'
      }

      return prisma.pantryItem.update({
        where: { id: input.id },
        data: {
          quantity: input.quantity,
          status: newStatus,
        },
      })
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        groupId: z.string(),
        minQuantity: z.number().nullable().optional(),
        expiryDate: z.date().nullable().optional(),
        categoryId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const dataToUpdate: any = {}
      if (input.minQuantity !== undefined) dataToUpdate.minQuantity = input.minQuantity
      if (input.expiryDate !== undefined) dataToUpdate.expiryDate = input.expiryDate
      if (input.categoryId !== undefined) dataToUpdate.categoryId = input.categoryId

      // Re-evaluate status if minQuantity changes
      if (input.minQuantity !== undefined) {
        const item = await prisma.pantryItem.findUnique({ where: { id: input.id } })
        if (item) {
          if (item.quantity === 0) {
            dataToUpdate.status = 'OUT_OF_STOCK'
          } else if (input.minQuantity !== null && item.quantity <= input.minQuantity) {
            dataToUpdate.status = 'RUNNING_LOW'
          } else {
            dataToUpdate.status = 'IN_STOCK'
          }
        }
      }

      return prisma.pantryItem.update({
        where: { id: input.id },
        data: dataToUpdate,
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      await prisma.pantryItem.delete({
        where: { id: input.id },
      })
      return { success: true }
    }),

  generateShoppingList: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const lowStockItems = await prisma.pantryItem.findMany({
        where: {
          groupId: input.groupId,
          status: {
            in: ['RUNNING_LOW', 'OUT_OF_STOCK'],
          }
        }
      })

      if (lowStockItems.length === 0) return { success: true, count: 0 }

      const newGroceries = lowStockItems.map((item) => ({
        groupId: input.groupId,
        name: item.name,
        quantity: item.minQuantity ? (item.minQuantity - item.quantity > 0 ? Math.ceil(item.minQuantity - item.quantity) : 1) : 1,
        unit: item.unit,
        createdBy: ctx.userId,
        status: 'PENDING' as const,
      }))

      await prisma.groceryItem.createMany({
        data: newGroceries,
      })

      return { success: true, count: lowStockItems.length }
    }),
})
