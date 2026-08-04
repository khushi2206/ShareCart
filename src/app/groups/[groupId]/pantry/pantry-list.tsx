'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Plus, Minus, Settings2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export function PantryList({ groupId }: { groupId: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const { toast } = useToast()
  
  const utils = trpc.useUtils()
  const { data: items, isLoading } = trpc.pantry.list.useQuery({ groupId })
  
  const updateQuantity = trpc.pantry.updateQuantity.useMutation({
    onSuccess: () => utils.pantry.list.invalidate({ groupId })
  })
  
  const updateItem = trpc.pantry.updateItem.useMutation({
    onSuccess: () => utils.pantry.list.invalidate({ groupId })
  })
  
  const deleteItem = trpc.pantry.delete.useMutation({
    onSuccess: () => utils.pantry.list.invalidate({ groupId })
  })
  
  const generateList = trpc.pantry.generateShoppingList.useMutation({
    onSuccess: (res) => {
      if (res.count > 0) {
        toast({ title: 'Success', description: `Added ${res.count} items to grocery list!` })
      } else {
        toast({ title: 'Info', description: "No items running low or out of stock." })
      }
    }
  })

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-20 w-full" /></div>
  }

  const filteredItems = items?.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Pantry</h1>
        <Button 
          onClick={() => generateList.mutate({ groupId })}
          disabled={generateList.isPending}
        >
          Generate Shopping List
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
          placeholder="Search pantry..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="IN_STOCK">✅ In Stock</SelectItem>
            <SelectItem value="RUNNING_LOW">🟡 Running Low</SelectItem>
            <SelectItem value="OUT_OF_STOCK">🔴 Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredItems?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items found in pantry.
          </div>
        )}
        
        {filteredItems?.map(item => (
          <Card key={item.id} className={item.status === 'OUT_OF_STOCK' ? 'opacity-70' : ''}>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.name}</span>
                  <Badge variant="outline" className={
                    item.status === 'IN_STOCK' ? 'border-green-500 text-green-500' :
                    item.status === 'RUNNING_LOW' ? 'border-yellow-500 text-yellow-500' :
                    'border-red-500 text-red-500'
                  }>
                    {item.status === 'IN_STOCK' && '✅ In Stock'}
                    {item.status === 'RUNNING_LOW' && '🟡 Running Low'}
                    {item.status === 'OUT_OF_STOCK' && '🔴 Out of Stock'}
                  </Badge>
                </div>
                {item.expiryDate && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(item.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => updateQuantity.mutate({ id: item.id, groupId, quantity: Math.max(0, item.quantity - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => updateQuantity.mutate({ id: item.id, groupId, quantity: item.quantity + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit {item.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Minimum Quantity (Triggers Low Stock)</Label>
                        <Input 
                          type="number" 
                          defaultValue={item.minQuantity || ''} 
                          onChange={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value) : null
                            updateItem.mutate({ id: item.id, groupId, minQuantity: val })
                          }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Exact Quantity</Label>
                        <Input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value) : 0
                            updateQuantity.mutate({ id: item.id, groupId, quantity: val })
                          }}
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteItem.mutate({ id: item.id, groupId })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
