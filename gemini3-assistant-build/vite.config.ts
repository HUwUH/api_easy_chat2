import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      // 🟢 新增：开发模式配置
      devOptions: {
        enabled: true,  // 强制在 npm run dev 下开启 PWA
        type: 'module', // 必须加这个
      },
      manifest: {
        name: 'AI Workbench',
        short_name: 'Workbench',
        description: 'My Local AI Chat App',
        theme_color: '#ffffff',
        start_url: '/', // 确保启动地址正确
        display: 'standalone', // 确保是全屏 App 模式
        background_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})