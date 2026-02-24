import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest'
import request from 'supertest'
import { app } from '../app.ts'
import { execSync } from 'node:child_process'
import { set } from 'zod'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:latest')
  })

  afterEach(async () => {
    execSync('npm run knex migrate:rollback --all')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Nova transação',
        type: 'credit',
        amount: 5000,
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Nova transação',
        type: 'credit',
        amount: 5000,
      })

    const cookies = createResponse.get('Set-Cookie') ?? []

    const listResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'Nova transação',
        type: 'credit',
        amount: 5000,
      }),
    ])
  })
})

it('should be able to get a specific transaction', async () => {
  const createResponse = await request(app.server).post('/transactions').send({
    title: 'Nova transação',
    type: 'credit',
    amount: 5000,
  })

  const cookies = createResponse.get('Set-Cookie') ?? []

  const listResponse = await request(app.server)
    .get('/transactions')
    .set('Cookie', cookies)
    .expect(200)

  const transactionId = listResponse.body.transactions[0].id

  const getResponse = await request(app.server)
    .get(`/transactions/${transactionId}`)
    .set('Cookie', cookies)
    .expect(200)

  expect(getResponse.body.transaction).toEqual(
    expect.objectContaining({
      title: 'Nova transação',
      type: 'credit',
      amount: 5000,
    }),
  )
})

it('should be able to get the summary of transactions', async () => {
  const createResponse = await request(app.server).post('/transactions').send({
    title: 'Nova transação',
    type: 'credit',
    amount: 5000,
  })

  const cookies = createResponse.get('Set-Cookie') ?? []

  await request(app.server).post('/transactions').set('Cookie', cookies).send({
    title: 'Nova transação',
    type: 'debit',
    amount: 2000,
  })

  const summaryResponse = await request(app.server)
    .get('/transactions/summary')
    .set('Cookie', cookies)
    .expect(200)

  expect(summaryResponse.body.summary).toEqual({
    credit: 5000,
    debit: 2000,
    balance: 3000,
  })
})
