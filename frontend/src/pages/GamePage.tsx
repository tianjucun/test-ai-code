import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DrawingCanvas, { DrawingCanvasRef } from '../components/DrawingCanvas';
import { useAI } from '../hooks/useAI';
import { AIGuessResponse } from '../types/game';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameScore, setGameScore] = useState(0);

  const {
    isAnalyzing,
    lastGuess,
    error,
    isOnline,
    processingTime,
    analyzeImage,
    resetAI,
    submitFeedback,
    setOfflineMode,
  } = useAI();

  const handleStartGame = () => {
    setGameStarted(true);
    resetAI();
  };

  const handleAIGuess = useCallback(async () => {
    if (!canvasRef.current || isAnalyzing) return;

    try {
      // 获取画布图像数据（不触发下载）
      const imageData = canvasRef.current.exportImage('png', 1.0, false);

      if (!imageData) {
        console.error('无法获取画布图像数据');
        return;
      }

      // 转换为AI服务需要的格式
      const mimeType = 'image/png';

      await analyzeImage(imageData, mimeType);
      setShowFeedback(true);
    } catch (error) {
      console.error('AI猜测失败:', error);
    }
  }, [analyzeImage, isAnalyzing]);

  const handleClearCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      resetAI();
      setShowFeedback(false);
    }
  }, [resetAI]);

  const handleNextRound = useCallback(() => {
    handleClearCanvas();
    setCurrentRound((prev) => prev + 1);
    setShowFeedback(false);
  }, [handleClearCanvas]);

  const handleFeedback = useCallback(
    async (isCorrect: boolean, feedback?: string) => {
      // 生成一个唯一的guessId
      const guessId = `game_guess_${Date.now()}_${currentRound}`;
      await submitFeedback(guessId, isCorrect, feedback);

      if (isCorrect) {
        setGameScore((prev) => prev + (lastGuess?.confidence || 0.5) * 100);
      }

      setShowFeedback(false);
    },
    [submitFeedback, lastGuess, currentRound]
  );

  const handleBackToHome = () => {
    navigate('/');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#28a745'; // 绿色 - 高置信度
    if (confidence >= 0.6) return '#ffc107'; // 黄色 - 中等置信度
    return '#dc3545'; // 红色 - 低置信度
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return '很确定';
    if (confidence >= 0.6) return '较为确定';
    return '不太确定';
  };

  return (
    <div className='game-container'>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        {/* 页面头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <button className='btn btn-secondary' onClick={handleBackToHome}>
            ← 返回首页
          </button>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0 }}>🎨 AI你画我猜</h1>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              轮次: {currentRound} | 得分: {Math.round(gameScore)}
            </div>
          </div>
          <button
            className='btn'
            onClick={() => setOfflineMode(!isOnline)}
            style={{
              background: isOnline ? '#1e7e34' : '#f39c12',
              color: 'white',
              padding: '8px 12px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            {isOnline ? '🟢 在线' : '🟡 离线'}
          </button>
        </div>

        {!gameStarted ? (
          <div className='card'>
            <h2>准备开始游戏</h2>
            <p>点击开始按钮，在画布上绘制你的图案，然后让AI来猜测！</p>
            <div
              style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}
            >
              <p>🎨 使用增强画布功能：</p>
              <ul style={{ textAlign: 'left', marginLeft: '20px' }}>
                <li>选择不同形状工具（画笔、橡皮擦、直线、矩形、圆形）</li>
                <li>使用24种颜色或自定义颜色</li>
                <li>调节画笔大小（1-50px）</li>
                <li>撤销/重做功能，支持50步历史</li>
                <li>键盘快捷键支持</li>
              </ul>
            </div>
            <button
              className='btn btn-primary'
              onClick={handleStartGame}
              style={{ padding: '15px 30px', fontSize: '16px' }}
            >
              开始绘制 🎨
            </button>
          </div>
        ) : (
          <>
            {/* 画布容器 */}
            <div className='drawing-canvas-container'>
              <DrawingCanvas ref={canvasRef} />

              {/* 画布状态栏 */}
              <div className='canvas-status'>
                <span>
                  ✏️ 工具: {canvasRef.current?.getCurrentTool() || '画笔'}
                </span>
                <span>
                  🎨 颜色: {canvasRef.current?.getCurrentColor() || '#000000'}
                </span>
                <span>📏 大小: {canvasRef.current?.getBrushSize() || 5}px</span>
                <span>
                  📋 步骤: {canvasRef.current?.getHistoryCount() || 0}
                </span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className='toolbar'>
              <button
                className='action-btn btn-primary'
                onClick={handleAIGuess}
                disabled={isAnalyzing}
                style={{ fontSize: '14px', padding: '12px 24px' }}
              >
                {isAnalyzing ? '🤔 AI思考中...' : '🤖 AI猜一猜'}
              </button>

              <button
                className='action-btn'
                onClick={handleClearCanvas}
                disabled={isAnalyzing}
              >
                🗑️ 清空画布
              </button>

              <button
                className='action-btn'
                onClick={() => canvasRef.current?.undo()}
                disabled={isAnalyzing || !canvasRef.current?.canUndo()}
              >
                ↶ 撤销
              </button>

              <button
                className='action-btn'
                onClick={() => canvasRef.current?.redo()}
                disabled={isAnalyzing || !canvasRef.current?.canRedo()}
              >
                ↷ 重做
              </button>
            </div>

            {/* AI分析结果 */}
            {isAnalyzing && (
              <div className='loading'>
                <div className='spinner'></div>
                <span style={{ marginLeft: '10px' }}>
                  AI正在分析你的画作...
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '5px',
                    }}
                  >
                    这通常需要几秒钟时间
                  </div>
                </span>
              </div>
            )}

            {/* AI错误提示 */}
            {error && (
              <div
                style={{
                  padding: '15px',
                  background: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '8px',
                  margin: '20px 0',
                  border: '1px solid #f5c6cb',
                }}
              >
                <strong>⚠️ 错误:</strong> {error}
                <div style={{ fontSize: '12px', marginTop: '5px' }}>
                  {isOnline
                    ? '请检查网络连接或稍后重试'
                    : '当前为离线模式，使用模拟AI响应'}
                </div>
              </div>
            )}

            {/* AI猜测结果显示 */}
            {lastGuess?.success && !isAnalyzing && (
              <div className='ai-result'>
                <h3>🤖 AI分析结果</h3>
                <div className='ai-guess'>{lastGuess.guess}</div>

                {/* 置信度显示 */}
                <div style={{ margin: '15px 0', textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '8px',
                    }}
                  >
                    AI置信度:
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: getConfidenceColor(lastGuess.confidence),
                      color: 'white',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                    }}
                  >
                    {Math.round(lastGuess.confidence * 100)}% -{' '}
                    {getConfidenceText(lastGuess.confidence)}
                  </div>
                </div>

                {/* 建议词汇 */}
                {lastGuess.suggestions && lastGuess.suggestions.length > 0 && (
                  <div style={{ margin: '15px 0' }}>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '8px',
                      }}
                    >
                      💡 相关词汇:
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        justifyContent: 'center',
                      }}
                    >
                      {lastGuess.suggestions.map((suggestion, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '4px 8px',
                            background: '#e9ecef',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 处理时间 */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    textAlign: 'center',
                    marginTop: '10px',
                  }}
                >
                  处理时间: {processingTime}ms
                </div>

                {/* 反馈区域 */}
                {showFeedback && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '15px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6',
                    }}
                  >
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                      你的画作识别准确吗？
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'center',
                      }}
                    >
                      <button
                        className='btn btn-primary'
                        onClick={() => handleFeedback(true)}
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        ✅ 正确！
                      </button>
                      <button
                        className='btn'
                        onClick={() => handleFeedback(false)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          background: '#6c757d',
                          color: 'white',
                        }}
                      >
                        ❌ 不对
                      </button>
                    </div>
                  </div>
                )}

                {/* 下一轮按钮 */}
                {!showFeedback && (
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      className='btn btn-primary'
                      onClick={handleNextRound}
                      style={{ padding: '10px 20px', fontSize: '14px' }}
                    >
                      🎯 下一轮
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GamePage;
