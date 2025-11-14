import { Request, Response, NextFunction } from 'express'

/**
 * 通用请求验证中间件
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 简单的字段验证
      if (schema.body && schema.body.properties) {
        const requiredFields = schema.body.required || []
        const missingFields = requiredFields.filter((field: string) => !(field in req.body))
        
        if (missingFields.length > 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '缺少必需字段',
              missingFields
            }
          })
          return
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * 图像数据验证
 */
export const validateImageData = (req: Request, res: Response, next: NextFunction): void => {
  const { image } = req.body

  if (!image) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_IMAGE',
        message: '图像数据不能为空'
      }
    })
    return
  }

  // 检查是否为base64格式
  if (!image.startsWith('data:image/')) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IMAGE_FORMAT',
        message: '图像格式不正确，必须为base64编码的图像数据'
      }
    })
    return
  }

  // 检查图像大小 (最大10MB)
  const base64Data = image.split(',')[1]
  const imageSizeInBytes = (base64Data.length * 3) / 4
  const maxSizeInBytes = 10 * 1024 * 1024 // 10MB

  if (imageSizeInBytes > maxSizeInBytes) {
    res.status(413).json({
      success: false,
      error: {
        code: 'IMAGE_TOO_LARGE',
        message: '图像文件过大，最大支持10MB'
      }
    })
    return
  }

  next()
}

/**
 * 游戏状态验证
 */
export const validateGameState = (req: Request, res: Response, next: NextFunction): void => {
  const { gameState } = req.body

  if (!gameState) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_GAME_STATE',
        message: '游戏状态不能为空'
      }
    })
    return
  }

  // 验证必需的游戏状态字段
  const requiredFields = ['currentPlayer', 'round', 'score']
  const missingFields = requiredFields.filter(field => !(field in gameState))

  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_GAME_STATE',
        message: '游戏状态字段不完整',
        missingFields
      }
    })
    return
  }

  next()
}

/**
 * 反馈数据验证
 */
export const validateFeedback = (req: Request, res: Response, next: NextFunction): void => {
  const { guess, isCorrect, actualAnswer, feedback } = req.body

  if (typeof isCorrect !== 'boolean') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'isCorrect字段必须为布尔值'
      }
    })
    return
  }

  if (typeof guess !== 'string' || guess.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'guess字段必须为非空字符串'
      }
    })
    return
  }

  if (!isCorrect && typeof actualAnswer !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '当AI猜测错误时，actualAnswer字段不能为空'
      }
    })
    return
  }

  next()
}