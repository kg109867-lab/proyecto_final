import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import INITIAL_PRODUCTS from '../src/data/products.js'

export function openDatabase(dataDirectory) {
  mkdirSync(dataDirectory, { recursive: true })
  const database = new DatabaseSync(join(dataDirectory, 'mundo-fungi.sqlite'))

  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Cultivo', 'Talleres')),
      description TEXT NOT NULL,
      price REAL NOT NULL CHECK (price > 0),
      icon TEXT NOT NULL,
      tone TEXT NOT NULL,
      label TEXT NOT NULL,
      scientific_name TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '',
      flavor TEXT NOT NULL DEFAULT '',
      uses TEXT NOT NULL DEFAULT '',
      pack_size TEXT NOT NULL DEFAULT '',
      collection TEXT NOT NULL DEFAULT 'Clásicos',
      image TEXT NOT NULL DEFAULT '',
      image_alt TEXT NOT NULL DEFAULT '',
      photo_credit TEXT NOT NULL DEFAULT '',
      photo_source TEXT NOT NULL DEFAULT '',
      photo_license TEXT NOT NULL DEFAULT '',
      photo_license_url TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    );
  `)

  const existingColumns = new Set(
    database.prepare('PRAGMA table_info(products)').all().map((column) => column.name),
  )
  const migrations = [
    ['scientific_name', "TEXT NOT NULL DEFAULT ''"],
    ['details', "TEXT NOT NULL DEFAULT ''"],
    ['flavor', "TEXT NOT NULL DEFAULT ''"],
    ['uses', "TEXT NOT NULL DEFAULT ''"],
    ['pack_size', "TEXT NOT NULL DEFAULT ''"],
    ['collection', "TEXT NOT NULL DEFAULT 'Clásicos'"],
    ['image', "TEXT NOT NULL DEFAULT ''"],
    ['image_alt', "TEXT NOT NULL DEFAULT ''"],
    ['photo_credit', "TEXT NOT NULL DEFAULT ''"],
    ['photo_source', "TEXT NOT NULL DEFAULT ''"],
    ['photo_license', "TEXT NOT NULL DEFAULT ''"],
    ['photo_license_url', "TEXT NOT NULL DEFAULT ''"],
  ]
  for (const [column, definition] of migrations) {
    if (!existingColumns.has(column)) {
      database.exec(`ALTER TABLE products ADD COLUMN ${column} ${definition}`)
    }
  }

  const catalogVersion = database.prepare("SELECT value FROM app_meta WHERE key = 'catalog_version'").get()
  if (Number(catalogVersion?.value ?? 0) < 3) {
    database.exec('BEGIN')
    try {
      database.prepare(`
        DELETE FROM products WHERE id IN ('oyster-kit', 'shiitake-kit', 'fungi-workshop')
      `).run()
      const insertProduct = database.prepare(`
        INSERT INTO products (
          id, name, category, description, price, icon, tone, label,
          scientific_name, details, flavor, uses, pack_size, collection, image,
          image_alt, photo_credit, photo_source, photo_license, photo_license_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          category = excluded.category,
          description = excluded.description,
          price = excluded.price,
          icon = excluded.icon,
          tone = excluded.tone,
          label = excluded.label,
          scientific_name = excluded.scientific_name,
          details = excluded.details,
          flavor = excluded.flavor,
          uses = excluded.uses,
          pack_size = excluded.pack_size,
          collection = excluded.collection,
          image = excluded.image,
          image_alt = excluded.image_alt,
          photo_credit = excluded.photo_credit,
          photo_source = excluded.photo_source,
          photo_license = excluded.photo_license,
          photo_license_url = excluded.photo_license_url
      `)
      for (const product of INITIAL_PRODUCTS) {
        insertProduct.run(
          product.id,
          product.name,
          product.category,
          product.description,
          product.price,
          product.icon,
          product.tone,
          product.label,
          product.scientificName,
          product.details,
          product.flavor,
          product.uses,
          product.packSize,
          product.collection,
          product.image,
          product.imageAlt,
          product.photoCredit,
          product.photoSource,
          product.photoLicense,
          product.photoLicenseUrl,
        )
      }
      database.prepare(`
        INSERT INTO app_meta (key, value) VALUES ('catalog_version', '3')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run()
      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      database.close()
      throw error
    }
  }

  return database
}
