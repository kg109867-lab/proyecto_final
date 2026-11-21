import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { createApiHandler } from './api.mjs'
import { openDatabase } from './database.mjs'

let server
let dataDirectory
let baseUrl
let closeDatabase
let sentContactEmails

before(async () => {
  dataDirectory = await mkdtemp(join(tmpdir(), 'mundo-fungi-test-'))
  sentContactEmails = []
  const apiHandler = createApiHandler({
    dataDirectory,
    allowDemoCredentials: true,
    sendContactEmail: async (message) => { sentContactEmails.push(message) },
  })
  closeDatabase = apiHandler.close
  server = createServer((request, response) => apiHandler(request, response, () => {
    response.writeHead(404)
    response.end()
  }))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server.close()
  await once(server, 'close')
  closeDatabase()
  await rm(dataDirectory, { recursive: true, force: true })
})

test('catalog migration replaces legacy demo prices and preserves custom products', async () => {
  const legacyDirectory = await mkdtemp(join(tmpdir(), 'mundo-fungi-legacy-'))
  const legacyDatabase = new DatabaseSync(join(legacyDirectory, 'mundo-fungi.sqlite'))
  legacyDatabase.exec(`
    CREATE TABLE app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    INSERT INTO app_meta (key, value) VALUES ('products_seeded', 'true'), ('catalog_version', '2');
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Cultivo', 'Talleres')),
      description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price > 0),
      icon TEXT NOT NULL,
      tone TEXT NOT NULL,
      label TEXT NOT NULL
    );
    INSERT INTO products VALUES
      ('oyster-kit', 'Legacy oyster kit', 'Cultivo', 'Legacy item', 28000, '🍄', 'sage', 'Old'),
      ('custom-item', 'Custom product', 'Cultivo', 'Keep this item', 5, '🍄', 'sage', 'Custom');
  `)
  legacyDatabase.close()

  const migratedDatabase = openDatabase(legacyDirectory)
  try {
    const products = migratedDatabase.prepare('SELECT id, price FROM products ORDER BY id').all()
    assert.equal(products.length, 11)
    assert.equal(products.find((product) => product.id === 'champignon').price, 6.5)
    assert.equal(products.find((product) => product.id === 'custom-item').price, 5)
    assert.equal(products.some((product) => product.id === 'oyster-kit'), false)
  } finally {
    migratedDatabase.close()
    await rm(legacyDirectory, { recursive: true, force: true })
  }
})

test('public catalog returns ten edible USD products with photo attributions', async () => {
  const response = await fetch(`${baseUrl}/api/products`)
  const products = await response.json()

  assert.equal(response.status, 200)
  assert.ok(products.length >= 10)
  assert.ok(products.some((product) => product.id === 'oyster'))
  assert.ok(products.every((product) => product.category !== 'Psilocibina'))
  assert.ok(products.every((product) => product.price > 0 && product.photoSource && product.photoLicenseUrl))
  assert.equal(products.find((product) => product.id === 'shiitake').scientificName, 'Lentinula edodes')
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
  assert.equal(loginResponse.status, 200)
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]

  const messagesResponse = await fetch(`${baseUrl}/api/admin/messages`, {
    headers: { Cookie: cookie },
  })
  const messages = await messagesResponse.json()
  assert.equal(messagesResponse.status, 200)
  assert.equal(messages[0].email, 'ana@example.com')
  assert.equal(messages[0].message, 'Quiero información sobre el taller.')
})

test('admin product mutations require a session and persist after login', async () => {
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
  const cookie = loginResponse.headers.get('set-cookie').split(';')[0]
  const productResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
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

test('contact form reports an email configuration error while keeping the message', async () => {
  const emailDirectory = await mkdtemp(join(tmpdir(), 'mundo-fungi-no-smtp-'))
  const apiHandler = createApiHandler({ dataDirectory: emailDirectory, sendContactEmail: null })
  const emailServer = createServer((request, response) => apiHandler(request, response, () => {
    response.writeHead(404)
    response.end()
  }))
  emailServer.listen(0, '127.0.0.1')
  await once(emailServer, 'listening')

  try {
    const response = await fetch(`http://127.0.0.1:${emailServer.address().port}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ana', email: 'ana@example.com', message: 'Consulta de prueba.' }),
    })
    const result = await response.json()
    assert.equal(response.status, 503)
    assert.match(result.error, /quedó guardado/)
    const savedDatabase = new DatabaseSync(join(emailDirectory, 'mundo-fungi.sqlite'), { readOnly: true })
    assert.equal(savedDatabase.prepare('SELECT message FROM contact_messages').get().message, 'Consulta de prueba.')
    savedDatabase.close()
  } finally {
    emailServer.close()
    await once(emailServer, 'close')
    apiHandler.close()
    await rm(emailDirectory, { recursive: true, force: true })
  }
})
