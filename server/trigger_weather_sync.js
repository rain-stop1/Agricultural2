const weatherService = require('./services/weatherService')

// 手动触发天气数据同步
async function triggerWeatherSync() {
  try {
    console.log('手动触发天气数据同步...')
    
    // 同步所有支持的城市
    const cities = weatherService.getSupportedCities().map(city => city.code)
    console.log('要同步的城市:', cities)
    
    const results = await weatherService.syncWeatherData(cities)
    
    console.log('\n同步结果:')
    results.forEach(result => {
      if (result.success) {
        if (result.data) {
          console.log(`✅ ${result.location}: 成功 - 降雨量 ${result.data.rainfall.toFixed(2)}mm`)
        } else {
          console.log(`⏭️ ${result.location}: ${result.message}`)
        }
      } else {
        console.log(`❌ ${result.location}: ${result.error}`)
      }
    })
    
  } catch (error) {
    console.error('触发天气数据同步失败:', error.message)
  }
}

triggerWeatherSync()
