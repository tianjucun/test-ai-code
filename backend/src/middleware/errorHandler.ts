import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export const errorHandler = (
  error: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 记录错误日志
  console.error('🚨 服务器错误:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  // 处理自定义API错误
  if ((error as ApiError).statusCode !== undefined) {
    const apiError = error as ApiError
    const statusCode = apiError.statusCode || 500
    res.status(statusCode).json({
      success: false,
      error: {
        code: apiError.code || 'API_ERROR',
        message: apiError.message,
        details: apiError.details
      }
    })
    return
  }

  // 处理OpenAI相关错误
  if (error.message.includes('OpenAI')) {
    res.status(503).json({
      success: false,
      error: {
        code: 'AI_SERVICE_ERROR',
        message: 'AI服务暂时不可用',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    })
    return
  }

  // 处理TypeScript错误
  if (error.name === 'TypeError') {
    res.status(500).json({
      success: false,
      error: {
        code: 'TYPE_ERROR',
        message: '数据类型错误',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    })
    return
  }

  // 默认服务器内部错误
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' 
        ? error.message 
        : '请稍后重试或联系管理员'
    }
  })
}

/**
 * 创建自定义错误
 */
export const createError = (
  message: string, 
  statusCode: number = 500, 
  code?: string,
  details?: any
): ApiError => {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.code = code
  error.details = details
  return error
}

/**
 * 异步错误处理包装器
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 404错误处理
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(
    `路由 ${req.originalUrl} 未找到`,
    404,
    'NOT_FOUND'
  )
  next(error)
}