import assert from 'node:assert/strict'
import { test } from 'node:test'
import INITIAL_PRODUCTS from '../src/data/products.js'
import { openDatabase } from './database.mjs'

function createMongoStub() {
  const collections = new Map()
  const indexes = []
  const options = []
  const clientStats = { connects: 0, closes: 0, databaseName: '' }

  class MongoClientStub {
    constructor(uri, clientOptions) {
      options.push({ uri, clientOptions })
    }

    async connect() {
      clientStats.connects += 1
    }

    db(name) {
      clientStats.databaseName = name
      return {
        async command() {},
        collection(collectionName) {
          if (!collections.has(collectionName)) collections.set(collectionName, [])
          const documents = collections.get(collectionName)
          return {
            async createIndex(index) {
              indexes.push({ collectionName, index })
            },
            async updateOne(filter, update) {
              if (!documents.some((document) => document.id === filter.id)) {
                documents.push({ ...update.$setOnInsert })
              }
            },
            find(query, { projection }) {
              let sort
              return {
                sort(sortSpec) {
                  sort = sortSpec
                  return this
                },
                async toArray() {
                  return documents
                    .slice()
                    .sort((left, right) => Object.entries(sort || {}).reduce(
                      (result, [key, direction]) => result || ((left[key] ?? '') < (right[key] ?? '') ? -direction : (left[key] ?? '') > (right[key] ?? '') ? direction : 0),
                      0,
                    ))
                    .map((document) => Object.fromEntries(
                      Object.entries(document).filter(([key]) => projection[key] !== 0),
                    ))
                },
              }
            },
            async insertOne(document) {
              documents.push({ ...document })
            },
            async deleteOne(filter) {
              const index = documents.findIndex((document) => document.id === filter.id)
              if (index < 0) return { deletedCount: 0 }
              documents.splice(index, 1)
              return { deletedCount: 1 }
            },
          }
        },
      }
    }

    async close() {
      clientStats.closes += 1
    }
  }

  return { MongoClientStub, collections, indexes, options, clientStats }
}

test('Mongo connection requires a URI', () => {
  assert.throws(() => openDatabase({ uri: '' }), /MONGODB_URI/)
})

test('Mongo repository seeds the catalog and supports products and contact messages', async () => {
  const mongo = createMongoStub()
  const database = openDatabase({
    uri: 'mongodb://localhost/test',
    databaseName: 'fungi_test',
    MongoClientClass: mongo.MongoClientStub,
  })

  try {
    await database.ping()
    assert.equal(mongo.clientStats.connects, 1)
    assert.equal(mongo.clientStats.databaseName, 'fungi_test')
    assert.equal(mongo.indexes.length, 2)

    const products = await database.getProducts()
    assert.equal(products.length, INITIAL_PRODUCTS.length)
    assert.equal(products[0].id, INITIAL_PRODUCTS[0].id)
    assert.equal('sortOrder' in products[0], false)

    const message = {
      id: 'message-1',
      name: 'Ana',
      email: 'ana@example.com',
      message: 'Hola fungi.',
      createdAt: new Date().toISOString(),
      read: false,
    }
    await database.insertContactMessage(message)
    assert.deepEqual(await database.getContactMessages(), [message])

    const product = { id: 'new-product', name: 'Nuevo', price: 4 }
    await database.insertProduct(product)
    assert.ok((await database.getProducts()).some((item) => item.id === product.id))
    assert.equal(await database.deleteProduct(product.id), 1)
    assert.equal(await database.deleteProduct(product.id), 0)
  } finally {
    await database.close()
  }

  assert.equal(mongo.clientStats.closes, 1)
  assert.equal(mongo.options[0].clientOptions.serverSelectionTimeoutMS, 10_000)
})
