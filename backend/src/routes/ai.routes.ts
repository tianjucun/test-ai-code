import { Router } from 'express'
import { AIService } from '../services/ai.service'
import { validateRequest } from '../middleware/validation'

const router = Router()
const aiService = new AIService()

/**
 * POST /api/ai-guess
 * AI图像识别接口
 */
router.post('/ai-guess', 
  validateRequest({
    body: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          description: 'Base64编码的图像数据'
        }
      },
      required: ['image']
    }
  }),
  async (req, res): Promise<void> => {
    try {
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

      const result = await aiService.guessImage(image)
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('AI识别错误:', error)
      
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'AI服务暂时不可用，请稍后重试'
        }
      })
    }
  }
)

/**
 * GET /api/ai-supported-models
 * 获取支持的AI模型列表
 */
router.get('/ai-supported-models', (req, res) => {
  res.json({
    success: true,
    data: {
      models: [
        {
          id: 'gpt-4-vision-preview',
          name: 'GPT-4 Vision',
          description: 'OpenAI最新的视觉识别模型',
          capabilities: ['图像识别', '物体检测', '场景理解']
        },
        {
          id: 'gpt-4-vision-latest',
          name: 'GPT-4 Vision Latest',
          description: '最新的GPT-4 Vision版本',
          capabilities: ['高级视觉理解', '精确识别', '详细描述']
        }
      ]
    }
  })
})

/**
 * POST /api/ai-feedback
 * 提交AI识别反馈
 */
router.post('/ai-feedback', 
  validateRequest({
    body: {
      type: 'object',
      properties: {
        guessId: { type: 'string', description: 'AI猜测的唯一标识符' },
        isCorrect: { type: 'boolean', description: '猜测是否正确' },
        feedback: { type: 'string', description: '用户反馈信息' },
        timestamp: { type: 'number', description: '反馈时间戳' }
      },
      required: ['guessId', 'isCorrect', 'timestamp']
    }
  }),
  async (req, res) => {
    try {
      const feedback = req.body
      
      // 这里可以存储反馈数据用于改进AI模型
      console.log('收到AI反馈:', {
        guessId: feedback.guessId,
        isCorrect: feedback.isCorrect,
        feedback: feedback.feedback,
        timestamp: feedback.timestamp,
        submitTime: new Date().toISOString()
      })
      
      res.json({
        success: true,
        message: '反馈已提交，感谢您的参与！',
        data: {
          processedAt: new Date().toISOString(),
          feedbackId: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      })
    } catch (error) {
      console.error('反馈处理错误:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'FEEDBACK_ERROR',
          message: '反馈提交失败，请稍后重试'
        }
      })
    }
  }
)

export default router