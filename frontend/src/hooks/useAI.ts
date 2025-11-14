import { useState, useCallback, useEffect } from 'react';
import { AIGuessResponse } from '../types/game';
import { aiService } from '../services/aiService';

export interface AIState {
  isAnalyzing: boolean;
  lastGuess: AIGuessResponse | null;
  error: string | null;
  isOnline: boolean;
  processingTime: number;
}

export interface AIHookReturn extends AIState {
  analyzeImage: (imageData: string, mimeType: string) => Promise<AIGuessResponse | null>;
  resetAI: () => void;
  submitFeedback: (isCorrect: boolean, feedback?: string) => Promise<void>;
  setOfflineMode: (offline: boolean) => void;
  checkHealth: () => Promise<boolean>;
}

export const useAI = (): AIHookReturn => {
  const [state, setState] = useState<AIState>({
    isAnalyzing: false,
    lastGuess: null,
    error: null,
    isOnline: true,
    processingTime: 0
  });

  // 检查AI服务健康状态
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const isHealthy = await aiService.checkHealth();
      setState(prev => ({ ...prev, isOnline: isHealthy }));
      return isHealthy;
    } catch (error) {
      console.error('AI服务健康检查失败:', error);
      setState(prev => ({ ...prev, isOnline: false }));
      return false;
    }
  }, []);

  // 分析图像
  const analyzeImage = useCallback(async (
    imageData: string, 
    mimeType: string
  ): Promise<AIGuessResponse | null> => {
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      error: null 
    }));

    try {
      const startTime = Date.now();
      
      // 压缩图像以减少传输大小
      const compressedImage = await (aiService.constructor as any).compressImageData(imageData);
      
      const result = await aiService.guessImage(compressedImage, mimeType);
      
      const endTime = Date.now();
      
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false,
        lastGuess: result,
        processingTime: endTime - startTime,
        error: result.success ? null : (result as any).error || 'AI识别失败'
      }));

      return result;
    } catch (error) {
      console.error('AI分析错误:', error);
      const errorMessage = error instanceof Error ? error.message : 'AI识别失败';
      
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false,
        error: errorMessage
      }));

      return null;
    }
  }, []);

  // 重置AI状态
  const resetAI = useCallback(() => {
    setState({
      isAnalyzing: false,
      lastGuess: null,
      error: null,
      isOnline: state.isOnline,
      processingTime: 0
    });
  }, [state.isOnline]);

  // 提交反馈
  const submitFeedback = useCallback(async (isCorrect: boolean, feedback?: string): Promise<void> => {
    if (!state.lastGuess?.success) {
      return;
    }

    try {
      const guessId = `guess_${Date.now()}`;
      await aiService.submitFeedback(guessId, isCorrect, feedback);
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  }, [state.lastGuess]);

  // 设置离线模式
  const setOfflineMode = useCallback((offline: boolean) => {
    aiService.setOnlineMode(!offline);
    setState(prev => ({ ...prev, isOnline: !offline }));
  }, []);

  // 定期检查AI服务状态
  useEffect(() => {
    checkHealth();
    
    const interval = setInterval(checkHealth, 60000); // 每分钟检查一次
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    ...state,
    analyzeImage,
    resetAI,
    submitFeedback,
    setOfflineMode,
    checkHealth
  };
};

export default useAI;