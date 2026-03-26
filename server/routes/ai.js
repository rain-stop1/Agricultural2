const express = require('express')
const axios = require('axios')
const { authenticateToken, optionalAuth } = require('../middleware/auth')
const OpenAI = require('openai')

const router = express.Router()

// 初始化OpenAI客户端（用于调用Qwen3.5-Plus API）
const openai = new OpenAI({
    apiKey: process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})

// AI对话接口
router.post('/chat', [
  authenticateToken,
], async (req, res) => {
  try {
    const { message } = req.body
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        code: 400,
        message: '请提供有效的消息内容'
      })
    }
    
    // 调用AI模型API
    const aiResponse = await getAIResponse(message)
    
    res.json({
      code: 200,
      message: '获取AI回复成功',
      data: aiResponse
    })
  } catch (error) {
    console.error('AI对话错误:', error)
    res.status(500).json({
      code: 500,
      message: 'AI对话失败，请稍后再试'
    })
  }
})

// 调用AI模型API的函数
async function getAIResponse(message) {
  // 使用Qwen3.5-Plus API（OpenAI兼容模式）
  const qwenApiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY
  
  console.log('=== Qwen API调用开始 ===')
  console.log('API Key配置:', qwenApiKey ? '已配置' : '未配置')
  console.log('用户消息:', message)
  
  // 如果没有配置Qwen API密钥，尝试使用OpenAI作为备选
  if (!qwenApiKey) {
    console.warn('Qwen API密钥未配置，尝试使用OpenAI API')
    return getOpenAIResponse(message)
  }
  
  try {
    console.log('调用Qwen3.5-Plus API...')
    const response = await openai.chat.completions.create({
      model: 'qwen3.5-plus',
      messages: [
        {
          role: 'system',
          content: '你是农业灾害预警系统的AI助手，专业回答农业灾害相关问题，提供实用的建议和信息。'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7
    })
    
    console.log('Qwen API调用成功！')
    console.log('回复内容:', response.choices[0].message.content)
    console.log('=== Qwen API调用结束 ===')
    // 去掉Markdown加粗标记
    const cleanContent = response.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, '$1')
    return cleanContent
  } catch (error) {
    console.error('Qwen API错误:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    console.log('=== Qwen API调用结束 ===')
    // 出错时尝试使用OpenAI作为备选
    return getOpenAIResponse(message)
  }
}

// OpenAI API调用函数（作为备选）
async function getOpenAIResponse(message) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  
  // 如果没有配置OpenAI API密钥，返回模拟回复
  if (!openaiApiKey) {
    return getMockAIResponse(message)
  }
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是农业灾害预警系统的AI助手，专业回答农业灾害相关问题，提供实用的建议和信息。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        }
      }
    )
    
    // 去掉Markdown加粗标记
    const cleanContent = response.data.choices[0].message.content.replace(/\*\*(.*?)\*\*/g, '$1')
    return cleanContent
  } catch (error) {
    console.error('OpenAI API错误:', error)
    // 出错时返回模拟回复
    return getMockAIResponse(message)
  }
}

// 模拟AI回复函数（当API密钥未配置或调用失败时使用）
function getMockAIResponse(message) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('灾害') || lowerMessage.includes('预警')) {
    return '根据当前天气数据，建议您密切关注天气变化，做好灾害预防措施。如果遇到紧急情况，请及时启动应急预案。'
  } else if (lowerMessage.includes('天气')) {
    return '当前天气数据已更新，您可以在灾害预警模块查看详细的天气信息和预警状态。'
  } else if (lowerMessage.includes('帮助') || lowerMessage.includes('你好')) {
    return '你好！我是农业灾害预警系统的AI助手，可以回答关于农业灾害预警、天气监测、应急措施等相关问题。请问有什么可以帮助你的？'
  } else {
    return '感谢您的咨询。作为农业灾害预警系统的AI助手，我可以为您提供灾害预警、天气监测、应急措施等相关信息和建议。'
  }
}

module.exports = router