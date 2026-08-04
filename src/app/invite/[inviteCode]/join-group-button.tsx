'use client'

import { Button } from '@/components/ui/button'
import { trpc } from '@/trpc/client'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function JoinGroupButton({ inviteCode }: { inviteCode: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const joinMutation = trpc.groups.joinByInvite.useMutation()

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      const result = await joinMutation.mutateAsync({ inviteCode })
      router.push(`/groups/${result.groupId}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      // Ideally show a toast error here
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading}
      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg h-14 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <>
          Join Group <ArrowRight className="ml-2 w-5 h-5" />
        </>
      )}
    </Button>
  )
}
