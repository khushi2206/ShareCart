'use client'

import { GroupTabs } from '@/app/groups/[groupId]/group-tabs'
import { ShareButton } from '@/app/groups/[groupId]/share-button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()

  return (
    <div className="flex flex-col gap-6 sticky top-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">
          <Link href={`/groups/${groupId}`}>
            {isLoading ? (
              <Skeleton className="mt-1.5 mb-1.5 h-8 w-32" />
            ) : (
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {group.name}
              </span>
            )}
          </Link>
        </h1>
        {group && <ShareButton group={group} />}
      </div>

      <div className="w-full">
        <GroupTabs groupId={groupId} />
      </div>
    </div>
  )
}
