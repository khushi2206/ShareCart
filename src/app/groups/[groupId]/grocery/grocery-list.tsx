'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, CheckCircle, Circle } from 'lucide-react'

export function GroceryList({ initialItems, groupId }: { initialItems: any[], groupId: string }) {
  const [items, setItems] = useState(initialItems)
  const [newItemName, setNewItemName] = useState('')
  const utils = trpc.useUtils()
  
  const createItem = trpc.grocery.create.useMutation({
    onSuccess: (newItem) => {
      setItems([newItem, ...items])
      setNewItemName('')
    }
  })

  const updateStatus = trpc.grocery.updateStatus.useMutation({
    onSuccess: (updated) => {
      setItems(items.map(i => i.id === updated.id ? updated : i))
    }
  })

  const deleteItem = trpc.grocery.delete.useMutation({
    onSuccess: (_, variables) => {
      setItems(items.filter(i => i.id !== variables.id))
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Input 
          placeholder="Add a new grocery item..." 
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newItemName.trim() && createItem.mutate({ groupId, name: newItemName.trim() })}
        />
        <Button 
          disabled={!newItemName.trim() || createItem.isPending}
          onClick={() => createItem.mutate({ groupId, name: newItemName.trim() })}
        >
          Add
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Card key={item.id} className={item.status === 'PURCHASED' ? 'opacity-60' : ''}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => updateStatus.mutate({ id: item.id, groupId, status: item.status === 'PENDING' ? 'PURCHASED' : 'PENDING' })}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.status === 'PURCHASED' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={item.status === 'PURCHASED' ? 'line-through' : ''}>
                  {item.name} {item.quantity > 1 && <span className="text-muted-foreground text-sm ml-1">x{item.quantity}</span>}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteItem.mutate({ id: item.id, groupId })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No groceries yet.
          </div>
        )}
      </div>
    </div>
  )
}
