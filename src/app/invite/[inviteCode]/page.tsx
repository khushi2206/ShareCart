import { api } from '@/trpc/server'
import { SignInButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { Users, Home, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { JoinGroupButton } from './join-group-button'
import { notFound } from 'next/navigation'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteCode: string }>
}) {
  const { inviteCode } = await params

  let groupDetails;
  let userId;

  try {
    const trpc = await api()
    groupDetails = await trpc.groups.getDetailsByInviteCode({ inviteCode })
    const authResult = await auth()
    userId = authResult.userId
  } catch (error) {
    console.error(error)
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-red-500/50 shadow-2xl rounded-3xl p-8 text-center">
          <CardTitle className="text-2xl font-bold text-red-500 mb-4">Invalid Invitation</CardTitle>
          <CardDescription className="text-zinc-400 text-lg">
            This invitation link is expired or invalid.
          </CardDescription>
        </Card>
      </main>
    )
  }

  return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black opacity-80 pointer-events-none" />
        
        <Card className="w-full max-w-md bg-zinc-900/60 border-zinc-800 backdrop-blur-xl shadow-2xl rounded-3xl relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <CardHeader className="text-center pt-10 pb-6 border-b border-zinc-800/50">
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-zinc-900 shadow-xl">
              <Home className="w-10 h-10 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-black text-white mb-2">
              You've been invited!
            </CardTitle>
            <CardDescription className="text-zinc-400 text-base">
              Join this house to start sharing expenses and groceries.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="bg-zinc-800/50 rounded-2xl p-6 mb-8 border border-zinc-700/50">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">{groupDetails.name}</h3>
              
              <div className="space-y-4">
                <div className="flex items-center text-zinc-300">
                  <Users className="w-5 h-5 mr-4 text-green-500" />
                  <span className="font-medium">{groupDetails.memberCount} Members</span>
                </div>
                <div className="flex items-center text-zinc-300">
                  <span className="w-5 h-5 mr-4 flex items-center justify-center text-green-500 font-bold">$</span>
                  <span className="font-medium">Uses {groupDetails.currency} currency</span>
                </div>
                <div className="flex items-center text-zinc-300">
                  <Calendar className="w-5 h-5 mr-4 text-green-500" />
                  <span className="font-medium">Created on {new Date(groupDetails.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {userId ? (
              <JoinGroupButton inviteCode={inviteCode} />
            ) : (
              <SignInButton mode="modal" forceRedirectUrl={`/invite/${inviteCode}`}>
                <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg h-14 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all">
                  Sign in to Join <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </SignInButton>
            )}
          </CardContent>
        </Card>
      </main>
    )
}
