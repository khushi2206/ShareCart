import { prisma } from '@/lib/prisma'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const approvalsRouter = createTRPCRouter({
  listPending: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input: { groupId }, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      return prisma.expense.findMany({
        where: { groupId, status: 'PENDING_APPROVAL' },
        include: {
          paidBy: true,
          category: true,
          votes: { include: { participant: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  listRejected: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ input: { groupId }, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      return prisma.expense.findMany({
        where: { groupId, status: 'REJECTED' },
        include: {
          paidBy: true,
          category: true,
          votes: { include: { participant: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  vote: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
        groupId: z.string(),
        vote: z.enum(['APPROVE', 'REJECT']),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await prisma.participant.findFirst({
        where: { groupId: input.groupId, userId: ctx.userId },
      })
      if (!participant) throw new TRPCError({ code: 'FORBIDDEN' })

      const group = await prisma.group.findUnique({ where: { id: input.groupId } })
      if (!group) throw new TRPCError({ code: 'NOT_FOUND' })

      const expense = await prisma.expense.findUnique({
        where: { id: input.expenseId },
        include: { votes: true },
      })
      if (!expense || expense.status !== 'PENDING_APPROVAL') throw new TRPCError({ code: 'BAD_REQUEST' })

      // Prevent requester voting if configured
      if (!group.approvalAllowRequesterVote && expense.paidById === participant.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Requester cannot vote' })
      }

      // Record vote
      await prisma.expenseApprovalVote.upsert({
        where: {
          expenseId_participantId: {
            expenseId: input.expenseId,
            participantId: participant.id,
          },
        },
        update: {
          vote: input.vote,
          comment: input.comment,
        },
        create: {
          expenseId: input.expenseId,
          participantId: participant.id,
          vote: input.vote,
          comment: input.comment,
        },
      })

      // Re-evaluate expense status
      const allVotes = await prisma.expenseApprovalVote.findMany({
        where: { expenseId: input.expenseId },
      })
      
      const approveCount = allVotes.filter(v => v.vote === 'APPROVE').length
      const rejectCount = allVotes.filter(v => v.vote === 'REJECT').length

      let newStatus: string = expense.status
      let rejectionReason = null
      let rejectedBy = null

      if (input.vote === 'REJECT') {
        newStatus = 'REJECTED'
        rejectionReason = input.comment
        rejectedBy = participant.id
      } else if (
        approveCount >= group.approvalMinVotes || 
        (group.approvalAllowOwnerAuto && participant.role === 'OWNER')
      ) {
        newStatus = 'ACTIVE'
      }

      if (newStatus !== expense.status) {
        await prisma.expense.update({
          where: { id: input.expenseId },
          data: {
            status: newStatus as any,
            rejectionReason,
            rejectedBy,
          },
        })
      }

      return { success: true, status: newStatus }
    }),
})
