import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export default async function BillsPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { documents: true, paidBy: true },
    orderBy: { expenseDate: 'desc' },
  })

  const bills = expenses.flatMap((exp) => 
    exp.documents.map(doc => ({ ...doc, expense: exp }))
  )

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Bills & Receipts Gallery</h2>
      
      {bills.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No receipts uploaded yet. Upload a receipt when adding an expense to see it here!
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bills.map((bill) => (
            <Card key={bill.id} className="overflow-hidden hover:shadow-md transition-shadow group relative">
              <Link href={`/groups/${groupId}/expenses/${bill.expense.id}/edit`}>
                <div className="aspect-[3/4] relative bg-muted">
                  <Image 
                    src={bill.url} 
                    alt="Receipt" 
                    fill 
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                    <p className="font-semibold truncate">{bill.expense.title}</p>
                    <p className="text-sm text-gray-200">
                      {(bill.expense.amount / 100).toFixed(2)} - Paid by {bill.expense.paidBy.name}
                    </p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
