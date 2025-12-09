import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 这里是新增的代理配置
    proxy: {
      '/api': {
        target: 'https://api.deepseek.com', // 目标地址
        changeOrigin: true,                 // 允许跨域
        rewrite: (path) => path.replace(/^\/api/, ''), // 把 /api 去掉
      },
    },
  },
})
