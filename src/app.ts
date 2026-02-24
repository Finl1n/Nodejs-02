import fastify from 'fastify'
import knex, { Knex } from 'knex'
import { env } from './env/index.ts'
import { transactionsRoutes } from './routes/transactions.ts'
import cookie from '@fastify/cookie'

export const app = fastify()

app.register(cookie)

app.register(transactionsRoutes, {
  prefix: '/transactions',
})
