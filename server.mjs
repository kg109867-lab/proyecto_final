import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApiHandler } from './server/api.mjs'

const rootDirectory = fileURLToPath(new URL('.', import.meta.url))
const distributionDirectory = resolve(rootDirectory, 'dist')
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const apiHandler = createApiHandler()

async function serveStatic(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end()
    return
  }

  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const filePath = resolve(distributionDirectory, `.${requestedPath}`)
  if (!filePath.startsWith(`${distributionDirectory}${sep}`) && filePath !== distributionDirectory) {
    response.writeHead(403)
    response.end()
    return
  }

  let selectedPath = filePath
  try {
    const fileStat = await stat(selectedPath)
    if (!fileStat.isFile()) throw new Error('Not a file')
  } catch {
    selectedPath = resolve(distributionDirectory, 'index.html')
  }

  try {
    const content = await readFile(selectedPath)
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(selectedPath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
    response.end(request.method === 'HEAD' ? undefined : content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('La aplicación todavía no está compilada. Ejecuta npm run build.')
      return
    }
    throw error
  }
}

const server = createServer((request, response) => {
  apiHandler(request, response, () => {
    serveStatic(request, response).catch((error) => {
      console.error('Error al servir la aplicación.', error)
      if (!response.headersSent) response.writeHead(500)
      response.end('No se pudo cargar la aplicación.')
    })
  })
})
server.on('close', apiHandler.close)

const port = Number(process.env.PORT || 4173)
server.listen(port, '0.0.0.0', () => {
  console.log(`Mundo Fungi está disponible en http://localhost:${port}`)
})
