import { Router } from 'express'

const router = Router()

/**
 * GET /api/health
 * 健康检查接口
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    services: {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    }
  })
})

/**
 * GET /api/health/detailed
 * 详细健康检查
 */
router.get('/detailed', (req, res) => {
  const healthStatus: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? (process as any).loadavg() : 'Not available on Windows'
    },
    services: {
      openai: {
        status: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
        model: process.env.OPENAI_MODEL || 'gpt-4-vision-preview'
      }
    },
    config: {
      port: process.env.PORT || 3001,
      cors: {
        enabled: true,
        origins: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000', 'http://localhost:5173']
      }
    }
  }

  // 检查是否有问题
  const issues = []
  
  if (!process.env.OPENAI_API_KEY) {
    issues.push('OpenAI API密钥未配置')
  }
  
  if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // 500MB
    issues.push('内存使用量过高')
  }

  if (issues.length > 0) {
    healthStatus.status = 'degraded'
    healthStatus.issues = issues
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503
  
  res.status(statusCode).json(healthStatus)
})

export default router