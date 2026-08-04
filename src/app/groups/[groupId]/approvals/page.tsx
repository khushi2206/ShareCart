import { ApprovalsList } from './approvals-list'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pending Approvals',
}

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return <ApprovalsList groupId={groupId} />
}
