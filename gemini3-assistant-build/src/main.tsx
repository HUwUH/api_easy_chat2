import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 🟢 1. 引入注册函数
import { registerSW } from 'virtual:pwa-register'

// 🟢 2. 立即注册 Service Worker
// immediate: true 表示一打开网页就尝试缓存，不需要等用户确认
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)