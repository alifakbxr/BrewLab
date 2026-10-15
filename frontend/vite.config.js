import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const envFrontend = loadEnv(mode, process.cwd(), '')
  const envRoot = loadEnv(mode, process.cwd() + '/..', '')

  const backendPort = envFrontend.PORT || envRoot.PORT || '8000'
  const backendTarget = envFrontend.BACKEND_URL || envRoot.BACKEND_URL || `http://localhost:${backendPort}`

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        }
      }
    }
  }
})
