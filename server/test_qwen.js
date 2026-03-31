require('dotenv').config()
const OpenAI = require('openai')

// 初始化OpenAI客户端（用于调用Qwen3.5-Plus API）
const openai = new OpenAI({
    apiKey: process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})

async function testQwenAPI() {
    try {
        console.log('测试Qwen3.5-Plus API...')
        console.log('API Key:', process.env.QWEN_API_KEY ? '已配置' : '未配置')
        console.log('Base URL:', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
        
        const response = await openai.chat.completions.create({
            model: 'qwen3.5-plus',
            messages: [
                {
                    role: 'system',
                    content: '你是农业灾害预警系统的AI助手，专业回答农业灾害相关问题，提供实用的建议和信息。'
                },
                {
                    role: 'user',
                    content: '你好，我想了解农业灾害预警信息'
                }
            ],
            temperature: 0.7
        })
        
        console.log('\n✅ Qwen API调用成功！')
        console.log('回复内容:', response.choices[0].message.content)
    } catch (error) {
        console.log('\n❌ Qwen API调用失败:')
        console.error('错误信息:', error.message)
        if (error.response) {
            console.error('响应状态:', error.response.status)
            console.error('响应数据:', error.response.data)
        }
    }
}

testQwenAPI()
