'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export function CalendarView({ groupId }: { groupId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  const { data: events, isLoading } = trpc.calendar.listEvents.useQuery({ 
    groupId,
    start: monthStart,
    end: monthEnd
  })

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Padding for the calendar grid to start on correct weekday (Sunday = 0)
  const startDayOfWeek = monthStart.getDay()
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i)

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const today = () => setCurrentDate(new Date())

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-96 w-full" /></div>
  }

  const getEventColor = (type: string, colorCode: string) => {
    switch (type) {
      case 'GROCERY': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300'
      case 'CHORE': return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300'
      case 'PENDING_APPROVAL': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300'
      case 'EXPENSE': 
        if (colorCode === 'blue') return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
        if (colorCode === 'orange') return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
        return 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          Calendar
        </h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-xl font-semibold mb-2">
        {format(currentDate, 'MMMM yyyy')}
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-[100px]">
          {paddingDays.map(i => (
            <div key={`pad-${i}`} className="border-b border-r bg-muted/20" />
          ))}
          
          {days.map(day => {
            const dayEvents = events?.filter(e => isSameDay(new Date(e.date), day)) || []
            
            return (
              <div 
                key={day.toISOString()} 
                className={`border-b border-r p-1 overflow-y-auto ${!isSameMonth(day, currentDate) ? 'bg-muted/20 text-muted-foreground' : ''} ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold p-1 rounded-full w-6 h-6 flex items-center justify-center ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  {dayEvents.map(evt => (
                    <div 
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`text-[10px] truncate px-1.5 py-0.5 rounded cursor-pointer border ${getEventColor(evt.type, evt.color)}`}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div>
                <div className="text-sm text-muted-foreground font-semibold">Title</div>
                <div className="text-lg">{selectedEvent.title}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground font-semibold">Date</div>
                  <div>{format(new Date(selectedEvent.date), 'PPP')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-semibold">Type</div>
                  <Badge variant="outline">{selectedEvent.type}</Badge>
                </div>
              </div>

              {selectedEvent.type === 'EXPENSE' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground font-semibold">Amount</div>
                      <div className="font-medium text-red-500">{(selectedEvent.amount / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-semibold">Paid By</div>
                      <div>{selectedEvent.metadata.paidBy}</div>
                    </div>
                  </div>
                  {selectedEvent.metadata.notes && (
                    <div>
                      <div className="text-sm text-muted-foreground font-semibold">Notes</div>
                      <p className="text-sm">{selectedEvent.metadata.notes}</p>
                    </div>
                  )}
                </>
              )}

              {selectedEvent.type === 'CHORE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground font-semibold">Assigned To</div>
                    <div>{selectedEvent.metadata.assignedTo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-semibold">Status</div>
                    <Badge>{selectedEvent.metadata.status}</Badge>
                  </div>
                </div>
              )}

              {selectedEvent.type === 'GROCERY' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground font-semibold">Quantity</div>
                    <div>{selectedEvent.metadata.quantity} {selectedEvent.metadata.unit}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
