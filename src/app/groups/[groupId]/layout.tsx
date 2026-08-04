import { cached } from '@/app/cached-functions'
import { Metadata } from 'next'
import { PropsWithChildren } from 'react'
import { GroupLayoutClient } from './layout.client'
import { auth } from '@clerk/nextjs/server'
import { verifyGroupAccess } from '@/lib/api'
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{
    groupId: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { groupId } = await params
  const group = await cached.getGroup(groupId)

  return {
    title: {
      default: group?.name ?? '',
      template: `%s · ${group?.name} · Spliit`,
    },
  }
}

export default async function GroupLayout({
  children,
  params,
}: PropsWithChildren<Props>) {
  const { groupId } = await params
  
  const { userId } = await auth()
  if (!userId) {
    redirect('/')
  }
  
  try {
    await verifyGroupAccess(groupId, userId)
  } catch (error) {
    redirect('/dashboard') // User does not have access
  }

  return <GroupLayoutClient groupId={groupId}>{children}</GroupLayoutClient>
}
