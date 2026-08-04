import { ChoresList } from './chores-list'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chores',
}

export default async function ChoresPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return <ChoresList groupId={groupId} />
}
