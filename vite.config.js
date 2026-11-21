import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from 'node:process'
import { createApiHandler } from './server/api.mjs'

const rootDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryName = env.GITHUB_REPOSITORY?.split('/')[1]
const pagesBase = env.GITHUB_ACTIONS === 'true'
  && repositoryName
  && !repositoryName.endsWith('.github.io')
  ? `/${repositoryName}/`
  : '/'

export default defineConfig({
  base: env.VITE_BASE_PATH || pagesBase,
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
