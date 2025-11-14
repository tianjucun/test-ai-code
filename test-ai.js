// 快速测试OpenAI API调用是否正常工作
const testAI = async () => {
  try {
    console.log('🧪 测试AI API调用...')
    
    // 简单的测试图片数据 (1x1像素的PNG图片)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    const response = await fetch('http://localhost:3003/api/ai-guess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: testImage
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ AI API调用成功!')
      console.log('🤖 猜测结果:', result.guess)
      console.log('📊 置信度:', result.confidence)
      console.log('⏱️ 处理时间:', result.processingTime, 'ms')
    } else {
      console.log('⚠️ AI API调用失败:', result.error || '未知错误')
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testAI()