'use client'

import { trpc } from '@/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export function DashboardClient({ groupId }: { groupId: string }) {
  const { data: pantryItems, isLoading: isLoadingPantry } = trpc.pantry.list.useQuery({ groupId })
  const { data: chores, isLoading: isLoadingChores } = trpc.chores.list.useQuery({ groupId })
  const { data: pendingApprovals, isLoading: isLoadingApprovals } = trpc.approvals.listPending.useQuery({ groupId })

  if (isLoadingPantry || isLoadingChores || isLoadingApprovals) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const totalItems = pantryItems?.length || 0
  const runningLow = pantryItems?.filter(item => item.status === 'RUNNING_LOW').length || 0
  const outOfStock = pantryItems?.filter(item => item.status === 'OUT_OF_STOCK').length || 0

  const pendingChoresCount = chores?.filter(c => c.status !== 'COMPLETED').length || 0
  const completedChoresCount = chores?.filter(c => c.status === 'COMPLETED').length || 0
  
  const pendingApprovalsCount = pendingApprovals?.length || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href={`/groups/${groupId}/pantry`} className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Pantry</CardTitle>
              <CardDescription>Inventory overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Items</p>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    Running Low
                  </span>
                  <span className="font-medium">{runningLow}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Out of Stock
                  </span>
                  <span className="font-medium">{outOfStock}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Chores Card */}
        <Link href={`/groups/${groupId}/chores`} className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full border-cyan-200">
            <CardHeader className="pb-2">
              <CardTitle>Chores</CardTitle>
              <CardDescription>Household tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingChoresCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending Chores</p>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Completed
                  </span>
                  <span className="font-medium">{completedChoresCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Approvals Card */}
        <Link href={`/groups/${groupId}/approvals`} className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full border-red-200">
            <CardHeader className="pb-2">
              <CardTitle>Approvals</CardTitle>
              <CardDescription>Pending expense approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{pendingApprovalsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Require Review</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
