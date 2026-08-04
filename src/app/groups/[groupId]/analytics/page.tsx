import { api } from '@/trpc/server'
import { AnalyticsCharts } from './analytics-charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const trpc = await api()
  const memberSpending = await trpc.analytics.getMemberSpending({ groupId })
  const categoryDistribution = await trpc.analytics.getCategoryDistribution({ groupId })

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Analytics & Reports</h2>
      <AnalyticsCharts 
        memberSpending={memberSpending} 
        categoryDistribution={categoryDistribution} 
      />
    </div>
  )
}
