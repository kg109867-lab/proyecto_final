import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { env } from 'node:process'
import { createApiHandler } from './server/api.mjs'

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
        const apiHandler = createApiHandler({ allowDemoCredentials: true })
        server.middlewares.use(apiHandler)
        server.httpServer?.once('close', apiHandler.close)
      },
    },
  ],
})
