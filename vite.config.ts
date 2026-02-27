import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // 代理目标：去掉 VITE_BACKEND_URL 末尾的 /api/v1，保留 origin + context path
  const proxyTarget = (env.VITE_BACKEND_URL || '')
    .replace(/\/api\/v1\/?$/, '')
    || 'http://localhost:8102/aftermarket-parts-management-system'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
  }
})
