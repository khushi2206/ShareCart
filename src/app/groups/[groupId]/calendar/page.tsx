import { CalendarView } from './calendar-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendar',
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return <CalendarView groupId={groupId} />
}
