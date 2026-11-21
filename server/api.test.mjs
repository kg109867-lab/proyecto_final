import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { after, before, test } from 'node:test'
import INITIAL_PRODUCTS from '../src/data/products.js'
import { createApiHandler } from './api.mjs'

function createMemoryDatabase() {
  const products = INITIAL_PRODUCTS.map((product) => ({ ...product }))
  const messages = []
  return {
    async ping() {},
    async getProducts() {
      return products.map((product) => ({ ...product }))
    },
    async insertContactMessage(message) {
      messages.push(message)
    },
    async getContactMessages() {
      return [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async insertProduct(product) {
      products.push({ ...product })
    },
    async deleteProduct(id) {
      const index = products.findIndex((product) => product.id === id)
      if (index < 0) return 0
      products.splice(index, 1)
      return 1
    },
    async close() {},
  }
}

async function startTestServer(options = {}) {
  const apiHandler = createApiHandler({
    database: createMemoryDatabase(),
    sendContactEmail: async (message) => { options.sentContactEmails?.push(message) },
    ...options,
  })
  const server = createServer((request, response) => apiHandler(request, response, () => {
    response.writeHead(404)
    response.end()
  }))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  return {
    apiHandler,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() {
      server.close()
      await once(server, 'close')
      await apiHandler.close()
    },
  }
}

let server
let baseUrl
let sentContactEmails
let previousFrontendOrigin

before(async () => {
  previousFrontendOrigin = process.env.FRONTEND_ORIGIN
  process.env.FRONTEND_ORIGIN = 'https://mundo-fungi.github.io'
  sentContactEmails = []
  server = await startTestServer({ allowDemoCredentials: true, sentContactEmails })
  baseUrl = server.baseUrl
})

after(async () => {
  await server.close()
  if (previousFrontendOrigin === undefined) delete process.env.FRONTEND_ORIGIN
  else process.env.FRONTEND_ORIGIN = previousFrontendOrigin
})

test('health check and public catalog use the configured database', async () => {
  const healthResponse = await fetch(`${baseUrl}/api/health`)
  assert.equal(healthResponse.status, 200)

  const response = await fetch(`${baseUrl}/api/products`)
  const products = await response.json()

  assert.equal(response.status, 200)
  assert.ok(products.length >= 10)
  assert.ok(products.some((product) => product.id === 'oyster'))
  assert.ok(products.every((product) => product.category !== 'Psilocibina'))
  assert.ok(products.every((product) => product.price > 0 && product.photoSource && product.photoLicenseUrl))
  assert.equal(products.find((product) => product.id === 'shiitake').scientificName, 'Lentinula edodes')
})

test('CORS preflight accepts only the configured Pages origin', async () => {
  const response = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://mundo-fungi.github.io',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  })
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://mundo-fungi.github.io')
  assert.match(response.headers.get('access-control-allow-headers'), /Authorization/)

  const deniedResponse = await fetch(`${baseUrl}/api/products`, {
    headers: { Origin: 'https://evil.example' },
  })
  assert.equal(deniedResponse.status, 403)
})

test('contact submissions are stored and visible to an authenticated admin', async () => {
  const contactResponse = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Quiero información sobre el taller.',
    }),
  })
  assert.equal(contactResponse.status, 201)
  assert.equal(sentContactEmails.length, 1)
  assert.equal(sentContactEmails[0].email, 'ana@example.com')
  assert.equal(sentContactEmails[0].message, 'Quiero información sobre el taller.')

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'mundo2026' }),
  })
  const { token } = await loginResponse.json()
  assert.equal(loginResponse.status, 200)
  assert.ok(token)

  const messagesResponse = await fetch(`${baseUrl}/api/admin/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const messages = await messagesResponse.json()
  assert.equal(messagesResponse.status, 200)
  assert.equal(messages[0].email, 'ana@example.com')
  assert.equal(messages[0].message, 'Quiero información sobre el taller.')
})

test('admin product mutations require and accept a bearer token', async () => {
  const deniedResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Taller', category: 'Talleres', price: 25000, description: 'Un taller.' }),
  })
  assert.equal(deniedResponse.status, 401)

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'mundo2026' }),
  })
  const { token } = await loginResponse.json()
  const productResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Taller de micología',
      category: 'Talleres',
      price: 25.5,
      description: 'Una experiencia para aprender.',
    }),
  })
  const product = await productResponse.json()
  assert.equal(productResponse.status, 201)
  assert.equal(product.price, 25.5)

  const catalogResponse = await fetch(`${baseUrl}/api/products`)
  const catalog = await catalogResponse.json()
  assert.equal(catalog.find((item) => item.id === product.id).price, 25.5)
})

test('contact form rejects invalid email addresses', async () => {
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ana', email: 'no-es-correo', message: 'Hola.' }),
  })

  assert.equal(response.status, 400)
})

test('contact errors report when email is not configured while retaining the message', async () => {
  const database = createMemoryDatabase()
  const testServer = await startTestServer({ database, sendContactEmail: null })

  try {
    const response = await fetch(`${testServer.baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ana', email: 'ana@example.com', message: 'Consulta de prueba.' }),
    })
    const result = await response.json()
    assert.equal(response.status, 503)
    assert.match(result.error, /quedó guardado/)
    assert.equal((await database.getContactMessages())[0].message, 'Consulta de prueba.')
  } finally {
    await testServer.close()
  }
})
