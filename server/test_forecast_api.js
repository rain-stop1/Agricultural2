require('dotenv').config()
const weatherService = require('./services/weatherService')

async function testForecastAPI() {
  console.log('开始测试天气预报API...\n')
  
  try {
    const location = 'beijing'
    const days = 3
    
    console.log(`测试获取 ${location} 的 ${days} 天天气预报...`)
    const forecastData = await weatherService.getWeatherForecast(location, days)
    
    console.log('✅ 成功获取天气预报数据:')
    console.log(JSON.stringify(forecastData, null, 2))
  } catch (error) {
    console.error('❌ 获取天气预报失败:', error)
    console.error('错误堆栈:', error.stack)
  }
}

testForecastAPI()
