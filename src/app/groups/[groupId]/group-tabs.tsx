'use client'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

type Props = {
  groupId: string
}

export function GroupTabs({ groupId }: Props) {
  const t = useTranslations()
  const pathname = usePathname()
  const value =
    pathname.replace(/\/groups\/[^\/]+\/([^/]+).*/, '$1') || 'expenses'
  const router = useRouter()

  return (
    <Tabs
      value={value}
      className="w-full flex flex-col gap-2"
      onValueChange={(value) => {
        router.push(`/groups/${groupId}/${value}`)
      }}
    >
      <TabsList className="flex flex-col h-auto w-full items-stretch bg-transparent space-y-1 p-0">
        <TabsTrigger value="expenses" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">{t('Expenses.title')}</TabsTrigger>
        <TabsTrigger value="grocery" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">Grocery</TabsTrigger>
        <TabsTrigger value="balances" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">{t('Balances.title')}</TabsTrigger>
        <TabsTrigger value="information" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">{t('Information.title')}</TabsTrigger>
        <TabsTrigger value="analytics" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">Analytics</TabsTrigger>
        <TabsTrigger value="stats" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">{t('Stats.title')}</TabsTrigger>
        <TabsTrigger value="activity" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">{t('Activity.title')}</TabsTrigger>
        <TabsTrigger value="edit" className="justify-start px-4 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400">{t('Settings.title')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
