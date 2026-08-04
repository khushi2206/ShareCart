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
    <main className="flex-1 w-full p-4 md:p-8 lg:p-12 flex flex-col gap-10 bg-black min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-8 md:p-12 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black opacity-60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
        <div className="z-10 flex flex-col gap-3 text-center md:text-left mb-6 md:mb-0">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
            Welcome back, <span className="text-green-500">{user?.firstName || 'User'}</span>!
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl">
            Manage your shared houses, track expenses seamlessly, and coordinate grocery lists all in one place.
          </p>
        </div>
        <div className="z-10 flex gap-4 items-center w-full md:w-auto justify-center">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-500 text-white rounded-2xl shadow-xl hover:shadow-green-500/30 transition-all duration-500 text-lg px-8 py-6 w-full md:w-auto font-bold tracking-wide">
            <Link href="/groups/create"><Plus className="w-6 h-6 mr-3" /> Create New House</Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl hover:bg-zinc-900/60 transition-all duration-500 shadow-xl p-4 rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-zinc-400 uppercase tracking-wider">Total Houses</CardTitle>
            <div className="p-3 bg-green-500/10 rounded-2xl">
              <Home className="w-6 h-6 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-black text-white">{groups.length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl hover:bg-zinc-900/60 transition-all duration-500 shadow-xl p-4 rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-zinc-400 uppercase tracking-wider">Recent Activity</CardTitle>
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-xl hover:bg-zinc-900/60 transition-all duration-500 shadow-xl p-4 rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-zinc-400 uppercase tracking-wider">Total Spending</CardTitle>
            <div className="p-3 bg-rose-500/10 rounded-2xl">
              <CreditCard className="w-6 h-6 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-500 mt-2">View inside houses</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex-1">
        <h2 className="text-3xl font-black mb-8 text-white flex items-center gap-4">
          Your Shared Houses
          <span className="bg-green-500/20 text-green-400 text-lg py-1 px-4 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.2)]">{groups.length}</span>
        </h2>
        
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-zinc-900/20 border-2 border-zinc-800 border-dashed rounded-3xl text-center min-h-[40vh]">
            <div className="w-24 h-24 bg-zinc-800/80 rounded-3xl flex items-center justify-center mb-8 rotate-3 hover:rotate-6 transition-transform shadow-xl">
              <Home className="w-12 h-12 text-zinc-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">No houses yet</h3>
            <p className="text-xl text-zinc-400 max-w-lg mb-10 leading-relaxed">Create your first shared house to start managing expenses, grocery lists, and bills with your roommates, friends, or family.</p>
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-500 text-lg px-10 py-6 rounded-2xl shadow-xl hover:shadow-green-500/25 transition-all">
              <Link href="/groups/create"><Plus className="w-6 h-6 mr-3" /> Create First House</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {groups.map((group) => (
              <Link href={`/groups/${group.id}`} key={group.id} className="group outline-none block h-full">
                <Card className="h-full bg-zinc-900/60 border-zinc-800 hover:border-green-500/60 hover:bg-zinc-800 transition-all duration-500 relative overflow-hidden group-focus-visible:ring-4 ring-green-500/50 rounded-3xl shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/20 transition-all duration-700" />
                  <CardHeader className="p-8">
                    <CardTitle className="flex justify-between items-start text-white mb-4">
                      <span className="text-3xl font-black group-hover:text-green-400 transition-colors drop-shadow-sm line-clamp-2">{group.name}</span>
                    </CardTitle>
                    <div className="w-12 h-1 bg-green-500/30 rounded-full mb-6 group-hover:bg-green-500 transition-colors duration-500" />
                    <p className="text-lg font-medium text-zinc-400 flex items-center gap-3">
                      <span className="flex -space-x-3">
                        {Array.from({ length: Math.min(group.participants.length, 3) }).map((_, i) => (
                          <span key={i} className="w-10 h-10 rounded-full bg-zinc-700 border-2 border-zinc-900 shadow-md flex items-center justify-center text-xs font-bold text-zinc-300">
                            {i === 2 && group.participants.length > 3 ? '+' + (group.participants.length - 2) : ''}
                          </span>
                        ))}
                      </span>
                      <span className="ml-2">{group.participants.length} {group.participants.length === 1 ? 'member' : 'members'}</span>
                    </p>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="flex justify-end items-center">
                      <div className="text-green-500 flex items-center text-lg font-bold opacity-0 -translate-x-6 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out bg-green-500/10 px-4 py-2 rounded-full">
                        Enter <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
