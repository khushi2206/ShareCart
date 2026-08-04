import 'server-only'

import { createTRPCContext, createCallerFactory } from './init'
import { appRouter } from './routers/_app'
import { cache } from 'react'

const createCaller = createCallerFactory(appRouter)

export const api = cache(async () => {
  const ctx = await createTRPCContext()
  return createCaller(ctx)
})
