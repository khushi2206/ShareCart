'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useBaseUrl } from '@/lib/hooks'
import { Group } from '@prisma/client'
import { Share, Copy, QrCode, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { trpc } from '@/trpc/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

type Props = {
  group: Group
}

export function ShareButton({ group }: Props) {
  const baseUrl = useBaseUrl()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState(group.inviteCode || '')
  const [showQrCode, setShowQrCode] = useState(false)
  const generateMutation = trpc.groups.generateInvite.useMutation()
  const { toast } = useToast()

  // Fallback to /invite/ if baseUrl is not available yet
  const url = baseUrl ? `${baseUrl}/invite/${inviteCode}` : `https://sharecart-two.vercel.app/invite/${inviteCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    toast({ title: 'Invite link copied!' })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join my house ${group.name}`,
        url,
      })
    } else {
      handleCopy()
    }
  }

  const handleRegenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({ groupId: group.id })
      setInviteCode(result.inviteCode)
      toast({ title: 'Invite link regenerated!' })
      router.refresh()
    } catch (e) {
      toast({ title: 'Failed to regenerate invite link.', variant: 'destructive' })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
          <Share className="w-4 h-4 mr-2" />
          Invite Members
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-zinc-900 border-zinc-800 p-4 rounded-2xl shadow-xl flex flex-col gap-4">
        <div>
          <h4 className="font-semibold text-white mb-1">Invite to {group.name}</h4>
          <p className="text-xs text-zinc-400">Anyone with this link can join your house.</p>
        </div>
        
        {inviteCode && (
          <div className="flex flex-col gap-3">
            {showQrCode ? (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl">
                <QRCodeSVG value={url} size={200} />
                <Button variant="link" size="sm" className="mt-2 text-zinc-500" onClick={() => setShowQrCode(false)}>
                  Hide QR Code
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-300 text-xs" value={url} readOnly />
                <Button size="icon" variant="secondary" onClick={handleCopy} className="bg-zinc-800 hover:bg-zinc-700">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button size="sm" variant="outline" className="border-zinc-800 bg-transparent hover:bg-zinc-800 text-xs" onClick={() => setShowQrCode(!showQrCode)}>
                <QrCode className="w-3 h-3 mr-2" />
                {showQrCode ? 'Hide QR' : 'Generate QR'}
              </Button>
              <Button size="sm" variant="outline" className="border-zinc-800 bg-transparent hover:bg-zinc-800 text-xs" onClick={handleShare}>
                <Share className="w-3 h-3 mr-2" />
                Share Link
              </Button>
            </div>

            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs text-zinc-500 hover:text-zinc-300 w-full mt-2" 
              onClick={handleRegenerate}
              disabled={generateMutation.isPending}
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              Regenerate Invite Link
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
