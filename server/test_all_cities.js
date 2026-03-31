require('dotenv').config()
const weatherService = require('./services/weatherService')

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function testAllCities() {
  console.log('开始测试所有城市的天气API调用...\n')
  
  const cities = weatherService.getSupportedCities()
  console.log(`共有 ${cities.length} 个城市需要测试`)
  console.log(`API限制: 每秒1次请求，每次请求间隔1000ms\n`)
  
  const results = {
    success: [],
    failed: [],
    mock: []
  }
  
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i]
    console.log(`\n[${i + 1}/${cities.length}] 正在获取 ${city.name}(${city.code}) 的天气数据...`)
    
    try {
      const weatherData = await weatherService.getRealWeather(city.code)
      
      if (weatherData.is_mock) {
        results.mock.push({
          code: city.code,
          name: city.name,
          reason: '使用了模拟数据'
        })
        console.log(`❌ ${city.name}(${city.code}): 使用模拟数据`)
      } else {
        results.success.push({
          code: city.code,
          name: city.name,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          rainfall: weatherData.rainfall,
          weather: weatherData.weather_text
        })
        console.log(`✅ ${city.name}(${city.code}): 真实数据 - ${weatherData.weather_text}, ${weatherData.temperature}°C, 湿度${weatherData.humidity}%, 降雨${weatherData.rainfall}mm`)
      }
    } catch (error) {
      results.failed.push({
        code: city.code,
        name: city.name,
        error: error.message
      })
      console.log(`❌ ${city.name}(${city.code}): 调用失败 - ${error.message}`)
    }
    
    // 添加延迟，确保不超过每秒1次的限制（每次请求间隔1000ms）
    if (i < cities.length - 1) {
      await delay(1000)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('测试结果汇总:')
  console.log('='.repeat(50))
  console.log(`✅ 成功获取真实数据: ${results.success.length} 个城市`)
  console.log(`❌ 使用模拟数据: ${results.mock.length} 个城市`)
  console.log(`💥 调用失败: ${results.failed.length} 个城市`)
  console.log(`📊 总计: ${cities.length} 个城市`)
  
  if (results.mock.length > 0) {
    console.log('\n使用模拟数据的城市:')
    results.mock.forEach(city => {
      console.log(`  - ${city.name}(${city.code}): ${city.reason}`)
    })
  }
  
  if (results.failed.length > 0) {
    console.log('\n调用失败的城市:')
    results.failed.forEach(city => {
      console.log(`  - ${city.name}(${city.code}): ${city.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(50))
  if (results.success.length === cities.length) {
    console.log('🎉 所有城市都成功获取了真实天气数据！')
  } else {
    console.log(`⚠️  共有 ${results.mock.length + results.failed.length} 个城市未能获取真实数据`)
  }
}

testAllCities()
