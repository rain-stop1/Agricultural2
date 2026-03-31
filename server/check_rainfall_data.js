const { WeatherData } = require('./models')

// 检查数据库中的天气数据
async function checkWeatherData() {
  try {
    console.log('检查数据库中的天气数据...')
    
    // 获取最新的天气数据
    const latestWeatherData = await WeatherData.findAll({
      order: [['record_time', 'DESC']],
      limit: 20
    })
    
    console.log(`\n最新的 ${latestWeatherData.length} 条天气数据:`)
    latestWeatherData.forEach(data => {
      console.log(`${data.region} - ${data.record_time.toLocaleString()}`)
      console.log(`  温度: ${data.temperature}°C`)
      console.log(`  湿度: ${data.humidity}%`)
      console.log(`  降雨量: ${data.rainfall}mm`)
      console.log(`  风速: ${data.wind_speed}m/s`)
      console.log(`  风向: ${data.wind_direction}`)
      console.log('---')
    })
    
    // 检查所有城市的最新数据
    const cities = ['beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hangzhou', 'nanjing', 'wuhan', 'chengdu', 'xian', 'tianjin', 'chongqing', 'shijiazhuang', 'jinan', 'qingdao', 'dalian', 'xiamen', 'suzhou', 'zhengzhou', 'changsha', 'hefei']
    
    console.log('\n各城市最新天气数据:')
    for (const city of cities) {
      const data = await WeatherData.findOne({
        where: { region: city },
        order: [['record_time', 'DESC']]
      })
      
      if (data) {
        console.log(`${city}: 降雨量 = ${data.rainfall}mm (${data.record_time.toLocaleString()})`)
      } else {
        console.log(`${city}: 无数据`)
      }
    }
    
  } catch (error) {
    console.error('检查天气数据失败:', error.message)
  }
}

checkWeatherData()
