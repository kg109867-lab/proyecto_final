import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from 'node:process'
import { createApiHandler } from './server/api.mjs'

const rootDirectory = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'mundo-fungi-api',
      configureServer(server) {
        const apiHandler = createApiHandler({
          dataDirectory: resolve(env.DATA_DIRECTORY || resolve(rootDirectory, 'data')),
          allowDemoCredentials: true,
        })
        server.middlewares.use(apiHandler)
        server.httpServer?.once('close', apiHandler.close)
      },
    },
  ],
})
