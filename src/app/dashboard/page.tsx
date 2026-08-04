import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Plus, Home, Activity, CreditCard } from 'lucide-react'
import { currentUser } from '@clerk/nextjs/server'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const user = await currentUser()
  const userId = user?.id
  if (!userId) return null

  const groups = await prisma.group.findMany({
    where: { participants: { some: { userId } } },
    include: { participants: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return (
    <main className="flex-1 w-full mx-auto p-4 md:p-8 flex flex-col gap-8 max-w-6xl">
      <header className="flex justify-between items-center bg-gradient-to-r from-zinc-900 to-black p-6 rounded-2xl border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="z-10 flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome back, {user?.firstName || 'User'}!</h1>
          <p className="text-zinc-400">Manage your shared houses, expenses, and grocery lists.</p>
        </div>
        <div className="z-10 flex gap-4 items-center">
          <Button asChild className="bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300">
            <Link href="/groups/create"><Plus className="w-4 h-4 mr-2" /> New House</Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Houses</CardTitle>
            <Home className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-white">{groups.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Recent Activity</CardTitle>
            <Activity className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-white">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Spending</CardTitle>
            <CreditCard className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-zinc-500">View inside houses</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          Your Houses
          <span className="bg-green-500/20 text-green-400 text-xs py-1 px-2 rounded-full">{groups.length}</span>
        </h2>
        
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-2xl text-center">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <Home className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No houses yet</h3>
            <p className="text-zinc-400 max-w-sm mb-6">Create your first shared house to start managing expenses, grocery lists, and bills together.</p>
            <Button asChild className="bg-green-600 hover:bg-green-500">
              <Link href="/groups/create"><Plus className="w-4 h-4 mr-2" /> Create First House</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Link href={`/groups/${group.id}`} key={group.id} className="group outline-none">
                <Card className="h-full bg-zinc-900 border-zinc-800 hover:border-green-500/50 hover:bg-zinc-800/50 transition-all duration-300 relative overflow-hidden group-focus-visible:ring-2 ring-green-500">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-green-500/10 transition-colors" />
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start text-white">
                      <span className="text-xl group-hover:text-green-400 transition-colors">{group.name}</span>
                    </CardTitle>
                    <p className="text-sm font-medium text-zinc-500 mt-2 flex items-center gap-2">
                      <span className="flex -space-x-2">
                        {/* Fake avatars based on participants count */}
                        {Array.from({ length: Math.min(group.participants.length, 3) }).map((_, i) => (
                          <span key={i} className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-zinc-900 block" />
                        ))}
                      </span>
                      {group.participants.length} members
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end mt-4">
                      <div className="text-green-500 flex items-center text-sm font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Enter House <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
