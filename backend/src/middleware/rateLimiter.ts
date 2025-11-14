import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

/**
 * 通用API速率限制
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后重试',
      retryAfter: '15分钟'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn('⚠️ 速率限制触发:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后重试',
        retryAfter: '15分钟'
      }
    })
  }
})

/**
 * AI识别专用速率限制
 * 由于AI调用成本高，需要更严格的限制
 */
export const aiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 20, // 最多20次AI调用
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI调用过于频繁，请稍后重试',
      retryAfter: '5分钟'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // 基于IP和User-Agent生成key，防止滥用
    return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`
  },
  handler: (req: Request, res: Response) => {
    console.warn('🚨 AI速率限制触发:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI调用过于频繁，请稍后重试',
        retryAfter: '5分钟',
        suggestion: '建议等待5分钟后再试，或检查您的使用频率'
      }
    })
  }
})

/**
 * 严格的速率限制（用于敏感操作）
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 最多10次请求
  message: {
    success: false,
    error: {
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      message: '操作过于频繁，请1小时后再试',
      retryAfter: '1小时'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计算在内
  handler: (req: Request, res: Response) => {
    console.warn('🔒 严格速率限制触发:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      timestamp: new Date().toISOString()
    })
    
    res.status(429).json({
      success: false,
      error: {
        code: 'STRICT_RATE_LIMIT_EXCEEDED',
        message: '操作过于频繁，请1小时后再试',
        retryAfter: '1小时'
      }
    })
  }
})

/**
 * 开发环境专用速率限制
 * 开发环境限制更宽松
 */
export const devRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 200, // 更高限制
  message: {
    success: false,
    error: {
      code: 'DEV_RATE_LIMIT_EXCEEDED',
      message: '开发环境请求过于频繁，请稍后重试',
      retryAfter: '1分钟'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 根据环境选择合适的速率限制器
const isDevelopment = process.env.NODE_ENV === 'development'

export const selectedRateLimiter = isDevelopment ? devRateLimiter : rateLimiter

/**
 * 动态速率限制配置
 */
export const createDynamicRateLimiter = (options: {
  windowMs: number
  max: number
  message: string
  skipSuccessfulRequests?: boolean
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
        message: options.message
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false
  })
}