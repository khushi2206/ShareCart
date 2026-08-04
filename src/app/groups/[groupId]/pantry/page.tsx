import { PantryList } from './pantry-list'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pantry',
}

export default async function PantryPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return <PantryList groupId={groupId} />
}
