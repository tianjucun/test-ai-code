import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react'

export interface DrawingCanvasProps {
  onImageReady?: (imageData: string) => void
  width?: number
  height?: number
  enableTouch?: boolean
  showGrid?: boolean
}

export interface DrawingCanvasRef {
  exportImage: (format?: 'png' | 'jpeg', quality?: number) => string | null
  clearCanvas: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  hasContent: () => boolean
  getCurrentTool: () => string
  getCurrentColor: () => string
  getBrushSize: () => number
  getHistoryCount: () => number
}

interface Point {
  x: number
  y: number
}

interface DrawingHistory {
  imageData: ImageData
  timestamp: number
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ onImageReady, width = 500, height = 500, enableTouch = true, showGrid = false }, ref) => {
    const [isDrawing, setIsDrawing] = useState(false)
    const [currentColor, setCurrentColor] = useState('#000000')
    const [brushSize, setBrushSize] = useState(5)
    const [tool, setTool] = useState<'brush' | 'eraser' | 'line' | 'circle' | 'rectangle'>('brush')
    const [shapes, setShapes] = useState<'none' | 'line' | 'circle' | 'rectangle'>('none')
    const [startPoint, setStartPoint] = useState<Point | null>(null)
    const [currentShape, setCurrentShape] = useState<any>(null)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [history, setHistory] = useState<DrawingHistory[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [isMobile, setIsMobile] = useState(false)
    
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const colorPickerRef = useRef<HTMLInputElement>(null)

    // 检测移动设备
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // 初始化画布
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 设置画布属性
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.imageSmoothingEnabled = true
      
      // 设置白色背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 保存初始状态
      saveToHistory()
    }, [])

    // 保存历史记录
    const saveToHistory = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push({
        imageData,
        timestamp: Date.now()
      })

      // 限制历史记录数量
      if (newHistory.length > 50) {
        newHistory.shift()
      } else {
        setHistoryIndex(newHistory.length - 1)
      }

      setHistory(newHistory)
    }, [history, historyIndex])

    // 撤销
    const undo = useCallback(() => {
      if (historyIndex > 0) {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        setHistoryIndex(historyIndex - 1)
        ctx.putImageData(history[historyIndex - 1].imageData, 0, 0)
      }
    }, [history, historyIndex])

    // 重做
    const redo = useCallback(() => {
      if (historyIndex < history.length - 1) {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        setHistoryIndex(historyIndex + 1)
        ctx.putImageData(history[historyIndex + 1].imageData, 0, 0)
      }
    }, [history, historyIndex])

    // 获取鼠标/触摸位置
    const getCanvasPoint = (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      }
    }

    // 开始绘制
    const startDrawing = (clientX: number, clientY: number) => {
      setIsDrawing(true)
      const point = getCanvasPoint(clientX, clientY)
      setStartPoint(point)

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (shapes !== 'none') {
        setCurrentShape({ start: point, current: point })
      } else {
        ctx.beginPath()
        ctx.moveTo(point.x, point.y)
      }
    }

    // 绘制过程
    const draw = (clientX: number, clientY: number) => {
      if (!isDrawing) return

      const canvas = canvasRef.current
      if (!canvas) return

      const point = getCanvasPoint(clientX, clientY)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (shapes !== 'none' && startPoint) {
        // 形状绘制模式
        setCurrentShape({ start: startPoint, current: point })
        
        // 先恢复画布状态
        if (historyIndex >= 0) {
          ctx.putImageData(history[historyIndex].imageData, 0, 0)
        }
        
        drawShape(ctx, startPoint, point, shapes)
      } else {
        // 自由绘制模式
        if (tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.strokeStyle = 'rgba(0,0,0,1)'
        } else {
          ctx.globalCompositeOperation = 'source-over'
          ctx.strokeStyle = currentColor
        }

        ctx.lineWidth = brushSize
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    }

    // 结束绘制
    const stopDrawing = () => {
      if (isDrawing) {
        setIsDrawing(false)
        setStartPoint(null)
        setCurrentShape(null)
        
        if (shapes === 'none') {
          saveToHistory()
        }
      }
    }

    // 绘制形状
    const drawShape = (ctx: CanvasRenderingContext2D, start: Point, end: Point, shape: string) => {
      ctx.strokeStyle = currentColor
      ctx.lineWidth = brushSize
      ctx.globalCompositeOperation = 'source-over'

      switch (shape) {
        case 'line':
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
          break
        
        case 'circle':
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
          ctx.beginPath()
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
          ctx.stroke()
          break
        
        case 'rectangle':
          ctx.beginPath()
          ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y)
          ctx.stroke()
          break
      }
    }

    // 鼠标事件处理
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      startDrawing(e.clientX, e.clientY)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      draw(e.clientX, e.clientY)
    }

    // 触摸事件处理
    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const touch = e.touches[0]
      startDrawing(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const touch = e.touches[0]
      draw(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      stopDrawing()
    }

    // 清空画布
    const clearCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      saveToHistory()
    }

    // 导出图片
    const exportImage = (format: 'png' | 'jpeg' = 'png', quality: number = 0.8, download: boolean = true): string | null => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const dataURL = canvas.toDataURL(`image/${format}`, quality)
      
      // 回调通知父组件
      if (onImageReady) {
        onImageReady(dataURL)
      }

      // 只在需要时下载
      if (download) {
        const link = document.createElement('a')
        link.download = `drawing-${Date.now()}.${format}`
        link.href = dataURL
        link.click()
      }
      
      return dataURL
    }

    // 设置画笔颜色
    const setBrushColor = (color: string) => {
      setCurrentColor(color)
      setShowColorPicker(false)
    }

    // 预设颜色
    const presetColors = [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
      '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB',
      '#A52A2A', '#808080', '#000080', '#008080', '#FF8C00', '#4B0082',
      '#DC143C', '#32CD32', '#FF1493', '#1E90FF', '#FFD700', '#ADFF2F'
    ]

    // 暴露方法给父组件
    React.useImperativeHandle(ref, () => ({
      exportImage: (format?: string, quality?: number, download?: boolean) => exportImage(format as any, quality, download),
      clearCanvas: () => clearCanvas(),
      undo: () => undo(),
      redo: () => redo(),
      canUndo: () => historyIndex > 0,
      canRedo: () => historyIndex < history.length - 1,
      hasContent: () => history.length > 0,
      getCurrentTool: () => tool,
      getCurrentColor: () => currentColor,
      getBrushSize: () => brushSize,
      getHistoryCount: () => historyIndex + 1,
      getImageData: () => canvasRef.current?.toDataURL() || '',
      getImageDataBase64: () => {
        const dataURL = canvasRef.current?.toDataURL('image/png')
        return dataURL ? dataURL.replace(/^data:image\/(png|jpg|jpeg);base64,/, '') : ''
      }
    }))

    // 键盘快捷键
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 'z':
              e.preventDefault()
              if (e.shiftKey) {
                redo()
              } else {
                undo()
              }
              break
            case 'y':
              e.preventDefault()
              redo()
              break
            case 's':
              e.preventDefault()
              exportImage()
              break
          }
        }
        if (e.key === 'Escape') {
          setCurrentShape(null)
          setIsDrawing(false)
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo])

    return (
      <div className="drawing-canvas-container">
        {/* 工具栏 */}
        <div className="toolbar">
          <div className="tool-section">
            <span className="tool-label">工具:</span>
            <div className="tool-buttons">
              {[
                { key: 'brush', icon: '🖌️', label: '画笔' },
                { key: 'eraser', icon: '🧽', label: '橡皮擦' },
                { key: 'line', icon: '📏', label: '直线' },
                { key: 'circle', icon: '⭕', label: '圆形' },
                { key: 'rectangle', icon: '⬜', label: '矩形' }
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  className={`tool-btn ${tool === key ? 'active' : ''}`}
                  onClick={() => setTool(key as any)}
                  title={label}
                >
                  <span className="tool-icon">{icon}</span>
                  <span className="tool-text">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tool-section">
            <span className="tool-label">颜色:</span>
            <div className="color-section">
              <button
                className="current-color"
                style={{ backgroundColor: currentColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="选择颜色"
              />
              <div className={`color-palette ${showColorPicker ? 'show' : ''}`}>
                {presetColors.map(color => (
                  <button
                    key={color}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                    title={color}
                  />
                ))}
                <input
                  ref={colorPickerRef}
                  type="color"
                  value={currentColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="color-picker-input"
                />
              </div>
            </div>
          </div>

          <div className="tool-section">
            <span className="tool-label">大小:</span>
            <div className="brush-controls">
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="brush-slider"
              />
              <span className="brush-size">{brushSize}px</span>
            </div>
          </div>

          <div className="tool-section action-buttons">
            <button
              className="action-btn"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="撤销 (Ctrl+Z)"
            >
              ↶ 撤销
            </button>
            <button
              className="action-btn"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="重做 (Ctrl+Y)"
            >
              ↷ 重做
            </button>
            <button className="action-btn" onClick={clearCanvas} title="清空画布">
              🗑️ 清空
            </button>
            <button
              className="action-btn"
              onClick={() => exportImage('png')}
              title="导出图片 (Ctrl+S)"
            >
              💾 导出
            </button>
          </div>
        </div>

        {/* 画布容器 */}
        <div className="canvas-container" style={{ position: 'relative' }}>
          {/* 网格线 */}
          {showGrid && (
            <div
              className="grid-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                  linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
          )}
          
          {/* 画布 */}
          <canvas
            ref={canvasRef}
            className={`drawing-canvas ${isMobile ? 'mobile' : ''}`}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={enableTouch ? handleTouchStart : undefined}
            onTouchMove={enableTouch ? handleTouchMove : undefined}
            onTouchEnd={enableTouch ? handleTouchEnd : undefined}
            style={{
              maxWidth: '100%',
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: tool === 'eraser' ? 'grab' : tool === 'brush' ? 'crosshair' : 'pointer',
              display: 'block',
              margin: '0 auto',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        {/* 当前状态信息 */}
        <div className="canvas-status">
          <span>工具: {tool}</span>
          <span>颜色: {currentColor}</span>
          <span>大小: {brushSize}px</span>
          <span>历史: {historyIndex + 1}/{history.length}</span>
        </div>
      </div>
    )
  }
)

DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas