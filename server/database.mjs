import { MongoClient } from 'mongodb'
import INITIAL_PRODUCTS from '../src/data/products.js'

export function openDatabase({
  uri = process.env.MONGODB_URI,
  databaseName = process.env.MONGODB_DB || 'mundo_fungi',
  MongoClientClass = MongoClient,
} = {}) {
  if (!uri) throw new Error('Configura MONGODB_URI para conectar con MongoDB.')

  const client = new MongoClientClass(uri, { serverSelectionTimeoutMS: 10_000 })
  let databasePromise

  async function getDatabase() {
    if (!databasePromise) {
      databasePromise = (async () => {
        await client.connect()
        const database = client.db(databaseName)
        const products = database.collection('products')
        await products.createIndex({ id: 1 }, { unique: true })
        await database.collection('contact_messages').createIndex({ id: 1 }, { unique: true })
        await Promise.all(INITIAL_PRODUCTS.map((product, sortOrder) => products.updateOne(
          { id: product.id },
          { $setOnInsert: { ...product, sortOrder } },
          { upsert: true },
        )))
        return database
      })()
    }

    try {
      return await databasePromise
    } catch (error) {
      databasePromise = undefined
      throw error
    }
  }

  return {
    async ping() {
      await (await getDatabase()).command({ ping: 1 })
    },
    async getProducts() {
      const products = await (await getDatabase())
        .collection('products')
        .find({}, { projection: { _id: 0, sortOrder: 0 } })
        .sort({ sortOrder: 1 })
        .toArray()
      return products
    },
    async insertContactMessage(message) {
      await (await getDatabase()).collection('contact_messages').insertOne(message)
    },
    async getContactMessages() {
      return (await getDatabase())
        .collection('contact_messages')
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .toArray()
    },
    async insertProduct(product) {
      await (await getDatabase()).collection('products').insertOne({
        ...product,
        sortOrder: Date.now(),
      })
    },
    async deleteProduct(id) {
      const result = await (await getDatabase()).collection('products').deleteOne({ id })
      return result.deletedCount
    },
    close() {
      return client.close()
    },
  }
}
