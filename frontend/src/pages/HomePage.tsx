import React from 'react'
import { useNavigate } from 'react-router-dom'

const HomePage: React.FC = () => {
  const navigate = useNavigate()

  const startGame = () => {
    navigate('/game')
  }

  return (
    <div className="game-container">
      <div className="card">
        <h1>🎨 AI你画我猜游戏</h1>
        <p style={{ margin: '20px 0', fontSize: '18px', color: '#666' }}>
          绘制图片，让AI来猜测你画的是什么！
        </p>
        <button 
          className="btn btn-primary" 
          onClick={startGame}
          style={{ padding: '15px 30px', fontSize: '16px' }}
        >
          开始游戏 🚀
        </button>
      </div>
      
      <div style={{ marginTop: '40px', color: 'white', opacity: 0.8 }}>
        <h3>游戏说明</h3>
        <p>1. 使用鼠标在画布上绘制图案</p>
        <p>2. 选择不同的颜色和画笔大小</p>
        <p>3. 点击"AI猜一猜"让AI识别你的作品</p>
        <p>4. 看看AI能否猜中你的绘画！</p>
      </div>
    </div>
  )
}

export default HomePage