'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X, MessageSquare } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export function ApprovalsList({ groupId }: { groupId: string }) {
  const { data: pending, isLoading } = trpc.approvals.listPending.useQuery({ groupId })
  const { data: group } = trpc.groups.getDetails.useQuery({ groupId })
  const utils = trpc.useUtils()
  const { toast } = useToast()

  const [comment, setComment] = useState('')

  const voteMutation = trpc.approvals.vote.useMutation({
    onSuccess: (res) => {
      toast({ title: 'Success', description: `Voted successfully. Status: ${res.status}` })
      utils.approvals.listPending.invalidate({ groupId })
      utils.groups.getDetails.invalidate({ groupId })
      setComment('')
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  })

  if (isLoading || !group) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>
  }

  const minVotes = group.group.approvalMinVotes || 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Pending Approvals</h1>
      
      {pending?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No pending approvals.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {pending?.map(expense => {
          const approveCount = expense.votes.filter(v => v.vote === 'APPROVE').length
          const rejectCount = expense.votes.filter(v => v.vote === 'REJECT').length
          
          return (
            <Card key={expense.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{expense.title}</CardTitle>
                    <CardDescription>
                      Requested by {expense.paidBy.name} on {new Date(expense.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {(expense.amount / 100).toLocaleString('en-IN', { style: 'currency', currency: group.group.currencyCode || 'INR' })}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium">Votes: {approveCount} / {minVotes} Required</div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ width: `${Math.min(100, (approveCount / minVotes) * 100)}%` }} 
                    />
                  </div>
                </div>

                {expense.notes && (
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                    "{expense.notes}"
                  </p>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                  onClick={() => voteMutation.mutate({ groupId, expenseId: expense.id, vote: 'APPROVE' })}
                  disabled={voteMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex-1" disabled={voteMutation.isPending}>
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Expense</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea 
                        placeholder="Reason for rejection..." 
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => voteMutation.mutate({ groupId, expenseId: expense.id, vote: 'REJECT', comment })}
                      disabled={voteMutation.isPending || !comment.trim()}
                    >
                      Confirm Reject
                    </Button>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
