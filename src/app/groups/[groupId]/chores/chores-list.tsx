'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, CheckCircle, Clock, RotateCcw, Award } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function ChoresList({ groupId }: { groupId: string }) {
  const { data: chores, isLoading } = trpc.chores.list.useQuery({ groupId })
  const { data: group } = trpc.groups.getDetails.useQuery({ groupId })
  const { data: leaderboard } = trpc.chores.leaderboard.useQuery({ groupId })
  const utils = trpc.useUtils()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('10')
  const [assignedTo, setAssignedTo] = useState('unassigned')
  const [priority, setPriority] = useState('MEDIUM')
  const [recurrence, setRecurrence] = useState('NONE')

  const createMutation = trpc.chores.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Chore created!' })
      utils.chores.list.invalidate({ groupId })
      setIsOpen(false)
      setTitle('')
    }
  })

  const updateStatusMutation = trpc.chores.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Chore updated!' })
      utils.chores.list.invalidate({ groupId })
      utils.chores.leaderboard.invalidate({ groupId })
    }
  })

  if (isLoading || !group) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Household Chores</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Chore</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Chore</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Wash Dishes" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Anyone</SelectItem>
                      {group.group.participants.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reward Points</Label>
                  <Input type="number" value={points} onChange={e => setPoints(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select value={recurrence} onValueChange={setRecurrence}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Once</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={!title || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  groupId,
                  title,
                  assignedToId: assignedTo === 'unassigned' ? undefined : assignedTo,
                  rewardPoints: parseInt(points, 10),
                  priority: priority as any,
                  recurrenceRule: recurrence as any,
                  dueDate: new Date(), // Setting today as due date for simplicity
                })}
              >
                Create Chore
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Leaderboard */}
        <Card className="md:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Award className="mr-2 h-5 w-5 text-yellow-500" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leaderboard?.map((entry, i) => (
              <div key={entry.participantId} className="flex items-center justify-between p-2 rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                    #{i + 1}
                  </div>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <Badge variant="secondary">{entry.totalPoints} pts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chores List */}
        <div className="md:col-span-2 space-y-4">
          {chores?.filter(c => c.status !== 'COMPLETED').map(chore => (
            <Card key={chore.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{chore.title}</span>
                    {chore.priority === 'HIGH' && <Badge variant="destructive">High</Badge>}
                    <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">{chore.rewardPoints} pts</Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <span>Assignee: {chore.assignedTo?.name || 'Unassigned'}</span>
                    {chore.recurrenceRule !== 'NONE' && (
                      <span className="flex items-center"><RotateCcw className="mr-1 h-3 w-3" /> {chore.recurrenceRule}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => updateStatusMutation.mutate({ id: chore.id, groupId, status: 'COMPLETED' })}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {chores?.filter(c => c.status !== 'COMPLETED').length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              All caught up! No pending chores.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
