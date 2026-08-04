import { api } from '@/trpc/server'
import { GroceryList } from './grocery-list'

export default async function GroceryPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const trpc = await api()
  const items = await trpc.grocery.list({ groupId })

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Grocery List</h2>
      <GroceryList initialItems={items} groupId={groupId} />
    </div>
  )
}
