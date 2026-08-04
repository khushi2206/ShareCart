import { categoriesRouter } from '@/trpc/routers/categories'
import { groupsRouter } from '@/trpc/routers/groups'
import { groceryRouter } from '@/trpc/routers/grocery'
import { notificationsRouter } from '@/trpc/routers/notifications'
import { pantryRouter } from '@/trpc/routers/pantry'
import { choresRouter } from '@/trpc/routers/chores'
import { approvalsRouter } from '@/trpc/routers/approvals'
import { calendarRouter } from '@/trpc/routers/calendar'
import { analyticsRouter } from '@/trpc/routers/analytics'
import { inferRouterOutputs } from '@trpc/server'
import { createTRPCRouter } from '../init'

export const appRouter = createTRPCRouter({
  groups: groupsRouter,
  categories: categoriesRouter,
  grocery: groceryRouter,
  notifications: notificationsRouter,
  analytics: analyticsRouter,
  pantry: pantryRouter,
  chores: choresRouter,
  approvals: approvalsRouter,
  calendar: calendarRouter,
})

export type AppRouter = typeof appRouter
export type AppRouterOutput = inferRouterOutputs<AppRouter>
