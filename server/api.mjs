import { randomUUID, timingSafeEqual } from 'node:crypto'
import { openDatabase } from './database.mjs'
import { createContactEmailSender } from './email.mjs'

const SESSION_DURATION = 8 * 60 * 60 * 1000
const MAX_BODY_BYTES = 16 * 1024
const sessions = new Map()
const failedLogins = new Map()

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(payload))
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function getAllowedOrigin(request, frontendOrigin) {
  const origin = request.headers.origin
  if (!origin) return ''

  try {
    const expectedHost = request.headers['x-forwarded-host'] || request.headers.host
    const requestOrigin = new URL(`${request.headers['x-forwarded-proto'] || 'http'}://${expectedHost}`).origin
    const normalizedOrigin = new URL(origin).origin
    if (normalizedOrigin === requestOrigin || normalizedOrigin === frontendOrigin) return normalizedOrigin
  } catch {
    return null
  }
  return null
}

function setCorsHeaders(response, origin) {
  if (!origin) return
  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.setHeader('Vary', 'Origin')
}

async function readBody(request) {
  let size = 0
  const chunks = []

  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      const error = new Error('El cuerpo de la solicitud supera el tamaño permitido.')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }

  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new TypeError('Se esperaba un objeto JSON.')
    }
    return body
  } catch {
    const error = new Error('El contenido de la solicitud no es JSON válido.')
    error.status = 400
    throw error
  }
}

function getAdminCredentials(allowDemoCredentials) {
  const username = process.env.ADMIN_USERNAME || (allowDemoCredentials ? 'admin' : '')
  const password = process.env.ADMIN_PASSWORD || (allowDemoCredentials ? 'mundo2026' : '')
  return { username, password }
}

function requireAdmin(request, response) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1]
  const expiresAt = sessions.get(token)
  if (!token || !expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token)
    sendJson(response, 401, { error: 'Inicia sesión para continuar.' })
    return false
  }
  sessions.set(token, Date.now() + SESSION_DURATION)
  return true
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 160
}

function isLoginRateLimited(request) {
  const address = request.headers['x-forwarded-for']?.split(',')[0].trim() || request.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const attempts = failedLogins.get(address) ?? []
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < 15 * 60 * 1000)
  failedLogins.set(address, recentAttempts)
  return recentAttempts.length >= 8
}

function recordFailedLogin(request) {
  const address = request.headers['x-forwarded-for']?.split(',')[0].trim() || request.socket.remoteAddress || 'unknown'
  const attempts = failedLogins.get(address) ?? []
  attempts.push(Date.now())
  failedLogins.set(address, attempts)
}

export function createApiHandler({
  database = openDatabase(),
  allowDemoCredentials = false,
  sendContactEmail = createContactEmailSender(),
} = {}) {
  const configuredOrigin = process.env.FRONTEND_ORIGIN?.trim()
  const frontendOrigin = configuredOrigin ? new URL(configuredOrigin).origin : ''

  const apiHandler = async function handleApiRequest(request, response, next) {
    const url = new URL(request.url, 'http://localhost')
    if (!url.pathname.startsWith('/api/')) {
      next()
      return
    }

    const allowedOrigin = getAllowedOrigin(request, frontendOrigin)
    if (allowedOrigin === null) {
      sendJson(response, 403, { error: 'Origen de solicitud no permitido.' })
      return
    }
    setCorsHeaders(response, allowedOrigin)

    if (request.method === 'OPTIONS') {
      response.writeHead(204)
      response.end()
      return
    }

    try {
      if (request.method === 'GET' && url.pathname === '/api/health') {
        await database.ping()
        sendJson(response, 200, { status: 'ok' })
        return
      }

      if (request.method === 'GET' && url.pathname === '/api/products') {
        const products = await database.getProducts()
        sendJson(response, 200, products)
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/contact') {
        const body = await readBody(request)
        const name = cleanText(body.name, 100)
        const email = cleanText(body.email, 160)
        const message = cleanText(body.message, 1000)
        if (!name || !validEmail(email) || !message) {
          sendJson(response, 400, { error: 'Completa tu nombre, un correo válido y un mensaje.' })
          return
        }

        const contactMessage = {
          id: randomUUID(),
          name,
          email,
          message,
          createdAt: new Date().toISOString(),
          read: false,
        }
        await database.insertContactMessage(contactMessage)
        if (!sendContactEmail) {
          sendJson(response, 503, {
            error: 'El mensaje quedó guardado, pero falta configurar el envío de correo en el servidor.',
          })
          return
        }

        try {
          await sendContactEmail(contactMessage)
        } catch (error) {
          console.error('No se pudo enviar el mensaje de contacto por correo.', error)
          sendJson(response, 502, {
            error: 'El mensaje quedó guardado, pero no se pudo enviar el correo. Intenta de nuevo más tarde.',
          })
          return
        }

        sendJson(response, 201, { message: 'Tu mensaje se guardó y se envió al equipo.' })
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/auth/login') {
        if (isLoginRateLimited(request)) {
          sendJson(response, 429, { error: 'Demasiados intentos. Espera unos minutos antes de volver a probar.' })
          return
        }

        const { username: expectedUsername, password: expectedPassword } = getAdminCredentials(allowDemoCredentials)
        if (!expectedUsername || !expectedPassword) {
          sendJson(response, 503, { error: 'Configura ADMIN_USERNAME y ADMIN_PASSWORD en el servidor.' })
          return
        }

        const body = await readBody(request)
        const username = cleanText(body.username, 100)
        const password = typeof body.password === 'string' ? body.password : ''
        if (
          !timingSafeStringEqual(username, expectedUsername) ||
          !timingSafeStringEqual(password, expectedPassword)
        ) {
          recordFailedLogin(request)
          sendJson(response, 401, { error: 'Usuario o contraseña incorrectos.' })
          return
        }

        const token = randomUUID()
        sessions.set(token, Date.now() + SESSION_DURATION)
        sendJson(response, 200, { authenticated: true, token })
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
        const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1]
        if (token) sessions.delete(token)
        sendJson(response, 200, { authenticated: false })
        return
      }

      if (url.pathname.startsWith('/api/admin/')) {
        if (!requireAdmin(request, response)) return

        if (request.method === 'GET' && url.pathname === '/api/admin/messages') {
          const messages = await database.getContactMessages()
          sendJson(response, 200, messages)
          return
        }

        if (request.method === 'POST' && url.pathname === '/api/admin/products') {
          const body = await readBody(request)
          const name = cleanText(body.name, 80)
          const category = cleanText(body.category, 30)
          const description = cleanText(body.description, 180)
          const price = Number(body.price)

          if (!name || !['Cultivo', 'Talleres'].includes(category) || !description || !Number.isFinite(price) || price <= 0 || price > 100000) {
            sendJson(response, 400, { error: 'Revisa el nombre, la categoría, la descripción y el precio.' })
            return
          }

          const product = {
            id: randomUUID(),
            name,
            category,
            description,
            price,
            icon: category === 'Talleres' ? '✳' : '🍄',
            tone: category === 'Talleres' ? 'lavender' : 'sage',
            label: 'Nuevo',
            scientificName: '',
            details: '',
            flavor: '',
            uses: '',
            packSize: '',
            collection: 'Especiales',
            image: '',
            imageAlt: '',
            photoCredit: '',
            photoSource: '',
            photoLicense: '',
            photoLicenseUrl: '',
          }
          await database.insertProduct(product)
          sendJson(response, 201, product)
          return
        }

        const deleteMatch = url.pathname.match(/^\/api\/admin\/products\/([^/]+)$/)
        if (request.method === 'DELETE' && deleteMatch) {
          const id = decodeURIComponent(deleteMatch[1])
          const deletedCount = await database.deleteProduct(id)
          if (!deletedCount) {
            sendJson(response, 404, { error: 'No se encontró ese producto.' })
            return
          }
          sendJson(response, 200, { deleted: id })
          return
        }

      }

      sendJson(response, 404, { error: 'Ruta de API no encontrada.' })
    } catch (error) {
      if (error.status) {
        sendJson(response, error.status, { error: error.message })
        return
      }
      console.error('Error al procesar una solicitud de la API.', error)
      sendJson(response, 500, { error: 'No se pudo completar la solicitud. Intenta de nuevo más tarde.' })
    }
  }

  apiHandler.close = () => database.close()
  return apiHandler
}
