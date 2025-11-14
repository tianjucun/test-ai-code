import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'

// 加载环境变量 - 明确指定 backend 目录下的 .env 文件
dotenv.config({ path: require('path').join(__dirname, '../.env') })

import { createServer } from 'http'
import aiRoutes from './routes/ai.routes'
import healthRoutes from './routes/health.routes'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { cache, healthCache, modelCache } from './middleware/cache'


const app = express()
const PORT = process.env.PORT || 3002

// 中间件
app.use(helmet()) // 安全头
app.use(compression()) // 压缩
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' })) // JSON解析，支持大图片
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 添加缓存控制头
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('X-XSS-Protection', '1; mode=block')
  next()
})

// 速率限制
app.use('/api/', rateLimiter)

// 路由 - 使用缓存中间件
app.use('/api/health', healthCache, healthRoutes)
app.use('/api/ai-supported-models', modelCache, aiRoutes)
app.use('/api', aiRoutes)

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'AI你画我猜游戏服务器正在运行',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '请求的资源不存在',
    path: req.originalUrl
  })
})

// 错误处理
app.use(errorHandler)

// 启动服务器
const server = createServer(app)

server.listen(PORT, () => {
  console.log(`🚀 服务器已启动，端口: ${PORT}`)
  console.log(`📡 环境: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 API地址: http://localhost:${PORT}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在优雅关闭服务器...')
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在优雅关闭服务器...')
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})

export default app