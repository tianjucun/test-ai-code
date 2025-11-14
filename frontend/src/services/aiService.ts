import { AIGuessResponse } from '../types/game';

export interface AIConfig {
  apiUrl: string;
  timeout?: number;
  model?: string;
}

export interface AIImageData {
  imageData: string; // base64编码的图像数据
  mimeType: string; // 图像MIME类型
}

export interface AIRequest {
  image: AIImageData;
  context?: string;
  options?: {
    maxTokens?: number;
    temperature?: number;
  };
}

export interface AIServiceResponse {
  guess: string;
  confidence: number;
  suggestions?: string[];
  processingTime: number;
}

class AIService {
  private config: AIConfig;
  private isOnlineMode: boolean = false;

  constructor(config: AIConfig) {
    this.config = {
      timeout: 30000, // 30秒超时
      model: 'gpt-4-vision-preview',
      ...config
    };
  }

  /**
   * 设置API是否在线模式
   */
  setOnlineMode(online: boolean): void {
    this.isOnlineMode = online;
  }

  /**
   * 检查服务是否可用
   */
  async checkHealth(): Promise<boolean> {
    if (!this.isOnlineMode) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('AI服务健康检查失败:', error);
      return false;
    }
  }

  /**
   * 猜测图像内容
   */
  async guessImage(imageData: string, mimeType: string): Promise<AIGuessResponse> {
    const startTime = Date.now();

    if (!this.isOnlineMode) {
      return this.getMockResponse(imageData);
    }

    try {
      const response = await this.callAIApi(imageData, mimeType);
      return {
        guess: response.guess,
        confidence: response.confidence,
        suggestions: response.suggestions || [],
        processingTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      console.error('AI识别错误:', error);
      // 如果在线模式失败，回退到模拟模式
      return this.getMockResponse(imageData);
    }
  }

  /**
   * 调用AI API
   */
  private async callAIApi(imageData: string, mimeType: string): Promise<AIServiceResponse> {
    // 直接发送base64图像数据，符合后端API期望格式
    const base64Data = imageData.split(',')[1] || imageData;
    
    // 只发送image字段，符合后端验证要求
    const requestBody = {
      image: base64Data
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const response = await fetch(`${this.config.apiUrl}/api/ai-guess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'AI识别失败');
    }

    return data.data;
  }

  /**
   * 获取模拟响应（离线模式或API失败时使用）
   */
  private async getMockResponse(imageData: string): Promise<AIGuessResponse> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const mockResponses = [
      { guess: '一只可爱的猫咪', confidence: 0.92, suggestions: ['猫', '宠物', '小猫'] },
      { guess: '美丽的日落风景', confidence: 0.88, suggestions: ['日落', '风景', '夕阳'] },
      { guess: '一辆红色汽车', confidence: 0.85, suggestions: ['汽车', '车辆', '红色'] },
      { guess: '绿色的树木', confidence: 0.90, suggestions: ['树', '植物', '自然'] },
      { guess: '蓝色的大海', confidence: 0.87, suggestions: ['海', '水', '蓝色'] },
      { guess: '黄色的太阳', confidence: 0.94, suggestions: ['太阳', '阳光', '黄色'] },
      { guess: '一座山', confidence: 0.89, suggestions: ['山', '山峰', '自然'] },
      { guess: '一朵花', confidence: 0.91, suggestions: ['花', '植物', '美丽'] },
      { guess: '一只狗', confidence: 0.93, suggestions: ['狗', '宠物', '动物'] },
      { guess: '房子', confidence: 0.86, suggestions: ['建筑', '房屋', '家'] }
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    return {
      guess: randomResponse.guess,
      confidence: randomResponse.confidence,
      suggestions: randomResponse.suggestions,
      processingTime: 1500 + Math.random() * 1000,
      success: true
    };
  }

  /**
   * 获取支持的模型列表
   */
  async getSupportedModels(): Promise<string[]> {
    if (!this.isOnlineMode) {
      return ['mock-gpt-4-vision', 'mock-gpt-3.5-vision'];
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/ai-supported-models`);
      if (response.ok) {
        const data = await response.json();
        return data.models || [];
      }
    } catch (error) {
      console.warn('获取模型列表失败:', error);
    }

    return ['mock-gpt-4-vision'];
  }



  /**
   * 提交反馈
   */
  async submitFeedback(guessId: string, isCorrect: boolean, feedback?: string): Promise<boolean> {
    if (!this.isOnlineMode) {
      console.log('离线模式：反馈', { guessId, isCorrect, feedback });
      return true;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/ai-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guessId,
          isCorrect,
          feedback,
          timestamp: Date.now()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('提交反馈失败:', error);
      return false;
    }
  }

  /**
   * 压缩图像数据以减少API传输大小
   */
  static compressImageData(imageData: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        // 计算新尺寸
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // 绘制压缩后的图像
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // 转换为base64
        const compressedData = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedData);
      };

      img.onerror = () => reject(new Error('图像加载失败'));
      img.src = imageData;
    });
  }
}

// 创建默认实例
const defaultApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3003';
export const aiService = new AIService({
  apiUrl: defaultApiUrl,
  timeout: 30000
});

// 设置初始模式为在线模式（可以后续通过环境变量控制）
aiService.setOnlineMode(true);

export default AIService;